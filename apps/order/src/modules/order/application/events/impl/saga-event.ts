// --- SỰ KIỆN KHỞI ĐẦU ---

// 1. Sự kiện kích hoạt toàn bộ Saga
export class OrderCheckoutedEvent {
  constructor(
    public readonly orderId: number,
    public readonly userId: number,
    public readonly items: any[],
    public readonly totalAmount: number,
  ) {}
}

// --- SỰ KIỆN PHẢN HỒI TỪ INVENTORY (Nhận từ Kafka) ---

// 2. Kho báo: Giữ hàng thành công
export class StockReservedEvent {
  constructor(public readonly orderId: number) {}
}

// 3. Kho báo: Thất bại (Hết hàng, lỗi kho...)
export class StockFailedEvent {
  constructor(
    public readonly orderId: number,
    public readonly reason: string,
  ) {}
}

// --- SỰ KIỆN PHẢN HỒI TỪ PAYMENT (Nhận từ Kafka) ---

// 4. Payment báo: Trừ tiền thành công
export class PaymentProcessedEvent {
  constructor(
    public readonly orderId: number,
    public readonly transactionId?: string,
  ) {}
}

// 5. Payment báo: Thất bại (Không đủ tiền, lỗi thẻ...)
export class PaymentFailedEvent {
  constructor(
    public readonly orderId: number,
    public readonly reason: string,
  ) {}
}
