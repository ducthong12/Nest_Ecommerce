import { Injectable } from '@nestjs/common';
import { ICommand, ofType, Saga } from '@nestjs/cqrs';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  OrderCheckoutedEvent,
  PaymentFailedEvent,
  PaymentProcessedEvent,
  StockFailedEvent,
  StockReservedEvent,
} from '../events/impl/saga-event';
import {
  CancelOrderCommand,
  CompleteOrderCommand,
  ProcessPaymentCommand,
  ReleaseStockCommand,
  ReserveStockCommand,
} from '../commands/impl/saga.commands';

@Injectable()
export class OrderSagas {
  // BƯỚC 1: Nghe OrderCheckouted -> Gửi lệnh Giữ kho
  @Saga()
  orderCheckouted = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(OrderCheckoutedEvent),
      map((event) => new ReserveStockCommand(event.orderId, event.items)),
    );
  };

  // BƯỚC 2A: Nghe Kho OK -> Gửi lệnh Thanh toán
  @Saga()
  stockReserved = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(StockReservedEvent),
      // Ở đây bạn cần query lại DB để lấy amount/userId nếu trong event không có đủ info
      // Giả sử event trả về đủ info hoặc bạn query DB ở đây
      map((event) => new ProcessPaymentCommand(event.orderId, 100000, 1)), // Ví dụ hardcode
    );
  };

  // BƯỚC 2B: Nghe Kho Fail -> Hủy đơn
  @Saga()
  stockFailed = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(StockFailedEvent),
      map((event) => new CancelOrderCommand(event.orderId, event.reason)),
    );
  };

  // BƯỚC 3A: Nghe Thanh toán OK -> Hoàn tất đơn
  @Saga()
  paymentProcessed = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(PaymentProcessedEvent),
      map((event) => new CompleteOrderCommand(event.orderId)),
    );
  };

  // BƯỚC 3B: Nghe Thanh toán Fail -> Hủy đơn & Trả kho (Bù trừ)
  @Saga()
  paymentFailed = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(PaymentFailedEvent),
      // Chỗ này đáng lẽ phải return mảng commands [ReleaseStock, CancelOrder]
      // Nhưng NestJS Saga map 1-1, nên ta gọi CancelOrder,
      // rồi trong CancelOrderHandler sẽ bắn tiếp ReleaseStock hoặc gọi thẳng.
      map((event) => new ReleaseStockCommand(event.orderId)),
    );
  };
}
