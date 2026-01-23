import { Observable } from 'rxjs';
import { OrderCheckoutDto } from '../order/order-checkout.dto';
import { CreateOrderDto } from '../order/create-order.dto';
import { UpdateOrderDto } from '../order/update-order.dto';

export class OrderGrpcDto {
  createOrder: (data: CreateOrderDto) => Observable<any>;
  updateOrder: (data: UpdateOrderDto) => Observable<any>;
  orderCheckout: (data: OrderCheckoutDto) => Observable<any>;
  getOrderById: (data: { id: number }) => Observable<any>;
  getOrder: (data: {}) => Observable<any>;
  syncOrder: (data: UpdateOrderDto | CreateOrderDto) => Observable<any>;
  getOrderDraft: (data: {}) => Observable<any>;
}
