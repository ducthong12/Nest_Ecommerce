import { Observable } from 'rxjs';
import { CreateUserDto } from './create-user.dto';
import { LoginUserDto } from './user.dto';

export class UserGrpcDto {
  getUserInfo: (data: { id: number }) => Observable<any>;
  register: (data: CreateUserDto) => Observable<any>;
  getAllUsers: (data: {}) => Observable<any>;
  login: (data: LoginUserDto) => Observable<any>;
}
