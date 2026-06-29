import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@dexa/common/enums';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

jest.mock('bcrypt');

describe('UsersService', () => {
	let service: UsersService;
	let repo: {
		createQueryBuilder: jest.Mock;
		findOne: jest.Mock;
		count: jest.Mock;
		create: jest.Mock;
		save: jest.Mock;
	};
	let qb: {
		addSelect: jest.Mock;
		where: jest.Mock;
		getOne: jest.Mock;
	};

	beforeEach(async () => {
		qb = {
			addSelect: jest.fn().mockReturnThis(),
			where: jest.fn().mockReturnThis(),
			getOne: jest.fn(),
		};
		repo = {
			createQueryBuilder: jest.fn().mockReturnValue(qb),
			findOne: jest.fn(),
			count: jest.fn(),
			create: jest.fn((data) => data),
			save: jest.fn((data) => Promise.resolve({ id: 10, ...data })),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UsersService,
				{ provide: getRepositoryToken(User), useValue: repo },
			],
		}).compile();

		service = module.get(UsersService);
	});

	it('findByEmailForAuth selects the password column explicitly', async () => {
		const user = { id: 1, email: 'a@b.com', password: 'hash' };
		qb.getOne.mockResolvedValue(user);

		const result = await service.findByEmailForAuth('a@b.com');

		expect(repo.createQueryBuilder).toHaveBeenCalledWith('user');
		expect(qb.addSelect).toHaveBeenCalledWith('user.password');
		expect(qb.where).toHaveBeenCalledWith('user.email = :email', {
			email: 'a@b.com',
		});
		expect(result).toBe(user);
	});

	it('findById delegates to the repository without the password', async () => {
		const user = { id: 1, email: 'a@b.com' };
		repo.findOne.mockResolvedValue(user);

		const result = await service.findById(1);

		expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
		expect(result).toBe(user);
	});

	describe('existsByEmail', () => {
		it('returns true when a matching account exists', async () => {
			repo.count.mockResolvedValue(1);
			await expect(service.existsByEmail('a@b.com')).resolves.toBe(true);
		});

		it('returns false when none exists', async () => {
			repo.count.mockResolvedValue(0);
			await expect(service.existsByEmail('a@b.com')).resolves.toBe(false);
		});
	});

	it('createEmployeeUser hashes the password and stores an EMPLOYEE account', async () => {
		(bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');

		const result = await service.createEmployeeUser({
			email: 'new@dexa.com',
			password: 'PlainPw1',
			employeeId: 7,
		});

		expect(bcrypt.hash).toHaveBeenCalledWith('PlainPw1', 10);
		expect(repo.create).toHaveBeenCalledWith({
			email: 'new@dexa.com',
			password: 'hashed-pw',
			role: UserRole.EMPLOYEE,
			employeeId: 7,
		});
		expect(result).toMatchObject({ id: 10, email: 'new@dexa.com' });
	});
});
