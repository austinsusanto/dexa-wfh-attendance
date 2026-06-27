import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateEmployeeDto } from './create-employee.dto';

/**
 * Body for updating an employee. Derived from CreateEmployeeDto but:
 * - all fields optional (PartialType)
 * - `email` and `initialPassword` removed (OmitType): email is the login
 *   identity and immutable here; password is changed via a dedicated flow.
 */
export class UpdateEmployeeDto extends PartialType(
	OmitType(CreateEmployeeDto, ['email', 'initialPassword'] as const),
) {}
