import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Internal server error';
    let error = 'Internal Server Error';

    if (isHttpException) {
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.name;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseBody = exceptionResponse as {
          message?: string | string[];
          error?: string;
        };

        if (Array.isArray(responseBody.message)) {
          message = responseBody.message.join(', ');
        } else if (typeof responseBody.message === 'string') {
          message = responseBody.message;
        } else {
          message = exception.message;
        }

        error = responseBody.error ?? exception.name;
      } else {
        message = exception.message;
        error = exception.name;
      }
    } else if (exception instanceof Error) {
      message = exception.message || 'Internal server error';
      error = exception.name || 'Error';
    }

    const isMissingUpload =
      status === HttpStatus.NOT_FOUND &&
      request.url.startsWith('/uploads/');

    if (!isMissingUpload) {
      console.error(exception);
    }

    response.status(status).json({
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
