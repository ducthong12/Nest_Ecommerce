import { Controller } from '@nestjs/common';
import { OrderService } from '../../application/services/order.service';
import { GrpcMethod } from '@nestjs/microservices';

@Controller('')
export class OrderGrpcController {
  constructor(private readonly orderService: OrderService) {}

  @GrpcMethod('OrderService', 'GetHello')
  getHello(): { message: string } {
    return this.orderService.getHello();
  }
}
