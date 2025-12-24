import { Inject, Injectable } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { catchError, firstValueFrom, throwError, timeout } from 'rxjs';
import { UserGrpcDto } from '../../../../common/dto/user/user-grpc.dto';
import { NAME_SERVICE_GRPC } from '@common/constants/port-grpc.constant';
import { MicroserviceErrorHandler } from '../common/microservice-error.handler';
import { CreateUserDto } from '../../../../common/dto/user/create-user.dto';
import { LoginUserDto } from '../../../../common/dto/user/user.dto';

@Injectable()
export class UserService {
  private userService: UserGrpcDto;

  constructor(
    @Inject(NAME_SERVICE_GRPC.USER_SERVICE) private client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.userService = this.client.getService<UserGrpcDto>(
      NAME_SERVICE_GRPC.USER_SERVICE,
    );
  }

  async getUserInfo(userId: number) {
    try {
      return await firstValueFrom(
        this.userService.getUserInfo({ id: userId }).pipe(
          timeout(10000),
          catchError((error) => throwError(() => error)),
        ),
      );
    } catch (error) {
      MicroserviceErrorHandler.handleError(
        error,
        `get user info for ID: ${userId}`,
        'User Service',
      );
    }
  }

  async register(data: CreateUserDto) {
    try {
      return await firstValueFrom(
        this.userService.register(data).pipe(
          timeout(10000),
          catchError((error) => throwError(() => error)),
        ),
      );
    } catch (error) {
      MicroserviceErrorHandler.handleError(
        error,
        `register user with data: ${JSON.stringify(data)}`,
        'User Service',
      );
    }
  }

  async getAllUsers() {
    try {
      return await firstValueFrom(
        this.userService.getAllUsers({}).pipe(
          timeout(10000),
          catchError((error) => throwError(() => error)),
        ),
      );
    } catch (error) {
      MicroserviceErrorHandler.handleError(
        error,
        `get all users`,
        'User Service',
      );
    }
  }

  async login(data: LoginUserDto) {
    try {
      return await firstValueFrom(
        this.userService.login(data).pipe(
          timeout(10000),
          catchError((error) => throwError(() => error)),
        ),
      );
    } catch (error) {
      MicroserviceErrorHandler.handleError(
        error,
        `login user with data: ${JSON.stringify(data)}`,
        'User Service',
      );
    }
  }
}
