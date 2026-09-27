import { Module } from "@nestjs/common";
import { CircuitBreakerService } from "./circuit-breaker.service.js";

@Module({
    providers: [CircuitBreakerService],
    exports: [CircuitBreakerService]
})

export class CircuitBreakerModule {}
