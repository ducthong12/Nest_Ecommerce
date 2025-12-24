import { Injectable } from '@nestjs/common';
import { PrismaUserService } from '../prisma/prisma.service';
import { LoginUserDto } from 'common/dto/user/user.dto';
import { CreateUserDto } from 'common/dto/user/create-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prismaUser: PrismaUserService) {}

  async getUserInfo(userId: number): Promise<any | null> {
    return await this.prismaUser.user.findUnique({
      where: { id: userId },
    });
  }

  async getAllUsers(): Promise<any | null> {
    const results = await this.prismaUser.user.findMany();
    return { users: results };
  }

  async login(data: LoginUserDto): Promise<any | null> {
    return await this.prismaUser.user.findUnique({
      where: { username: data.username, password: data.password },
    });
  }

  async register(data: CreateUserDto): Promise<any | null> {
    return await this.prismaUser.user.create({
      data: data,
    });
  }
}
