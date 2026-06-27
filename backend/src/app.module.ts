import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration, { validateEnv } from './config/configuration';
import { AppConfig } from './config/config.types';
import { buildTypeOrmOptions } from './config/typeorm.config';
import { AuthModule } from './auth/auth.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [configuration],
			validate: validateEnv,
		}),
		TypeOrmModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (configService: ConfigService<AppConfig, true>) =>
				buildTypeOrmOptions(configService),
		}),
		AuthModule,
	],
})
export class AppModule {}
