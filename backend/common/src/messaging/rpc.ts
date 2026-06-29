import { HttpException, HttpStatus } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError, firstValueFrom, throwError } from 'rxjs';

/**
 * Error payload carried across the TCP boundary. A microservice handler throws
 * an `RpcException` wrapping this so the gateway can rebuild the right HTTP
 * status — a plain thrown exception would lose its status code over the wire.
 */
export interface RpcError {
	statusCode: number;
	message: string;
}

function isRpcError(value: unknown): value is RpcError {
	return (
		typeof value === 'object' &&
		value !== null &&
		typeof (value as RpcError).statusCode === 'number' &&
		typeof (value as RpcError).message === 'string'
	);
}

/** Throws a status-carrying RpcException from inside a microservice handler. */
export function throwRpc(statusCode: HttpStatus, message: string): never {
	throw new RpcException({ statusCode, message } satisfies RpcError);
}

// Convenience throwers mirroring the Nest HTTP exceptions used in the monolith.
export const rpcBadRequest = (m: string): never =>
	throwRpc(HttpStatus.BAD_REQUEST, m);
export const rpcUnauthorized = (m: string): never =>
	throwRpc(HttpStatus.UNAUTHORIZED, m);
export const rpcForbidden = (m: string): never =>
	throwRpc(HttpStatus.FORBIDDEN, m);
export const rpcNotFound = (m: string): never =>
	throwRpc(HttpStatus.NOT_FOUND, m);
export const rpcConflict = (m: string): never =>
	throwRpc(HttpStatus.CONFLICT, m);

/**
 * Gateway-side helper: send a message to a service and await the reply,
 * translating any `RpcError` back into a matching `HttpException` so the
 * gateway's exception filter renders the correct status + envelope. Unknown
 * errors (e.g. a service being down) surface as 503.
 */
export async function sendRpc<TResult>(
	client: ClientProxy,
	pattern: string,
	payload: unknown,
): Promise<TResult> {
	return firstValueFrom(
		client.send<TResult>(pattern, payload).pipe(
			catchError((error: unknown) => {
				if (isRpcError(error)) {
					return throwError(
						() =>
							new HttpException(error.message, error.statusCode),
					);
				}
				return throwError(
					() =>
						new HttpException(
							'A downstream service is unavailable',
							HttpStatus.SERVICE_UNAVAILABLE,
						),
				);
			}),
		),
	);
}
