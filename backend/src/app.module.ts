import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration, { validateEnv } from './config/configuration';
import { AppConfig } from './config/config.types';
import { buildTypeOrmOptions } from './config/typeorm.config';

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
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
