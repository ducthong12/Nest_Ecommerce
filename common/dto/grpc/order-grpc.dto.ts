import { Observable } from 'rxjs';
import { OrderCheckoutDto } from '../order/order-checkout.dto';

export class OrderGrpcDto {
  createOrder: (data: OrderCheckoutDto) => Observable<any>;
  getOrder: (data: { id: number }) => Observable<any>;
}
