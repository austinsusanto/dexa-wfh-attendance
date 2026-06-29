import {
	CallHandler,
	ExecutionContext,
	Injectable,
	NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../types/api-response.types';
import { RESPONSE_MESSAGE_KEY } from './response-message.decorator';

/**
 * Wraps every successful handler result in the standard envelope
 * `{ success: true, message, data }`. The message can be customized per
 * handler via `@ResponseMessage('...')`, defaulting to 'Success'.
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
	T,
	ApiResponse<T>
> {
	constructor(private readonly reflector: Reflector) {}

	intercept(
		context: ExecutionContext,
		next: CallHandler<T>,
	): Observable<ApiResponse<T>> {
		const message =
			this.reflector.getAllAndOverride<string>(RESPONSE_MESSAGE_KEY, [
				context.getHandler(),
				context.getClass(),
			]) ?? 'Success';

		return next.handle().pipe(
			map((data) => ({
				success: true as const,
				message,
				data,
			})),
		);
	}
}
