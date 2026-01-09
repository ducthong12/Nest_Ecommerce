import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NAME_SERVICE_GRPC } from '@common/constants/port-grpc.constant';
import { join } from 'path';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: NAME_SERVICE_GRPC.STORAGE_SERVICE,
        transport: Transport.GRPC,
        options: {
          package: NAME_SERVICE_GRPC.STORAGE_PACKAGE,
          protoPath: join(__dirname, '/storage.proto'),
          url: `127.0.0.1:50057`,
        },
      },
    ]),
  ],
  controllers: [StorageController],
  providers: [StorageService],
})
export class StorageModule {}
