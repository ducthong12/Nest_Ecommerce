import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NAME_SERVICE_GRPC } from '@common/constants/port-grpc.constant';
import { join } from 'path';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: NAME_SERVICE_GRPC.SEARCH_SERVICE,
        transport: Transport.GRPC,
        options: {
          package: NAME_SERVICE_GRPC.SEARCH_PACKAGE,
          protoPath: join(__dirname, '/search.proto'),
          url: `127.0.0.1:50056`,
        },
      },
    ]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
