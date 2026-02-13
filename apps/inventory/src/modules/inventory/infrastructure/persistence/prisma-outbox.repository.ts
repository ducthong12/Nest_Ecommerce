// src/infrastructure/repositories/prisma-outbox.repository.ts
import { Injectable } from '@nestjs/common';
import { Prisma } from '@inventory-prisma-client';
import { PrismaInventoryService } from './prisma-inventory.service';

@Injectable()
export class PrismaOutboxInventoryRepository {
  constructor(private readonly prisma: PrismaInventoryService) {}

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
