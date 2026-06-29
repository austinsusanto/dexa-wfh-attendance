import { UserRole } from '../enums/app.enum';

/**
 * Shapes for authentication: the signed JWT payload and the user object
 * attached to the request by the gateway's JWT guard.
 */

export interface JwtPayload {
	sub: number;
	email: string;
	role: UserRole;
	employeeId: number | null;
}

export interface AuthenticatedUser {
	id: number;
	email: string;
	role: UserRole;
	employeeId: number | null;
}
