import { UserModel } from '@generated/prisma/models/User';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'common/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getInfo(userId: number): Promise<UserModel | null> {
    return await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        password: false,
      },
    });
  }
}
