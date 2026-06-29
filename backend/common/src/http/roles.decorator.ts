import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums/app.enum';

export const ROLES_KEY = 'roles';

/**
 * Restricts a route to the given roles.
 * Example: `@Roles(UserRole.HRD_ADMIN)`.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
