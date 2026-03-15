import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { OutboxRepository } from '../../../infrastructure/persistence/prisma-outbox.repository';
import {
  CancelOrderCommand,
  ProcessPaymentCommand,
  ReserveStockCommand,
} from '../impl/saga.commands';

// 1. Handler giữ kho
@CommandHandler(ReserveStockCommand)
export class ReserveStockHandler implements ICommandHandler<ReserveStockCommand> {
  constructor(private readonly outboxRepo: OutboxRepository) {}

  async execute(command: ReserveStockCommand): Promise<void> {
    await this.outboxRepo.createMany([
      {
        topic: 'inventory.commands',
        payload: {
          command: 'ReserveStock',
          orderId: command.orderId,
          items: command.items,
        },
        status: 'PENDING',
      },
    ]);
    console.log(
      `[Saga] Đã lưu lệnh ReserveStock cho Order ${command.orderId} vào Outbox`,
    );
  }
}

// 2. Handler thanh toán
@CommandHandler(ProcessPaymentCommand)
export class ProcessPaymentHandler implements ICommandHandler<ProcessPaymentCommand> {
  constructor(private readonly outboxRepo: OutboxRepository) {}

  async execute(command: ProcessPaymentCommand): Promise<void> {
    await this.outboxRepo.createMany([
      {
        topic: 'payment.commands',
        payload: {
          command: 'ProcessPayment',
          orderId: command.orderId,
          amount: command.amount,
          userId: command.userId,
        },
        status: 'PENDING',
      },
    ]);
  }
}

// 3. Handler hủy đơn (Cập nhật DB nội bộ + Gửi sự kiện hủy)
@CommandHandler(CancelOrderCommand)
export class CancelOrderHandler implements ICommandHandler<CancelOrderCommand> {
  constructor(private readonly outboxRepo: OutboxRepository) {}

  async execute(command: CancelOrderCommand): Promise<void> {
    console.log(`[Saga] Order ${command.orderId} bị hủy do: ${command.reason}`);

    await this.outboxRepo.createMany([
      {
        topic: 'order.events',
        payload: {
          event: 'OrderCancelled',
          orderId: command.orderId,
          reason: command.reason,
        },
        status: 'PENDING',
      },
    ]);
  }
}
