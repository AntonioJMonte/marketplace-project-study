import { Module } from "@nestjs/common";
import { CircuitBreakerService } from "./circuit-breaker.service.js";
import { HttpService } from "@nestjs/axios";

@Module({
    providers: [CircuitBreakerService],
    exports: [CircuitBreakerService]
})

export class CircuitBreakerModule {}
