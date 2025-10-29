import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { buildResponse } from '../utils/response.helper';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((value) => {
        if (
          value &&
          typeof value === 'object' &&
          Object.prototype.hasOwnProperty.call(value, 'message') &&
          Object.prototype.hasOwnProperty.call(value, 'data')
        ) {
          return value;
        }

        return buildResponse('Operación exitosa', value ?? null);
      }),
    );
  }
}
