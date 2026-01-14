import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderCheckoutDto } from 'common/dto/order/order-checkout.dto';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('checkout')
  async checkout(@Body() orderCheckoutDto: OrderCheckoutDto) {
    return await this.orderService.checkout(orderCheckoutDto);
  }

  @Get(':id')
  async getOrder(@Param('id') id: number) {
    return await this.orderService.getOrder(id);
  }
}
