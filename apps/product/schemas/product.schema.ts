import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Brand } from './brand.schema';
import { Category } from './category.schema';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ _id: false })
export class VariantAttribute {
  @Prop({ required: true })
  k: string;

  @Prop({ required: true })
  v: string;
}

@Schema()
export class ProductVariant {
  _id: mongoose.Types.ObjectId;

  @Prop({ required: true, unique: true })
  sku: string;

  @Prop({ required: true })
  price: number;

  @Prop({ default: 0 })
  originalPrice: number;

  @Prop()
  imageUrl: string;

  @Prop({ default: 0 })
  stockSnapshot: number;

  @Prop({ type: [VariantAttribute], default: [] })
  attributes: VariantAttribute[];
}

const ProductVariantSchema = SchemaFactory.createForClass(ProductVariant);
@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, index: true, text: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ type: Number, index: true })
  userId: number;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Brand' })
  brand: Brand;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  })
  category: Category;

  @Prop({ type: [ProductVariantSchema], default: [] })
  variants: ProductVariant[];

  @Prop({ default: 0, index: true })
  minPrice: number;

  @Prop({ default: 0, index: true })
  maxPrice: number;

  @Prop()
  thumbnailUrl: string;

  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop({ default: 0 })
  likesCount: number;

  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ default: 0.0, index: true })
  rating: number;

  @Prop({ default: 0 })
  soldCount: number;

  @Prop({
    type: [
      {
        k: { type: String, required: true },
        v: { type: String, required: true },
        u: { type: String },
      },
    ],
    _id: false,
  })
  specifications: Specification[];

  createdAt: Date;
  updatedAt: Date;
}

export class Specification {
  @Prop({ required: true })
  k: string;
  @Prop({ required: true })
  v: string;
  @Prop()
  u?: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ minPrice: 1, maxPrice: 1 });
ProductSchema.index({ 'variants.attributes.k': 1, 'variants.attributes.v': 1 });
