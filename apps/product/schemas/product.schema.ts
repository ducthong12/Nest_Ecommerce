import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Brand } from './brand.schema';
import { Category } from './category.schema';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, index: true }) // Index để search tên cho nhanh
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  price: number; // Trong JS/TS, số là Number (tương đương Float trong DB)

  @Prop({ required: true, unique: true }) // SKU không được trùng
  sku: string;

  @Prop()
  imageUrl: string;

  @Prop({ default: true })
  isActive: boolean;

  // --- External Reference (Identity Service) ---
  @Prop({ type: Number, index: true }) // Lưu ID từ Postgres, đánh index để query theo user nhanh
  userId: number;

  // --- Internal Relations (MongoDB) ---
  // Lưu ObjectId nhưng trỏ tới (ref) Schema Brand
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Brand' })
  brand: Brand;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  })
  category: Category;

  // --- Stats (Denormalization) ---
  @Prop({ default: 0 })
  likesCount: number;

  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ default: 0.0 })
  rating: number;

  @Prop({
    type: [
      {
        k: { type: String, required: true },
        v: { type: String, required: true },
        u: { type: String },
      },
    ],
    _id: false, // Không cần tạo _id cho từng item trong mảng để nhẹ DB
  })
  specifications: Specification[];
}

// Định nghĩa cấu trúc của một thông số
export class Specification {
  @Prop({ required: true })
  k: string; // Key: ví dụ "Dung lượng pin", "Chất liệu"

  @Prop({ required: true })
  v: string; // Value: ví dụ "5000mAh", "Titanium"

  @Prop()
  u?: string; // Unit (không bắt buộc): ví dụ "mAh", "inch", "GB"
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Index text để phục vụ chức năng tìm kiếm sản phẩm cơ bản
ProductSchema.index({ name: 'text', description: 'text' });
