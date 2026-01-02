import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Brand } from './brand.schema';
import { Category } from './category.schema';

export type ProductDocument = HydratedDocument<Product>;

// 1. Định nghĩa Schema cho thuộc tính biến thể (Ví dụ: Màu=Đỏ, Size=XL)
@Schema({ _id: false }) // Không cần ID riêng cho cái này
export class VariantAttribute {
  @Prop({ required: true })
  k: string; // Key: "Color", "Size", "Storage"

  @Prop({ required: true })
  v: string; // Value: "Red", "XL", "256GB"
}

// 2. Định nghĩa Schema cho từng Biến thể (Variant)
@Schema()
export class ProductVariant {
  // Mỗi variant tự có _id riêng để dễ thêm vào giỏ hàng
  _id: mongoose.Types.ObjectId; 

  @Prop({ required: true, unique: true })
  sku: string; // SKU của biến thể (VD: IP15-RED-256)

  @Prop({ required: true })
  price: number; // Giá bán của biến thể này

  @Prop({ default: 0 })
  original_price: number; // Giá gốc (để gạch đi nếu giảm giá)

  @Prop()
  image_url: string; // Ảnh riêng của biến thể (VD: Ảnh cái áo màu đỏ)

  // Kho hàng (Snapshot để hiển thị thôi, tồn kho thật xử lý ở Redis/SQL service Inventory)
  @Prop({ default: 0 })
  stock_snapshot: number; 

  // Các thuộc tính định nghĩa biến thể này
  @Prop({ type: [VariantAttribute], default: [] })
  attributes: VariantAttribute[]; 
}

const ProductVariantSchema = SchemaFactory.createForClass(ProductVariant);

// 3. Schema Product Chính
@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, index: true, text: true }) // Text index để search
  name: string;

  @Prop()
  description: string;

  // --- External Reference ---
  @Prop({ type: Number, index: true })
  userId: number;

  // --- Internal Relations ---
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Brand' })
  brand: Brand;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true })
  category: Category;

  // --- Variant System ---
  // Mảng chứa các biến thể
  @Prop({ type: [ProductVariantSchema], default: [] })
  variants: ProductVariant[];

  // --- Price Range (Để sort và filter ở trang danh sách) ---
  // Vì giá nằm trong variants, ta cần cache giá min/max ra ngoài để query cho nhanh
  @Prop({ default: 0, index: true })
  min_price: number;

  @Prop({ default: 0, index: true })
  max_price: number;

  // --- General Info ---
  @Prop()
  thumbnail_url: string; // Ảnh đại diện chung của sản phẩm

  @Prop({ default: true, index: true })
  isActive: boolean;

  // --- Stats ---
  @Prop({ default: 0 })
  likesCount: number;

  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ default: 0.0, index: true })
  rating: number;

  @Prop({ default: 0 })
  sold_count: number; // Tổng số lượng đã bán (cộng dồn từ các variants)

  // Thông số kỹ thuật chung (Dùng lại class cũ của bạn)
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
}

// Class Specification cũ của bạn
export class Specification {
  @Prop({ required: true })
  k: string;
  @Prop({ required: true })
  v: string;
  @Prop()
  u?: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// --- Indexes ---
// Index text tìm kiếm tên và mô tả
ProductSchema.index({ name: 'text', description: 'text' });
// Index để lọc theo giá
ProductSchema.index({ min_price: 1, max_price: 1 });
// Index để tìm sản phẩm theo thuộc tính variant (VD: Tìm tất cả áo màu Đỏ)
ProductSchema.index({ 'variants.attributes.k': 1, 'variants.attributes.v': 1 });