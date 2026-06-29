/**
 * Message-pattern names for the NestJS TCP transport. Each service registers
 * `@MessagePattern({ cmd })` handlers; the gateway (and other services) call
 * them via `ClientProxy.send({ cmd }, payload)`.
 *
 * Grouping the `cmd` strings here keeps the cross-service contract in one place
 * so a rename can never silently break a caller.
 */

export const IDENTITY_CMD = {
	LOGIN: 'identity.login',
	VALIDATE_TOKEN: 'identity.validateToken',
	CREATE_USER: 'identity.createUser',
	EXISTS_BY_EMAIL: 'identity.existsByEmail',
} as const;

export const EMPLOYEES_CMD = {
	CREATE: 'employees.create',
	FIND_ALL: 'employees.findAll',
	FIND_ONE: 'employees.findOne',
	UPDATE: 'employees.update',
	REMOVE: 'employees.remove',
	FIND_BY_IDS: 'employees.findByIds',
	GET_ACTIVE_STATUS: 'employees.getActiveStatus',
} as const;

export const ATTENDANCES_CMD = {
	CREATE: 'attendances.create',
	FIND_MINE: 'attendances.findMine',
	FIND_ALL_FOR_ADMIN: 'attendances.findAllForAdmin',
	FIND_ONE: 'attendances.findOne',
} as const;

/** Injection tokens for the per-service `ClientProxy` instances. */
export const CLIENT_TOKEN = {
	IDENTITY: 'IDENTITY_CLIENT',
	EMPLOYEES: 'EMPLOYEES_CLIENT',
	ATTENDANCES: 'ATTENDANCES_CLIENT',
} as const;
