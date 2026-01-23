import { Observable } from 'rxjs';
import { RestockInventoryDto } from '../inventory/restock-stock.dto';
import { ReserveStockInventoryDto } from '../inventory/reverse-stock.dto';

export class InventoryGrpcDto {
  restockInventory: (data: RestockInventoryDto) => Observable<any>;
  reserveStockInventory: (data: ReserveStockInventoryDto) => Observable<any>;
}
