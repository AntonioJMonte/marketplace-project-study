import { Module } from "@nestjs/common";
import { HealthCheckService } from "./health-check.service.js";
import { HttpModule, HttpService } from "@nestjs/axios";
import { CircuitBreakerModule } from "../circuit-breaker/circuit-breaker.module.js";


@Module({
    imports: [HttpModule, CircuitBreakerModule],
    providers: [HealthCheckService],
    exports: [HealthCheckService],
})

export class HealthCheckModule {}