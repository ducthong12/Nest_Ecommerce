import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateOrderDto } from '../../application/dtos/create-order.dto';
import { OrderService } from '../../application/services/order.service';
import { UpdateOrderDto } from '../../application/dtos/update-order.dto';

@Controller({
  path: 'order',
  version: '2',
})
export class OrderControllerV2 {
  constructor(private readonly orderService: OrderService) {}

  //   @Post('sync-order')
  //   async syncOrder(@Body() syncOrderDto: CreateOrderDto | UpdateOrderDto) {
  //     return await this.orderService.syncOrder(syncOrderDto);
  //   }

  //   @Get('draft')
  //   async getOrderDraft() {
  //     return await this.orderService.getOrderDraft();
  //   }
}
