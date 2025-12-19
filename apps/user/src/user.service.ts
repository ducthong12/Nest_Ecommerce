import { Injectable } from '@nestjs/common';
import { PrismaUserService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prismaUser: PrismaUserService) {}

  async getInfo(userId: number): Promise<any | null> {
    return await this.prismaUser.user.findUnique({
      where: { id: userId },
      // select: {
      //   password: false,
      // },
    });
  }
}
