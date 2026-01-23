import {
  KAFKA_RETRY_METADATA,
  KafkaRetryOptions,
} from '@common/decorators/kafka-retry.decorator';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { ClientKafka, KafkaContext } from '@nestjs/microservices';
import { catchError, lastValueFrom, Observable, of } from 'rxjs';

@Injectable()
export class KafkaRetryInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private moduleRef: ModuleRef, // Dùng ModuleRef để lấy Service động
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const options = this.reflector.get<KafkaRetryOptions>(
      KAFKA_RETRY_METADATA,
      context.getHandler(),
    );

    if (!options) return next.handle();

    // Lấy Kafka Client dựa trên Token được cấu hình ở Decorator
    const kafkaClient = this.moduleRef.get<ClientKafka>(options.clientToken, {
      strict: false,
    });

    const rpcContext = context.switchToRpc().getContext<KafkaContext>();
    const topic = rpcContext.getTopic();
    const message = rpcContext.getMessage();

    return next.handle().pipe(
      catchError(async (err) => {
        const headers = message.headers || {};
        const retryCount = headers['x-retry-count']
          ? parseInt(headers['x-retry-count'].toString())
          : 0;

        const payload = {
          key: message.key,
          value: message.value,
          headers: { ...headers },
        };

        if (retryCount < options.maxRetries) {
          payload.headers['x-retry-count'] = (retryCount + 1).toString();
          await lastValueFrom(kafkaClient.emit(topic, payload));
        } else {
          payload.headers['error-log'] = err.message;
          await lastValueFrom(kafkaClient.emit(options.dltTopic, payload));
        }
        return of(null);
      }),
    );
  }
}
