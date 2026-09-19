import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerException, ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker (req: Record<string, any>): Promise<string> {
    return `${req.ip}-${req.headers['user-agent']}`;
  }
    
  protected async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    const { context, limit, ttl } = requestProps;
    const { req, res } = this.getRequestResponse(context);

    const throttles = this.reflector.get('throttler', context.getHandler());
    const throttlerName = throttles ? Object.keys(throttles) [0] : 'default'
    const tracker = await this.getTracker(req);
    const key = this.generateKey(context, tracker, throttlerName);
    
    const totalHits = await this.storageService.increment(
      key,
      ttl,
      limit,
      1,
      throttlerName,
    )

    if (Number(totalHits) > limit) {
      res.setHeaders('Retry-After', Math.round(ttl/1000));
      throw new ThrottlerException();
    }

    res.setHeaders(`${this.headerPrefix}-Limit`, limit);
    res.setHeaders(`${this.headerPrefix}-Remaining`, limit - Number(totalHits));
    res.setHeaders(`${this.headerPrefix}-Reset`, Math.round(ttl/1000));
    return true
  }

}

