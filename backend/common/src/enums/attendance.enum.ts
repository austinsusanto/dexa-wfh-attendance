/**
 * Enums for the attendances domain.
 */

/**
 * Kind of attendance punch. Mirrors the `attendances.type` ENUM column.
 */
export enum AttendanceType {
	CLOCK_IN = 'CLOCK_IN',
	CLOCK_OUT = 'CLOCK_OUT',
}
