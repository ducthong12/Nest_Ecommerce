import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Product, ProductDocument } from '../schemas/product.schema';
import { Model, Types } from 'mongoose';
import { CreateProductDto } from 'common/dto/product/create-product.dto';
import { FilterProductDto } from 'common/dto/product/filter-product.dto';
import { Category } from '../schemas/category.schema';
import { CreateBrandDto } from 'common/dto/product/create-brand.dto';
import { Brand } from '../schemas/brand.schema';
import { CreateCategoryDto } from 'common/dto/product/create-category.dto';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(Brand.name) private brandModel: Model<Brand>,
    @Inject('PRODUCT_KAFKA_CLIENT') private readonly kafkaClient: ClientKafka,
  ) {}

  // 1. Tạo mới
  async create(createProductDto: CreateProductDto): Promise<Product> {
    console.log('Creating product:', createProductDto);
    const prices = createProductDto.variants.map((v) => v.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    const newProduct = new this.productModel({
      ...createProductDto,
      min_price: minPrice,
      max_price: maxPrice,
      sold_count: 0,
      rating: 0.0,
      likesCount: 0,
      viewCount: 0,
      brand: new Types.ObjectId(createProductDto.brand),
      category: new Types.ObjectId(createProductDto.category),
    });
    const savedProduct = await newProduct.save();

    const kafkaPayload = {
      id: savedProduct._id.toString(), // Quan trọng: ES cần ID string
      name: savedProduct.name,
      description: savedProduct.description,
      thumbnail_url: savedProduct.thumbnail_url,
      min_price: savedProduct.min_price,
      max_price: savedProduct.max_price,
      brand_id: savedProduct.brand.toString(),
      category_id: savedProduct.category.toString(),
      variants: savedProduct.variants.map((v) => ({
        sku: v.sku,
        price: v.price,
        image_url: v.image_url,
        attributes: v.attributes.map((attr) => ({
          k: attr.k,
          v: attr.v,
        })),
      })),     
      specifications: savedProduct.specifications,
    };

    this.kafkaClient.emit('search.create_product', kafkaPayload);

    return savedProduct;
  }

  // 2. Lấy danh sách (Có phân trang, search, sort, populate tối ưu)
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

  // 3. Lấy chi tiết (Tự động tăng viewCount)
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

  // 4. Update thông tin
  async update(
    id: string,
    updateData: Partial<CreateProductDto>,
  ): Promise<Product> {
    const updatedProduct = await this.productModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .lean();

    if (!updatedProduct) throw new NotFoundException('Không tìm thấy sản phẩm');
    return updatedProduct as Product;
  }

  // 5. Create category
  async createCategory(
    createCategoryDto: CreateCategoryDto,
  ): Promise<Category> {
    const newCategory = await this.categoryModel.create(createCategoryDto);
    return newCategory.save();
  }

  // 6. Create brand
  async createBrand(createBrandDto: CreateBrandDto): Promise<Brand> {
    const newBrand = await this.brandModel.create(createBrandDto);
    return newBrand.save();
  }
}
