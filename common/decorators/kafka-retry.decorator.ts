import { SetMetadata } from '@nestjs/common';

export interface KafkaRetryOptions {
  maxRetries: number;
  dltTopic: string;
  clientToken: string;
}

export const KAFKA_RETRY_METADATA = 'KAFKA_RETRY_METADATA';
export const KafkaRetry = (options: KafkaRetryOptions) => 
  SetMetadata(KAFKA_RETRY_METADATA, options);