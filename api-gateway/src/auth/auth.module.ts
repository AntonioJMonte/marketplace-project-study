import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './service/auth.service.js';
import { AuthController } from './controllers/auth.controller.js';


@Module({
    imports: [
        PassportModule,
        HttpModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: '24h' }
            }),
            inject: [ConfigService]
        })
    ],
    providers: [AuthService],
    exports: [],
    controllers: [AuthController] ,
})
export class AuthModule {}
