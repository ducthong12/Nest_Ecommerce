import { Observable } from 'rxjs';
import { RestockProductDto } from '../restock/restock-product.dto';

export class InventoryGrpcDto {
  restockProduct: (data: RestockProductDto) => Observable<any>;
}
