import { Controller } from '@nestjs/common';
import { UserService } from './user.service';
import { GrpcMethod } from '@nestjs/microservices';
import { LoginUserDto } from 'common/dto/user/user.dto';
import { CreateUserDto } from 'common/dto/user/create-user.dto';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @GrpcMethod('UserService', 'getUserInfo')
  getUserInfo(data: { id: number }) {
    return this.userService.getUserInfo(data.id);
  }

  @GrpcMethod('UserService', 'login')
  login(data: LoginUserDto) {
    return this.userService.login(data);
  }

  @GrpcMethod('UserService', 'register')
  register(data: CreateUserDto) {
    return this.userService.register(data);
  }

  @GrpcMethod('UserService', 'getAllUsers')
  getAllUsers() {
    return this.userService.getAllUsers();
  }
}
