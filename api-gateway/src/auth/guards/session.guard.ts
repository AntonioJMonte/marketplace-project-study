import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../service/auth.service.js';

@Injectable()
export class SessionGuard implements CanActivate {

  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {

    // switchToHttp retrieves the original request object
    const request = context.switchToHttp().getRequest();

    // We extract the sessionToken from the headers of the original object
    const sessionToken = request.headers['x-session-token'];

    if (!sessionToken) { throw new UnauthorizedException('Session token required') };

    try {
      
      const session = await this.authService.validateSessionToken(sessionToken);
      if (!session.valid || !session.user) { throw new UnauthorizedException('Session token required') };
      
      request.user = session.user;
      return true
    } catch (error) {
      throw new UnauthorizedException('Invalid session token')
    }

  }
}
