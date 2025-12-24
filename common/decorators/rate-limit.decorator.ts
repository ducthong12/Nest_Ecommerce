import { SetMetadata } from '@nestjs/common';

// Key để Guard tìm kiếm metadata
export const RATE_LIMIT_KEY = 'rate_limit';

export interface RateLimitOptions {
  limit: number;
  ttl: number; // Time to live (giây)
}

// Decorator nhận vào số lượng request và thời gian (giây)
export const RateLimit = (limit: number, ttl: number) =>
  SetMetadata(RATE_LIMIT_KEY, { limit, ttl });
