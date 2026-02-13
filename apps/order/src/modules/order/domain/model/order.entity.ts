import { AggregateRoot } from '@nestjs/cqrs';

// 1. Định nghĩa các trạng thái (Value Object / Enum)
export enum OrderStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
}

// 2. Định nghĩa cấu trúc Item (Value Object)
export interface OrderItemProps {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  productSku: string;
}

// 3. Định nghĩa Entity chính (Aggregate Root)
export class Order extends AggregateRoot {
  // Các thuộc tính private để đảm bảo tính đóng gói (Encapsulation)
  private _status: OrderStatus;
  private _items: OrderItemProps[];
  private _total: number;
  private _updatedAt: Date;

  constructor(
    public readonly id: number,
    public readonly userId: number,
    status: OrderStatus,
    items: OrderItemProps[],
    total: number,
    public readonly createdAt: Date,
    updatedAt: Date,
  ) {
    super();
    this._status = status;
    this._items = items;
    this._total = total;
    this._updatedAt = updatedAt;
  }

  // =========================================================
  // FACTORY METHOD: Tạo mới Order (Luôn bắt đầu là DRAFT)
  // =========================================================
  public static create(
    id: number,
    userId: number,
    items: OrderItemProps[],
  ): Order {
    if (!items || items.length === 0) {
      throw new Error('Đơn hàng phải có ít nhất 1 sản phẩm');
    }

    const total = this.calculateTotal(items);
    const now = new Date();

    // Trả về một instance mới với trạng thái DRAFT
    return new Order(id, userId, OrderStatus.DRAFT, items, total, now, now);
  }

  // =========================================================
  // RESTORE METHOD: Dùng cho Repository để map từ DB lên Entity
  // =========================================================
  public static restore(
    id: number,
    userId: number,
    status: string,
    items: OrderItemProps[],
    total: number,
    createdAt: Date,
    updatedAt: Date,
  ): Order {
    return new Order(
      id,
      userId,
      status as OrderStatus,
      items,
      total,
      createdAt,
      updatedAt,
    );
  }

  // =========================================================
  // DOMAIN BEHAVIORS (Hành vi nghiệp vụ)
  // =========================================================

  /**
   * Hành động Checkout: Chuyển từ DRAFT -> PENDING
   */
  public checkout(): void {
    if (this._status !== OrderStatus.DRAFT) {
      throw new Error('Chỉ đơn hàng nháp (DRAFT) mới có thể checkout.');
    }

    // Logic chuyển trạng thái
    this._status = OrderStatus.PENDING;
    this._updatedAt = new Date();

    // (Tùy chọn) Bạn có thể bắn Event ngay tại đây nếu muốn dùng style Aggregate.commit()
    // this.apply(new OrderCheckoutedEvent(this.id, ...));
  }

  /**
   * Hành động Hủy đơn
   */
  public cancel(reason: string): void {
    if (
      this._status === OrderStatus.COMPLETED ||
      this._status === OrderStatus.SHIPPED
    ) {
      throw new Error('Không thể hủy đơn hàng đã hoàn thành hoặc đang giao.');
    }

    this._status = OrderStatus.CANCELED;
    this._updatedAt = new Date();
    // console.log(`Order ${this.id} canceled due to: ${reason}`);
  }

  /**
   * Thêm sản phẩm vào đơn (Chỉ cho phép khi còn là DRAFT)
   */
  public addItem(item: OrderItemProps): void {
    if (this._status !== OrderStatus.DRAFT) {
      throw new Error('Không thể sửa đổi đơn hàng khi đã checkout.');
    }

    this._items.push(item);
    this.recalculateTotal();
    this._updatedAt = new Date();
  }

  // =========================================================
  // INTERNAL LOGIC (Helper private)
  // =========================================================
  private static calculateTotal(items: OrderItemProps[]): number {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  private recalculateTotal(): void {
    this._total = Order.calculateTotal(this._items);
  }

  // =========================================================
  // GETTERS (Chỉ cho xem, không cho sửa trực tiếp)
  // =========================================================
  get status(): OrderStatus {
    return this._status;
  }

  get items(): OrderItemProps[] {
    return [...this._items]; // Trả về bản copy để tránh bị sửa mảng gốc từ bên ngoài
  }

  get total(): number {
    return this._total;
  }
}
