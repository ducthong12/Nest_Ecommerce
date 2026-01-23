import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderCheckoutDto } from 'common/dto/order/order-checkout.dto';
import { UpdateOrderDto } from 'common/dto/order/update-order.dto';
import { CreateOrderDto } from 'common/dto/order/create-order.dto';

@Controller({ path: 'order', version: '1' })
export class OrderControllerV1 {
  constructor(private readonly orderService: OrderService) {}

  @Post('checkout')
  async checkout(@Body() orderCheckoutDto: OrderCheckoutDto) {
    return await this.orderService.checkout(orderCheckoutDto);
  }

  @Post('create')
  async create(@Body() createOrderDto: CreateOrderDto) {
    return await this.orderService.createOrder(createOrderDto);
  }

  @Put('update')
  async update(@Body() updateOrderDto: UpdateOrderDto) {
    return await this.orderService.updateOrder(updateOrderDto);
  }

  @Get(':id')
  async getOrderById(@Param('id') id: number) {
    return await this.orderService.getOrderById(id);
  }
}

@Controller({ path: 'order', version: '2' })
export class OrderControllerV2 {
  constructor(private readonly orderService: OrderService) {}

  @Post('sync-order')
  async syncOrder(@Body() syncOrderDto: CreateOrderDto | UpdateOrderDto) {
    return await this.orderService.syncOrder(syncOrderDto);
  }

  @Get('draft')
  async getOrderDraft() {
    return await this.orderService.getOrderDraft();
  }
}
