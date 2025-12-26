import { Body, Controller, Post } from '@nestjs/common';
import { OrderService } from './order.service';
import { ReserveStockDto } from 'common/dto/inventory/reverse-stock.dto';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('checkout')
  async checkout(@Body() reverseProductDto: ReserveStockDto) {
    return await this.orderService.checkout(reverseProductDto);
  }
}
