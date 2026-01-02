import { NestFactory } from '@nestjs/core';
import { UserModule } from './user.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { NAME_SERVICE_GRPC } from '@common/constants/port-grpc.constant';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    UserModule,
    {
      transport: Transport.GRPC,
      options: {
        package: NAME_SERVICE_GRPC.USER_PACKAGE,
        protoPath: join(__dirname, '/user.proto'), // Đường dẫn đến file proto
        url: `127.0.0.1:${process.env.USER_PORT_GRPC}`, // Lắng nghe trên port 50051
      },
    },
  );

  // Kích hoạt ValidationPipe toàn cục
  // app.useGlobalPipes();

  await app.listen();
}

bootstrap()
  .then(() => {
    console.log('User Service Successfully Started');
  })
  .catch((error) => {
    console.error('User Service Fail Started', error);
  });
