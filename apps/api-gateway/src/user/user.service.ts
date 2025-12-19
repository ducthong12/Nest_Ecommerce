import { Inject, Injectable } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { catchError, firstValueFrom, throwError, timeout } from 'rxjs';
import { UserGrpcDto } from './dto/user-grpc.dto';
import { NAME_SERVICE_GRPC } from '@common/constants/port-grpc.constant';

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
      //   MicroserviceErrorHandler.handleError(
      //     error,
      //     `get user info for ID: ${userId}`,
      //     'User Service',
      //   );
      console.log('Error in getUserInfo:', error);
    }
  }
}
