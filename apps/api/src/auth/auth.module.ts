/**
 * SGIP — Auth Module
 * Ticket: SGIP-2.1.1.1 through SGIP-2.1.4.4
 *
 * Wires: AuthService, AuthController, JwtStrategy, UsersService, EmailService.
 * Exports: AuthService (for use in other modules if needed), JwtStrategy.
 */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../common/prisma/prisma.module';
import { RedisModule } from '../common/redis/redis.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { EmailService } from '../common/email/email.service';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const privateKey = config.get<string>('JWT_PRIVATE_KEY');
        const isDev = config.get<string>('NODE_ENV') !== 'production';

        if (privateKey) {
          return {
            privateKey: Buffer.from(privateKey, 'base64').toString('utf-8'),
            signOptions: {
              algorithm: 'RS256' as const,
              expiresIn: config.get<string>(
                'JWT_ACCESS_TOKEN_EXPIRY',
                '15m',
              ) as `${number}${'s' | 'm' | 'h' | 'd'}`,
            },
          };
        }

        if (isDev) {
          // Dev fallback: symmetric secret (NOT for production)
          return {
            secret: 'dev-fallback-symmetric-secret-NOT-FOR-PRODUCTION',
            signOptions: {
              expiresIn: config.get<string>(
                'JWT_ACCESS_TOKEN_EXPIRY',
                '15m',
              ) as `${number}${'s' | 'm' | 'h' | 'd'}`,
            },
          };
        }

        throw new Error('JWT_PRIVATE_KEY is required in production');
      },
    }),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, EmailService],
  exports: [AuthService, JwtStrategy],
})
export class AuthModule {}
