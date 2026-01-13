import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Product, ProductDocument } from '../schemas/product.schema';
import { Connection, Model, ObjectId, Types } from 'mongoose';
import {
  CreateProductDto,
  ProductVariantDto,
} from 'common/dto/product/create-product.dto';
import { FilterProductDto } from 'common/dto/product/filter-product.dto';
import { Category } from '../schemas/category.schema';
import { CreateBrandDto } from 'common/dto/product/create-brand.dto';
import { Brand } from '../schemas/brand.schema';
import { CreateCategoryDto } from 'common/dto/product/create-category.dto';
import { ClientKafka } from '@nestjs/microservices';
import { UpdateProductDto } from 'common/dto/product/update-product.dto';
import {
  bufferCount,
  bufferTime,
  filter,
  merge,
  Subject,
  Subscription,
} from 'rxjs';
import { UpdateSnapShotProductDto } from 'common/dto/product/updateSnapshot-product.dto';
import { UpdatePriceDto } from 'common/dto/product/update-price.dto';

interface KafkaProductPayload extends Omit<Product, 'variants'> {
  brand_name: string;
  category_name: string;
  createdAt: Date;
  variants: ProductVariantDto[];
}

interface KafkaProductVariantPayload extends ProductVariantDto {}

@Injectable()
export class ProductService {
  private logSubject = new Subject<any>();
  private subscription: Subscription;
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(Brand.name) private brandModel: Model<Brand>,
    @Inject('PRODUCT_KAFKA_CLIENT') private readonly kafkaClient: ClientKafka,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  onModuleInit() {
    this.subscription = merge(
      this.logSubject.pipe(bufferTime(500)),
      this.logSubject.pipe(bufferCount(100)),
    )
      .pipe(
        filter((events) => {
          return events.length > 0;
        }),
      )
      .subscribe(async (batchEvents: UpdateSnapShotProductDto[]) => {
        await this.processBatch(batchEvents);
      });
  }

  onModuleDestroy() {
    this.subscription.unsubscribe();
  }

  async addToBuffer(message: UpdateSnapShotProductDto) {
    this.logSubject.next(message);
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const { minPrice, maxPrice } = this.calculateMinMaxPrice(
      createProductDto.variants,
    );

    const newProduct = new this.productModel({
      ...createProductDto,
      minPrice: minPrice,
      maxPrice: maxPrice,
      soldCount: 0,
      rating: 0.0,
      likesCount: 0,
      viewCount: 0,
      brand: new Types.ObjectId(createProductDto.brand),
      category: new Types.ObjectId(createProductDto.category),
    });

    const savedProduct = await newProduct.save();
    const { brand_name, category_name } = await this.getBrandProductNameById(
      createProductDto.brand,
      createProductDto.category,
    );

    const kafkaPayload = this.prepareKafkaPayloadCreate(
      savedProduct._id.toString(),
      { ...savedProduct.toObject(), brand_name, category_name },
    );

    this.kafkaClient.emit('search.create_product', kafkaPayload);

    return savedProduct;
  }

  async createMany({
    products,
  }: {
    products: CreateProductDto[];
  }): Promise<{ products: Product[] }> {
    const data = products.map((dto) => {
      const { minPrice, maxPrice } = this.calculateMinMaxPrice(dto.variants);
      return {
        ...dto,
        minPrice: minPrice,
        maxPrice: maxPrice,
        soldCount: 0,
        rating: 0.0,
        likesCount: 0,
        viewCount: 0,
        brand: new Types.ObjectId(dto.brand),
        category: new Types.ObjectId(dto.category),
      };
    });

    const newProductArr = await this.productModel.insertMany(data);

    for (const savedProduct of newProductArr) {
      const { brand_name, category_name } = await this.getBrandProductNameById(
        savedProduct.brand.toString(),
        savedProduct.category.toString(),
      );

      const kafkaPayload = this.prepareKafkaPayloadCreate(
        savedProduct._id.toString(),
        { ...savedProduct.toObject(), brand_name, category_name },
      );

      this.kafkaClient.emit('search.create_product', kafkaPayload);
    }

    return { products: newProductArr as unknown as Product[] };
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
        .select('-__v -updatedAt')
        .populate('brand', 'name logo')
        .populate('category', 'name')
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean(),

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

    const product = await this.productModel
      .findByIdAndUpdate(id, { $inc: { viewCount: 1 } }, { new: true })
      //.populate('brand', 'name description logo')
      //.populate('category', 'name slug')
      .select('-__v')
      .lean();

    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');

    return product;
  }

  async update(id: string, updateData: UpdateProductDto): Promise<Product> {
    const updatedProduct = await this.productModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .lean();

    if (!updatedProduct) throw new NotFoundException('Not found product');

    const kafkaPayload = this.prepareKafkaPayloadUpdate(id.toString(), {
      ...updateData,
    } as unknown as Omit<Partial<KafkaProductPayload>, 'id'>);

    this.kafkaClient.emit('search.update_product', kafkaPayload);

    return updatedProduct as Product;
  }

