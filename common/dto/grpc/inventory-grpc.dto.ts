import { Observable } from 'rxjs';
import { RestockStockDto } from '../inventory/restock-stock.dto';
import { ReserveStockDto } from '../inventory/reverse-stock.dto';

export class InventoryGrpcDto {
  restockStock: (data: RestockStockDto) => Observable<any>;
  reserveStock: (data: ReserveStockDto) => Observable<any>;
}
