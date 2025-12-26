import { Controller, Get } from '@nestjs/common';
import { OrderService } from './order.service';
import { GrpcMethod } from '@nestjs/microservices';
import { ReserveStockDto } from 'common/dto/inventory/reverse-stock.dto';

@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @GrpcMethod('OrderService', 'CreateOrder')
  createOrder(data: ReserveStockDto) {
    return this.orderService.createOrder(data);
  }
}
