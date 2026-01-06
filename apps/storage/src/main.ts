import { NestFactory } from '@nestjs/core';
import { StorageModule } from './storage.module';

async function bootstrap() {
  const app = await NestFactory.create(StorageModule);
  await app.listen(process.env.STORAGE_SERVICE_PORT ?? 3001);
}

bootstrap();
