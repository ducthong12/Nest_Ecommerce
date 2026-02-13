// 1. Lệnh gửi sang Inventory Service: Yêu cầu giữ hàng
export class ReserveStockCommand {
  constructor(
    public readonly orderId: number,
    public readonly items: any[], // Hoặc định nghĩa kiểu ItemDto cụ thể
  ) {}
}

// 2. Lệnh Bù trừ (Compensation) sang Inventory: Yêu cầu trả lại hàng (nếu Payment lỗi)
export class ReleaseStockCommand {
  constructor(public readonly orderId: number) {}
}

// 3. Lệnh gửi sang Payment Service: Yêu cầu trừ tiền
export class ProcessPaymentCommand {
  constructor(
    public readonly orderId: number,
    public readonly userId: number,
    public readonly amount: number, // Tổng tiền cần thanh toán
  ) {}
}

// 4. Lệnh nội bộ: Hủy đơn hàng (Khi Saga thất bại ở bất kỳ bước nào)
export class CancelOrderCommand {
  constructor(
    public readonly orderId: number,
    public readonly reason: string,
  ) {}
}

// 5. Lệnh nội bộ: Hoàn tất đơn hàng (Khi Saga thành công toàn bộ)
export class CompleteOrderCommand {
  constructor(public readonly orderId: number) {}
}
