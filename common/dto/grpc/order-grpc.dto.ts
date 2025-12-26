import { Observable } from 'rxjs';
import { ReserveStockDto } from '../inventory/reverse-stock.dto';

export class OrderGrpcDto {
  createOrder: (data: ReserveStockDto) => Observable<any>;
}
