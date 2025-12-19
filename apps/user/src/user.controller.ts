import { Controller } from '@nestjs/common';
import { UserService } from './user.service';
import { GrpcMethod } from '@nestjs/microservices';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @GrpcMethod('USER_SERVICE', 'GetUserInfo')
  getUserInfo(data: { id: number }) {
    console.log('UserController - getUserInfo - data:', data);
    return this.userService.getInfo(data.id);
  }
}
