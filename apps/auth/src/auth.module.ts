import { Module } from '@nestjs/common';
import { AuthController } from './modules/interface/auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
