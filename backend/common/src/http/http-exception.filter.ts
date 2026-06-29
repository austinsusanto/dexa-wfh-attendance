import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
	HttpStatus,
	Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorResponse } from '../types/api-response.types';

/**
 * Catches every thrown exception and serializes it into the standard error
 * envelope `{ success: false, message, errors }`.
 *
 * - HttpException (incl. ValidationPipe 400s and errors rebuilt from RpcError):
 *   uses its status and message; when the body carries a `message` array
 *   (validation details), those are surfaced under `errors`.
 * - Anything else: logged and returned as a generic 500 so internals never leak.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
	private readonly logger = new Logger(AllExceptionsFilter.name);

	catch(exception: unknown, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest<Request>();

		let status = HttpStatus.INTERNAL_SERVER_ERROR;
		let message = 'Internal server error';
		let errors: unknown;

		if (exception instanceof HttpException) {
			status = exception.getStatus();
			const body = exception.getResponse();

			if (typeof body === 'string') {
				message = body;
			} else if (typeof body === 'object' && body !== null) {
				const responseBody = body as Record<string, unknown>;
				const bodyMessage = responseBody.message;

				if (Array.isArray(bodyMessage)) {
					// class-validator returns an array of constraint messages
					message = 'Validation failed';
					errors = bodyMessage;
				} else if (typeof bodyMessage === 'string') {
					message = bodyMessage;
				} else {
					message = exception.message;
				}
			}
		} else if (exception instanceof Error) {
			message = exception.message;
		}

		if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
			this.logger.error(
				`${request.method} ${request.url} -> ${status}`,
				exception instanceof Error
					? exception.stack
					: String(exception),
			);
		}

		const payload: ApiErrorResponse = {
			success: false,
			message,
			...(errors !== undefined ? { errors } : {}),
		};

		response.status(status).json(payload);
	}
}
