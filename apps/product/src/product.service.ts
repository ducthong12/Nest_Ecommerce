import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Product, ProductDocument } from '../schemas/product.schema';
import { Connection, Model, Types } from 'mongoose';
import {
  CreateProductDto,
  ProductVariantDto,
} from 'common/dto/product/create-product.dto';
import { Category } from '../schemas/category.schema';
import { CreateBrandDto } from 'common/dto/product/create-brand.dto';
import { Brand } from '../schemas/brand.schema';
import { CreateCategoryDto } from 'common/dto/product/create-category.dto';
import { ClientKafka } from '@nestjs/microservices';
import { UpdateProductDto } from 'common/dto/product/update-product.dto';
import { UpdateSnapShotProductDto } from 'common/dto/product/updateSnapshot-product.dto';
import { UpdatePriceDto } from 'common/dto/product/update-price.dto';
import { OrderCanceledEvent } from 'common/dto/order/order-canceled.event';
import { OrderCheckoutEvent } from 'common/dto/order/order-checkout.event';

interface KafkaProductPayload extends Omit<Product, 'variants'> {
  brand_name: string;
  category_name: string;
  createdAt: Date;
  variants: ProductVariantDto[];
}

interface KafkaProductVariantPayload extends ProductVariantDto {}

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(Brand.name) private brandModel: Model<Brand>,
    @Inject('PRODUCT_KAFKA_CLIENT') private readonly kafkaClient: ClientKafka,
    @InjectConnection() private readonly connection: Connection,
  ) {}

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

  async processOrderCanceled(data: OrderCanceledEvent) {
    const result = [];
    const session = await this.connection.startSession();

    session.startTransaction();

    for (const item of data.items) {
      const data = await this.productModel.findOneAndUpdate(
        { 'variants.sku': item.sku },
        { $inc: { 'variants.$.stockSnapshot': item.quantity } },
        { session },
      );

      result.push(data);
    }

    await session.commitTransaction();
    await session.endSession();

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

  async processOrderCreated(data: OrderCheckoutEvent) {
    const result = [];
    const session = await this.connection.startSession();

    session.startTransaction();

    for (const item of data.items) {
      const data = await this.productModel.findOneAndUpdate(
        { 'variants.sku': item.sku },
        { $inc: { 'variants.$.stockSnapshot': -item.quantity } },
        { session },
      );

      result.push(data);
    }

    await session.commitTransaction();
    await session.endSession();

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
