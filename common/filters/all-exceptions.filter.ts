import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { RpcException } from '@nestjs/microservices';
import { throwError } from 'rxjs';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const type = host.getType();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : exception instanceof Error
          ? exception.message
          : 'Internal Server Error';

    if (type === 'http') {
      return this.handleHttp(exception, host, status, message);
    } else if (type === 'rpc') {
      return this.handleRpc(exception, host, message);
    }
  }

  private handleHttp(
    exception: unknown,
    host: ArgumentsHost,
    status: number,
    message: any,
  ) {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();

    const responseBody = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(request),
      method: request.method,
      error: message,
    };

    const logData = {
      context: 'HTTP',
      ...responseBody,
      query: request.query,
      body: this.sanitizeSensitiveData(request.body),
    };

    this.logger.error(
      `HTTP Error: ${JSON.stringify(logData)}`,
      exception instanceof Error ? exception.stack : '',
    );

    httpAdapter.reply(ctx.getResponse(), responseBody, status);
  }

  private handleRpc(exception: unknown, host: ArgumentsHost, message: any) {
    const ctx = host.switchToRpc();
    const data = ctx.getData();
    const context = ctx.getContext();

    let rpcContextType = 'gRPC';
    let path = 'Unknown gRPC Method';

    if (context && typeof context.getTopic === 'function') {
      rpcContextType = 'KAFKA';
      path = `Topic: ${context.getTopic()} - Partition: ${context.getPartition()}`;
    }

    const logData = {
      context: rpcContextType,
      path: path,
      error: message,
      data: this.sanitizeSensitiveData(data),
      timestamp: new Date().toISOString(),
    };

    this.logger.error(
      `${rpcContextType} Error: ${JSON.stringify(logData)}`,
      exception instanceof Error ? exception.stack : '',
    );

    return throwError(() => new RpcException(message));
  }

  private sanitizeSensitiveData(data: any): any {
    if (!data) return data;
    if (typeof data !== 'object') return data;

    const sensitiveKeys = [
      'password',
      'token',
      'authorization',
      'creditCard',
      'cvv',
    ];
    const sanitized = Array.isArray(data) ? [...data] : { ...data };

    for (const key in sanitized) {
      if (sensitiveKeys.includes(key.toLowerCase())) {
        sanitized[key] = '*****';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeSensitiveData(sanitized[key]);
      }
    }
    return sanitized;
  }
}
