import { Module } from "@nestjs/common";
import { CircuitBreakerService } from "../circuit-breaker/circuit-breaker.service.js";
import { CacheFallBackService } from "./cache.fallback.js";
import { DefaultFallBackService } from "./default.fallback.js";

@Module({
    providers: [CacheFallBackService, DefaultFallBackService],
    exports: [CacheFallBackService, DefaultFallBackService],
})

export class FallBackModule {}