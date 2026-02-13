import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { OrderService } from '../../application/services/order.service';
import { OrderCheckoutDto } from '../../application/dtos/order-checkout.dto';
import { CreateOrderDto } from '../../application/dtos/create-order.dto';
import { UpdateOrderDto } from '../../application/dtos/update-order.dto';
import { CheckoutOrderCommand } from '../../application/commands/impl/checkout-order.command';
import { CommandBus } from '@nestjs/cqrs';

@Controller({
  path: 'order',
  version: '1',
})
export class OrderControllerV1 {
  constructor(
    private readonly orderService: OrderService,
    private readonly commandBus: CommandBus,
  ) {}

  @Post('checkout')
  async checkout(@Body() dto: OrderCheckoutDto) {
    const userId = 1;
    const command = new CheckoutOrderCommand(userId, dto.items);

    const result = await this.commandBus.execute(command);

    return {
      message: 'Checkout process initiated successfully',
      data: result,
    };
  }

  // @Post('create')
  // async create(@Body() createOrderDto: CreateOrderDto) {
  //   return await this.orderService.createOrder(createOrderDto);
  // }

  // @Put('update')
  // async update(@Body() updateOrderDto: UpdateOrderDto) {
  //   return await this.orderService.updateOrder(updateOrderDto);
  // }

  // @Get(':id')
  // async getOrderById(@Param('id') id: number) {
  //   return await this.orderService.getOrderById(id);
  // }
}
