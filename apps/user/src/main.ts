import { NestFactory } from '@nestjs/core';
import { UserModule } from './user.module';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import {
  NAME_SERVICE_GRPC,
  PORT_GRPC,
} from 'common/constants/port-grpc.constant';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    UserModule,
    {
      transport: Transport.GRPC,
      options: {
        package: NAME_SERVICE_GRPC.USER_SERVICE,
        protoPath: join(__dirname, '/common/proto/user.proto'), // Đường dẫn đến file proto
        url: `0.0.0.0:${PORT_GRPC.USER_PORT_GRPC}`, // Lắng nghe trên port 50051
      },
    },
  );

  // Kích hoạt ValidationPipe toàn cục
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Tự động loại bỏ các thuộc tính không có trong DTO
      forbidNonWhitelisted: true, // Báo lỗi nếu có thuộc tính không mong muốn
      transform: true, // Tự động chuyển đổi kiểu dữ liệu (ví dụ: string -> number)
    }),
  );

  await app.listen();
}

bootstrap()
  .then(() => {
    console.log('User Service Successfully Started');
  })
  .catch(() => {
    console.error('User Service Fail Started');
  });
