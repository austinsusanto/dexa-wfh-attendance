import { ValueTransformer } from 'typeorm';

/**
 * TypeORM transformer for numeric SQL columns (e.g. DECIMAL) that the driver
 * returns as strings. Reads them back as JS numbers while preserving null.
 */
export const numericTransformer: ValueTransformer = {
	to: (value: number | null | undefined) => value,
	from: (value: string | null | undefined): number | null =>
		value === null || value === undefined ? null : Number(value),
};
