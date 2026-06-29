/**
 * Type definitions for the API Gateway configuration.
 */

export interface TcpConfig {
	host: string;
	port: number;
}

export interface JwtConfig {
	secret: string;
}

export interface MinioConfig {
	endPoint: string;
	port: number;
	useSSL: boolean;
	accessKey: string;
	secretKey: string;
	bucket: string;
}

export interface AppConfig {
	nodeEnv: string;
	port: number;
	corsOrigin: string[];
	jwt: JwtConfig;
	identityClient: TcpConfig;
	employeesClient: TcpConfig;
	attendancesClient: TcpConfig;
	minio: MinioConfig;
}
