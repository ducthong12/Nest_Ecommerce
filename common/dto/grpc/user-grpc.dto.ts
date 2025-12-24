import { Observable } from 'rxjs';
import { CreateUserDto } from '../user/create-user.dto';
import { LoginUserDto } from '../user/user.dto';

export class UserGrpcDto {
  getUserInfo: (data: { id: number }) => Observable<any>;
  register: (data: CreateUserDto) => Observable<any>;
  getAllUsers: () => Observable<any>;
  login: (data: LoginUserDto) => Observable<any>;
}
