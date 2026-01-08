import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost) {
    // 1. Xác định context (HTTP, RPC, hay Kafka?)
    const ctx = host.switchToHttp();
    const { httpAdapter } = this.httpAdapterHost;

    // 2. Phân loại lỗi (HttpException hay lỗi Crash server?)
    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal Server Error';

    // 3. Format nội dung Log lỗi
    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
      method: ctx.getRequest().method,
      error: message,
    };

    // 4. GHI LOG (QUAN TRỌNG)
    // In ra Stack Trace để biết lỗi dòng nào
    this.logger.error(
      `Exception Filter caught error: ${JSON.stringify(responseBody)}`,
      exception instanceof Error ? exception.stack : '',
    );

    // 5. Trả về response cho Client (nếu là HTTP)
    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
