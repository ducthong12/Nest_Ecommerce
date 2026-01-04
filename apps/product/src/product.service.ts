import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Product, ProductDocument } from '../schemas/product.schema';
import { Model, Types } from 'mongoose';
import { CreateProductDto, CreateProductVariantDto } from 'common/dto/product/create-product.dto';
import { FilterProductDto } from 'common/dto/product/filter-product.dto';
import { Category } from '../schemas/category.schema';
import { CreateBrandDto } from 'common/dto/product/create-brand.dto';
import { Brand } from '../schemas/brand.schema';
import { CreateCategoryDto } from 'common/dto/product/create-category.dto';
import { ClientKafka } from '@nestjs/microservices';
import { UpdateProductDto } from 'common/dto/product/update-product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(Brand.name) private brandModel: Model<Brand>,
    @Inject('PRODUCT_KAFKA_CLIENT') private readonly kafkaClient: ClientKafka,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const { minPrice, maxPrice } = this.calculateMinMaxPrice(createProductDto.variants);

    const newProduct = new this.productModel({
      ...createProductDto,
      min_price: minPrice,
      max_price: maxPrice,
      sold_count: 0,
      rating: 0.0,
      likes_count: 0,
      view_count: 0,
      brand: new Types.ObjectId(createProductDto.brand),
      category: new Types.ObjectId(createProductDto.category),
    });
    const savedProduct = await newProduct.save();
    const { brand_name, category_name } = await this.getBrandProductNameById(createProductDto.brand, createProductDto.category);

    const kafkaPayload = this.prepareKafkaPayloadCreate(savedProduct._id.toString(), { ...savedProduct.toObject(), brand_name, category_name });

    this.kafkaClient.emit('search.create_product', kafkaPayload);

    return savedProduct;
  }

  async findAll(query: FilterProductDto) {
    const { search, page = 1, limit = 10, sort, categoryId } = query;
    const skip = (page - 1) * limit;

    // Xây dựng filter query
    const filter: any = { isActive: true };

    // Tận dụng Text Index đã khai báo trong Schema
    if (search) {
      filter.$text = { $search: search };
    }

    if (categoryId) {
      filter.category = new Types.ObjectId(categoryId);
    }

    // Xử lý Sort
    let sortOption: any = { createdAt: -1 }; // Mặc định mới nhất
    if (sort === 'price_asc') sortOption = { price: 1 };
    if (sort === 'price_desc') sortOption = { price: -1 };
    if (search) sortOption = { score: { $meta: 'textScore' } }; // Ưu tiên độ khớp từ khóa

    // Query DB song song (đếm tổng + lấy data)
    const [products, total] = await Promise.all([
      this.productModel
        .find(filter)
        .select('-__v -updatedAt') // OPTIMIZE: Bỏ các trường không cần thiết
        .populate('brand', 'name logo') // OPTIMIZE: Chỉ lấy name và logo của Brand
        .populate('category', 'name') // OPTIMIZE: Chỉ lấy name của Category
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean(), // OPTIMIZE: Quan trọng nhất để tăng tốc độ đọc

      this.productModel.countDocuments(filter),
    ]);

    return {
      data: products,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Product> {
    if (!Types.ObjectId.isValid(id))
      throw new NotFoundException('ID không hợp lệ');

    // Dùng findOneAndUpdate để vừa lấy data vừa tăng view (Atomic Update)
    const product = await this.productModel
      .findByIdAndUpdate(
        id,
        { $inc: { viewCount: 1 } }, // Tăng view nguyên tử, an toàn hơn fetch -> save
        { new: true }, // Trả về data mới sau khi update
      )
      .populate('brand', 'name description logo')
      .populate('category', 'name slug')
      .lean();

    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');

    return product as Product;
  }

  async update(
    id: number,
    updateData: Partial<CreateProductDto>,
  ): Promise<Product> {
    const updatedProduct = await this.productModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .lean();

    if (!updatedProduct) throw new NotFoundException('Not found product');

    const kafkaPayload = this.prepareKafkaPayloadUpdate(id.toString(), updatedProduct);

    this.kafkaClient.emit('search.update_product', kafkaPayload);

    return updatedProduct as Product;
  }

  async createCategory(
    createCategoryDto: CreateCategoryDto,
  ): Promise<Category> {
    const newCategory = await this.categoryModel.create(createCategoryDto);
    return newCategory.save();
  }

  async createBrand(createBrandDto: CreateBrandDto): Promise<Brand> {
    const newBrand = await this.brandModel.create(createBrandDto);
    return newBrand.save();
  }

  private calculateMinMaxPrice(variants: CreateProductVariantDto[]) {
    const prices = variants.map((v) => v.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    return { minPrice, maxPrice };
  }

  private getBrandProductNameById = async (brandId?: string, categoryId?: string) => {
    let brand = undefined, category = undefined;

    if(brandId)
      brand = await this.brandModel.findById(brandId).lean();
    if(categoryId)
      category = await this.categoryModel.findById(categoryId).lean();

    return {
      brand_name: brand?.name || '',
      category_name: category?.name || '',
    };
  };

  private prepareKafkaPayloadCreate = (id: string, product: Product & { brand_name: string; category_name: string }) => {
    const kafkaPayload = {
      ...product,
      id: id.toString(),
      brand_id: product.brand.toString(),
      category_id: product.category.toString(),
      brand_name: product.brand_name,
      category_name: product.category_name,
      variants: product.variants.map((v) => ({
        sku: v.sku,
        price: v.price,
        image_url: v.image_url,
        attributes: v.attributes.map((attr) => ({
          k: attr.k,
          v: attr.v,
        })),
      })),     
    };

    return kafkaPayload;
  }

  private prepareKafkaPayloadUpdate = (id: string, product: Partial<Product>) => {
    const kafkaPayload = {
      ...product,
      id: id.toString()
    };

    if(product.brand)
      kafkaPayload['brand_id'] = product.brand.toString();

    if(product.category)
      kafkaPayload['category_id'] = product.category.toString();

    return kafkaPayload;
  }
}
