import { AggregateRoot } from '@nestjs/cqrs';

export class Inventory extends AggregateRoot {
  constructor(
    public readonly id: number,
    public readonly sku: string,
    public readonly productId: string,
    private _stockQuantity: number,
    private _reservedStock: number, // Dùng cho tương lai nếu muốn giữ chỗ mềm
  ) {
    super();
  }

  // ==========================================
  // FACTORY METHODS
  // ==========================================

  // Tạo kho mới (cho sản phẩm mới nhập lần đầu)
  public static create(
    sku: string,
    productId: string,
    initialQuantity: number,
  ): Inventory {
    if (initialQuantity < 0) {
      throw new Error('Số lượng nhập ban đầu không được âm');
    }
    return new Inventory(-1, sku, productId, initialQuantity, 0);
  }

  // Khôi phục từ DB (cho Repository dùng)
  public static restore(
    id: number,
    sku: string,
    productId: string,
    stockQuantity: number,
    reservedStock: number,
  ): Inventory {
    return new Inventory(id, sku, productId, stockQuantity, reservedStock);
  }

  // ==========================================
  // DOMAIN BEHAVIORS
  // ==========================================

  // 1. Nhập hàng (Restock)
  public addStock(quantity: number): void {
    if (quantity <= 0) {
      throw new Error('Số lượng nhập thêm phải lớn hơn 0');
    }
    this._stockQuantity += quantity;
  }

  // 2. Xuất hàng / Trừ kho (Reserve/Consume)
  public decreaseStock(quantity: number): void {
    if (quantity <= 0) {
      throw new Error('Số lượng xuất phải lớn hơn 0');
    }

    // Logic bảo vệ: Không cho phép âm kho trong DB (Dù Redis đã check, Domain vẫn phải check lại cho chắc)
    if (this._stockQuantity - quantity < 0) {
      throw new Error(
        `Sản phẩm ${this.sku} không đủ tồn kho để trừ (Hiện tại: ${this._stockQuantity}, Cần: ${quantity})`,
      );
    }

    this._stockQuantity -= quantity;
  }

  // 3. Hoàn kho (Release - dùng khi hủy đơn hoặc lỗi checkout)
  public releaseStock(quantity: number): void {
    if (quantity <= 0) {
      throw new Error('Số lượng hoàn kho phải lớn hơn 0');
    }
    this._stockQuantity += quantity;
  }

  // ==========================================
  // GETTERS
  // ==========================================
  get stockQuantity(): number {
    return this._stockQuantity;
  }
}
