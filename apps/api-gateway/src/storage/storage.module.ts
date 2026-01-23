import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageControllerV1 } from './storage.controller';

@Module({
  controllers: [StorageControllerV1],
  providers: [StorageService],
})
export class StorageModule {}
