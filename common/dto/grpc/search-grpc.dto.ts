import { Observable } from 'rxjs';

export class SearchGrpcDto {
  handleProductSearch: (data: any) => Observable<any>;
}
