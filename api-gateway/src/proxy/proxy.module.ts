import { Module } from '@nestjs/common';
import { ProxyService } from './service/proxy.service.js';
import { HttpModule } from '@nestjs/axios';
import { CircuitBreakerModule } from '../common/circuit-breaker/circuit-breaker.module.js';

@Module({
    imports: [HttpModule, CircuitBreakerModule], // tudo oq precisa ser importado para o módulo de proxy
    providers: [ProxyService],
    exports: [ProxyService], // o que precisa ser exportado para outros módulos
})
export class ProxyModule {}
