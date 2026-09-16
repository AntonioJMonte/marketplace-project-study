import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ProxyModule } from './proxy/proxy.module.js';
import { MiddlewareModule } from './middleware/middleware.module.js';
import { LoggingMiddleware } from './middleware/logging/logging.middleware.js';
import { AuthModule } from './auth/auth.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    ThrottlerModule.forRoot({
      throttlers: [ 
        // Each route can have a type of rate limit
        {
          name: 'short',
          ttl: 1000, // 1 sec
          limit: 10, // 10 request per sec
        },
        {
          name: 'medium',
          ttl: 60000, // 1 minute
          limit: 100, // 100 request per minute
        },
        {
          name: 'long',
          ttl: 900000, //15 minutes
          limit: 1000, // 100 request per minute
        },
      ],
    }),
    ProxyModule,
    MiddlewareModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
