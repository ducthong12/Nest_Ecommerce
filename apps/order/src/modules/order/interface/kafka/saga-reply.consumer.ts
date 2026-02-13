import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { EventBus } from '@nestjs/cqrs';
import {
  PaymentFailedEvent,
  PaymentProcessedEvent,
  StockFailedEvent,
  StockReservedEvent,
} from '../../application/events/impl/saga-event';

@Controller()
export class SagaReplyConsumer {
  constructor(private readonly eventBus: EventBus) {}

  @EventPattern('order.replies')
  async handleReply(@Payload() message: any) {
    console.log('[Kafka Consumer] Received reply:', message);

    switch (message.type) {
      case 'StockReserved':
        this.eventBus.publish(new StockReservedEvent(message.orderId));
        break;

      case 'StockFailed':
        this.eventBus.publish(
          new StockFailedEvent(message.orderId, message.reason),
        );
        break;

      case 'PaymentProcessed':
        this.eventBus.publish(new PaymentProcessedEvent(message.orderId));
        break;

      case 'PaymentFailed':
        this.eventBus.publish(
          new PaymentFailedEvent(message.orderId, message.reason),
        );
        break;

      default:
        console.warn('Unknown reply type:', message.type);
    }
  }
}