  async updatePrice(updateData: UpdatePriceDto): Promise<Product> {
    const updatedProduct = await this.productModel
      .findOneAndUpdate(
        { 'variants.sku': updateData.sku },
        { 'variants.$.price': updateData.price },
      )
      .lean();

    if (!updatedProduct) throw new NotFoundException('Not found product');

    const { minPrice, maxPrice } = this.calculateMinMaxPrice(
      updatedProduct.variants,
    );

    const kafkaPayload = this.prepareKafkaPayloadUpdate(
      updateData.productId.toString(),
      {
        variants: updatedProduct.variants,
        minPrice,
        maxPrice,
      },
    );

    this.kafkaClient.emit('search.update_product', kafkaPayload);

    return updatedProduct as Product;
  }

  async updateMany(updateDataMany: Array<UpdateProductDto>): Promise<boolean> {
    const updatedProductArr = await this.productModel
      .updateMany(
        {
          _id: {
            $in: updateDataMany.map((data) => new Types.ObjectId(data.id)),
          },
        },
        { $set: updateDataMany },
      )
      .lean();

    if (!updatedProductArr)
      throw new NotFoundException('Not found array product');

    for (const data of updateDataMany) {
      const kafkaPayload = this.prepareKafkaPayloadUpdate(
        data.id.toString(),
        updatedProductArr as unknown as Omit<
          Partial<KafkaProductPayload>,
          'id'
        >,
      );

      this.kafkaClient.emit('search.update_product', kafkaPayload);
    }

    return true;
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

  private calculateStockChanges(
    data: UpdateSnapShotProductDto[],
  ): Record<string, number> {
    return data.reduce(
      (acc, log) => {
        const key = log.sku;
        if (!acc[key]) acc[key] = 0;

        if (log.type === 'OUTBOUND') {
          acc[key] -= log.quantity;
        } else {
          acc[key] += log.quantity;
        }

        return acc;
      },
      {} as Record<string, number>,
    );
  }

  private async processBatch(events: UpdateSnapShotProductDto[]) {
    const stockChanges = this.calculateStockChanges(events);
    const result = [];

    const session = await this.connection.startSession();

    session.startTransaction();

    try {
      for (const [sku, changeAmount] of Object.entries(stockChanges)) {
        const data = await this.productModel.findOneAndUpdate(
          { 'variants.sku': sku },
          { $inc: { 'variants.$.stockSnapshot': changeAmount } },
          { session },
        );

        result.push(data);
      }

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      await session.endSession();
      throw error;
    } finally {
      await session.endSession();
    }

    for (const updatedProduct of result) {
      const kafkaPayload = this.prepareKafkaPayloadUpdate(
        updatedProduct.id.toString(),
        {
          variants: updatedProduct.variants,
        },
      );

      this.kafkaClient.emit('search.update_product', kafkaPayload);
    }
  }

  private calculateMinMaxPrice(variants: ProductVariantDto[]) {
    const prices = variants.map((v) => v.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    return { minPrice, maxPrice };
  }

  private getBrandProductNameById = async (
    brandId?: string,
    categoryId?: string,
  ) => {
    let brand = undefined,
      category = undefined;

    if (brandId) brand = await this.brandModel.findById(brandId).lean();
    if (categoryId)
      category = await this.categoryModel.findById(categoryId).lean();

    return {
      brand_name: brand?.name || '',
      category_name: category?.name || '',
    };
  };

  private prepareKafkaPayloadCreate = (
    id: string,
    product: KafkaProductPayload,
  ) => {
    const variantFormat = this.formatVariants(product.variants);

    const allVariantValues = product.variants.flatMap((v) =>
      v.attributes.map((a) => a.v),
    );

    const uniqueAttributes = [...new Set(allVariantValues)];

    const kafkaPayload = {
      id: id,
      name: product.name,
      description: product.description,
      thumbnailUrl: product.thumbnailUrl,
      minPrice: product.minPrice,
      maxPrice: product.maxPrice,
      brandId: product.brand.toString(),
      categoryId: product.category.toString(),
      brandName: product.brand_name,
      categoryName: product.category_name,
      variants: variantFormat,
      specifications: product.specifications,
      created_at: product.createdAt.toISOString(),
      isActive: product.isActive,
      likesCount: product.likesCount,
      viewCount: product.viewCount,
      rating: product.rating,
      soldCount: product.soldCount,
      search_attributes: uniqueAttributes,
    };

    return kafkaPayload;
  };

  private prepareKafkaPayloadUpdate = (
    id: string,
    product: Omit<Partial<KafkaProductPayload>, 'id'>,
  ) => {
    const kafkaPayload = {
      ...product,
      variants: product.variants
        ? this.formatVariants(product.variants)
        : undefined,
      id: id.toString(),
    };

    if (product.brand) kafkaPayload['brandId'] = product.brand.toString();

    if (product.category)
      kafkaPayload['categoryId'] = product.category.toString();

    return kafkaPayload;
  };

  private formatVariants = (variants: KafkaProductVariantPayload[]) => {
    return variants.map((v) => ({
      sku: v.sku,
      price: v.price,
      imageUrl: v.imageUrl,
      originalPrice: v.originalPrice,
      statusStock: v.stockSnapshot > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
      attributes: v.attributes.map((attr) => ({
        k: attr.k,
        v: attr.v,
      })),
    }));
  };
}
