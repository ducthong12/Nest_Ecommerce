import { NAME_SERVICE_GRPC } from '@common/constants/port-grpc.constant';
import { Inject, Injectable } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { catchError, firstValueFrom, throwError, timeout } from 'rxjs';
import { MicroserviceErrorHandler } from '../common/microservice-error.handler';
import { StorageGrpcDto } from 'common/dto/grpc/storage-grpc.dto';

@Injectable()
export class StorageService {
  private storageService: StorageGrpcDto;

  constructor(
    @Inject(NAME_SERVICE_GRPC.STORAGE_SERVICE) private client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.storageService = this.client.getService<StorageGrpcDto>(
      NAME_SERVICE_GRPC.STORAGE_SERVICE,
    );
  }

  async getCloudfrontUrl() {
    try {
      return await firstValueFrom(
        this.storageService.getCloudfrontUrl({}).pipe(
          timeout(10000),
          catchError((error) => throwError(() => error)),
        ),
      );
    } catch (error) {
      MicroserviceErrorHandler.handleError(
        error,
        `get cloudfront url`,
        'Storage Service',
      );
    }
  }
}
