import { Injectable, PayloadTooLargeException, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../service/auth.service.js';

@Injectable()

export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor (private readonly authService: AuthService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET ?? (() => {
                throw new Error("JWT_SECRET environment variable is not defined");
            })()
        });
    }

    async validate(payload: any) {
        const user = await this.authService.validateJwtToken(payload.token);
        if(!user) {
            throw new UnauthorizedException()
        };
        return user;
    }
}