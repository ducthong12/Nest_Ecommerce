import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchControllerV1 } from './search.controller';

@Module({
  controllers: [SearchControllerV1],
  providers: [SearchService],
})
export class SearchModule {}
