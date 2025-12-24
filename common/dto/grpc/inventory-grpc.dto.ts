import { Observable } from 'rxjs';
import { RestockProductDto } from '../inventory/restock-product.dto';

export class InventoryGrpcDto {
  restockProduct: (data: RestockProductDto) => Observable<any>;
}
