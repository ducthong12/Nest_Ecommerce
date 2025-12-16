import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import {
  RATE_LIMIT_KEY,
  RateLimitOptions,
} from '../decorators/rate-limit.decorator';

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  // Logic lấy IP người dùng (Quan trọng vì bạn dùng Nginx)
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Nếu chạy sau Nginx, IP thật nằm trong header x-forwarded-for
    return req.headers['x-forwarded-for'] || req.ips.length
      ? req.ips[0]
      : req.ip;
  }

  // Logic sinh key để lưu vào bộ nhớ (IP + Endpoint)
  protected generateKey(context: ExecutionContext): string {
    const { originalUrl } = context.switchToHttp().getRequest();
    const tracker =
      context.switchToHttp().getRequest().headers['x-forwarded-for'] ||
      context.switchToHttp().getRequest().ips?.[0] ||
      context.switchToHttp().getRequest().ip;
    return `${tracker}-${originalUrl}`;
  }

  // Ghi đè logic lấy Limit và TTL từ Decorator của chúng ta
  // (Lưu ý: Code này áp dụng cho @nestjs/throttler v5 trở lên)
  protected async getThrottlerConfig(
    context: ExecutionContext,
    routeOrClassLimit: number,
    routeOrClassTtl: number,
  ): Promise<{ limit: number; ttl: number }> {
    // Lấy thông tin từ reflector (Decorator @RateLimit)
    const reflector = new Reflector();
    const rateLimitConfig = reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (rateLimitConfig) {
      // Nếu có config riêng, trả về config đó (chuyển giây sang milliseconds)
      return {
        limit: rateLimitConfig.limit,
        ttl: rateLimitConfig.ttl * 1000, // Throttler v5+ dùng ms
      };
    }

    // Nếu không có, dùng mặc định
    return { limit: routeOrClassLimit, ttl: routeOrClassTtl };
  }
}
