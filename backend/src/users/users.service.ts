import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

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
}
