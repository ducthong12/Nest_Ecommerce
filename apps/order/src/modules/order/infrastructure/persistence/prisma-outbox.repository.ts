// src/infrastructure/repositories/prisma-outbox.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaOrderService } from './prisma-order.service';
import { Prisma } from '@order-prisma-client';

@Injectable()
export class OutboxRepository {
  constructor(private readonly prisma: PrismaOrderService) {}

  private getClient(tx?: Prisma.TransactionClient) {
    return tx || this.prisma;
  }

  async createMany(
    events: { topic: string; payload: any; status: string }[],
    tx?: Prisma.TransactionClient,
  ) {
    return this.getClient(tx).outbox.createMany({
      data: events.map((event) => ({
        topic: event.topic,
        payload: event.payload,
        status: event.status,
      })),
    });
  }
}
