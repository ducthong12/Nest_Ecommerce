import { Injectable } from '@nestjs/common';

@Injectable()
export class OrderService {
  getHello(): { message: string } {
    return { message: 'Hello World!' };
  }
}
