import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {

  // Reflector imports Nest services used to read metadata associated 
  // with routes and controllers passed through the headers of a request
  constructor (private reflector: Reflector) {
    super();
  }


  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {

    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(), context.getClass()]);

    if (isPublic) return true;

    return super.canActivate(context);
  }

  handleRequest (err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
