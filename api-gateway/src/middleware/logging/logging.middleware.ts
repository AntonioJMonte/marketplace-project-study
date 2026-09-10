import { Injectable, Logger, NestMiddleware } from '@nestjs/common';

// Intercep all requests and returns a log of each intercepted route
// The log will contain informations such as method, duration, url, ip, length, status code 

@Injectable()
export class LoggingMiddleware implements NestMiddleware {

  private readonly logger = new Logger('HTTP');
  
  use(req: any, res: any, next: () => void) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('User-Agent') || '';
    const startTime = Date.now();

    this.logger.log(
      `Incoming Request: ${method} ${originalUrl} - IP: ${ip} - User-Agent: ${userAgent}`
    );

    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('Content-Length');
      const duration = Date.now() - startTime;

      this.logger.log(
      `Outgoing Response: ${method} ${originalUrl} - ${statusCode} - ${contentLength || 0}b - ${duration}ms`
      );

      if (statusCode >= 400) {
        this.logger.log(
          `Error Response: ${method} ${originalUrl} - ${statusCode} - ${duration}ms`)
      }
    })

    // error log
    res.on('error', (error: { message: any; }) => {
      this.logger.error(
      `Response Error: ${method} ${originalUrl} - ${error.message}`
      );
    })

    // timeout log
      res.on('timeout', () => {
        this.logger.warn(
        `Response Timeout: ${method} ${originalUrl} - ${Date.now() - startTime}ms`
        );
    })

    next();
  }
}
