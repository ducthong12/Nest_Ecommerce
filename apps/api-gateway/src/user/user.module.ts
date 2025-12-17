import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { NAME_SERVICE_GRPC } from 'common/constants/port-grpc.constant';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: NAME_SERVICE_GRPC.USER_SERVICE,
        transport: Transport.GRPC,
        options: {
          package: NAME_SERVICE_GRPC.USER_SERVICE,
          protoPath: join(__dirname, '/common/proto/user.proto'),
        },
      },
    ]),
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
