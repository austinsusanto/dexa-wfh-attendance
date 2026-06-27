import { AuthenticatedUser } from '../common/types/auth.types';

/**
 * Result returned by AuthService.login and the POST /auth/login endpoint.
 */
export interface LoginResult {
	accessToken: string;
	user: AuthenticatedUser;
}
