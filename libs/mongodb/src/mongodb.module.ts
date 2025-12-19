import { Module } from '@nestjs/common';
import { MongodbService } from './mongodb.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
        // Các tùy chọn khác nếu cần (Mongoose 6+ mặc định đã tối ưu)
        retryAttempts: 5,
        retryDelay: 1000,
      }),
    }),
  ],
  providers: [MongodbService],
})
export class MongodbModule {}
