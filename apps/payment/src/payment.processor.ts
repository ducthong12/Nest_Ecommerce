import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PaymentService } from './payment.service';

@Processor('payment-timeout-queue')
export class PaymentProcessor extends WorkerHost {
  constructor(private readonly paymentService: PaymentService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { orderId } = job.data;

    console.log(`Checking payment timeout for Order #${orderId}...`);

    // Gọi Service xử lý logic hết hạn
    await this.paymentService.expirePayment(orderId);
  }
}
