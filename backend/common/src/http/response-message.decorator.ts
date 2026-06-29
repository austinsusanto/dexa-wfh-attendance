import { SetMetadata } from '@nestjs/common';

export const RESPONSE_MESSAGE_KEY = 'response_message';

/**
 * Sets a custom success message for the response envelope on a handler.
 * Falls back to 'Success' when absent.
 */
export const ResponseMessage = (message: string) =>
	SetMetadata(RESPONSE_MESSAGE_KEY, message);
