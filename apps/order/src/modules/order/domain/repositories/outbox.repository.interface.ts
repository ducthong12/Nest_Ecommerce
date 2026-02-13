import { Prisma } from '@prisma/client';

export interface IOutboxRepository {
  createMany(
    events: { topic: string; payload: any; status: string }[],
    tx?: Prisma.TransactionClient,
  ): Promise<void>;
}
