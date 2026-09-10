import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
    imports: [
        ThrottlerModule.forRoot({
              throttlers: [
                {
                  ttl: 60_000,
                  limit: 100,
                },
              ],
            }),
    ],
    providers: []
})
export class MiddlewareModule {}
