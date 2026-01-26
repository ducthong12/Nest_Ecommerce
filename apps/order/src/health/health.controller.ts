import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  MicroserviceHealthIndicator,
  MemoryHealthIndicator,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { Transport } from '@nestjs/microservices';
import { PrismaOrderService } from 'apps/order/prisma/prisma-order.service';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private microservice: MicroserviceHealthIndicator,
    private memory: MemoryHealthIndicator,
    private prismaHealth: PrismaHealthIndicator,
    private prisma: PrismaOrderService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    const totalAvailableMemory =
      require('v8').getHeapStatistics().heap_size_limit;

    return this.health.check([
      () => this.memory.checkHeap('memory_heap', totalAvailableMemory * 0.8),
      () =>
        this.microservice.pingCheck('kafka', {
          transport: Transport.KAFKA,
          options: {
            client: {
              brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(
                ',',
              ),
            },
          },
        }),
      () => this.prismaHealth.pingCheck('database', this.prisma),
    ]);
  }
}
