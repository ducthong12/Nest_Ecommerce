import { Observable } from 'rxjs';

export class StorageGrpcDto {
  getCloudfrontUrl: (data: any) => Observable<any>;
}
