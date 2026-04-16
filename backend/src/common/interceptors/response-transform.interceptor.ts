import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
  timestamp: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

function isPaginatedResult(value: unknown): value is PaginatedResult<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    'meta' in value &&
    Array.isArray((value as PaginatedResult<unknown>).data) &&
    typeof (value as PaginatedResult<unknown>).meta === 'object'
  );
}

@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<
  T,
  SuccessResponse<T>
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessResponse<T>> {
    return next.handle().pipe(
      map((value: unknown) => {
        if (isPaginatedResult(value)) {
          return {
            success: true as const,
            data: value.data as T,
            meta: value.meta,
            timestamp: new Date().toISOString(),
          };
        }

        return {
          success: true as const,
          data: value as T,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
