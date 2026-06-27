import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { UserRole } from '../common/enums/app.enum';
import { User } from './entities/user.entity';
import { CreateEmployeeUserParams } from './users.types';

const BCRYPT_ROUNDS = 10;

/**
 * Owns access to the `users` table. Exposes lookups needed by auth; kept as a
 * narrow service so the users domain can later be extracted into its own
 * microservice (PLAN §2).
 */
@Injectable()
export class UsersService {
	constructor(
		@InjectRepository(User)
		private readonly userRepo: Repository<User>,
	) {}

	/**
	 * Finds a user by email including the password column (which is
	 * `select: false` by default). For credential verification only.
	 */
	findByEmailForAuth(email: string): Promise<User | null> {
		return this.userRepo
			.createQueryBuilder('user')
			.addSelect('user.password')
			.where('user.email = :email', { email })
			.getOne();
	}

	/** Finds a user by id (without the password). */
	findById(id: number): Promise<User | null> {
		return this.userRepo.findOne({ where: { id } });
	}

	/** True if a login account with this email already exists. */
	async existsByEmail(email: string): Promise<boolean> {
		const count = await this.userRepo.count({ where: { email } });
		return count > 0;
	}

	/**
	 * Creates an EMPLOYEE login account for a newly-created employee.
	 * Hashes the password and links it to the employee via employeeId.
	 */
	async createEmployeeUser(params: CreateEmployeeUserParams): Promise<User> {
		const passwordHash = await bcrypt.hash(params.password, BCRYPT_ROUNDS);
		const user = this.userRepo.create({
			email: params.email,
			password: passwordHash,
			role: UserRole.EMPLOYEE,
			employeeId: params.employeeId,
		});
		return this.userRepo.save(user);
	}
}
