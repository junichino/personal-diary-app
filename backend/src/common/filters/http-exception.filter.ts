import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

interface ErrorResponseBody {
  success: false;
  error: {
    code: string;
    message: string;
  };
  timestamp: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const resp = exceptionResponse as Record<string, unknown>;
        message = (resp['message'] as string) ?? exception.message;

        if (Array.isArray(resp['message'])) {
          message = (resp['message'] as string[]).join(', ');
        }

        code = (resp['code'] as string) ?? this.getErrorCode(status);
      }

      code = this.getErrorCode(status, code);
    }

    const body: ErrorResponseBody = {
      success: false,
      error: {
        code,
        message,
      },
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(body);
  }

  private getErrorCode(status: number, existingCode?: string): string {
    if (existingCode && existingCode !== 'INTERNAL_ERROR') {
      return existingCode;
    }

    const statusCode: HttpStatus = status as HttpStatus;
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return 'VALIDATION_ERROR';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'TOO_MANY_REQUESTS';
      case HttpStatus.PAYLOAD_TOO_LARGE:
        return 'FILE_TOO_LARGE';
      case HttpStatus.UNSUPPORTED_MEDIA_TYPE:
        return 'UNSUPPORTED_MEDIA_TYPE';
      default:
        return 'INTERNAL_ERROR';
    }
  }
}
