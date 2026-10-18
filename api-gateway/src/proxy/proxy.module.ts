import { Module } from '@nestjs/common';
import { ProxyService } from './service/proxy.service.js';
import { HttpModule } from '@nestjs/axios';
import { CircuitBreakerModule } from '../common/circuit-breaker/circuit-breaker.module.js';
import { FallBackModule } from '../common/fallback/fallback.module.js';
import { TimeoutModule } from '../common/timeout/timeout.module.js';
import { RetryModule } from '../common/retry/retry.module.js';

@Module({
    imports: [HttpModule, CircuitBreakerModule, FallBackModule, TimeoutModule, RetryModule], // tudo oq precisa ser importado para o módulo de proxy
    providers: [ProxyService],
    exports: [ProxyService], // o que precisa ser exportado para outros módulos
})
export class ProxyModule {}
