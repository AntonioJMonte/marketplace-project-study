import { Injectable, Logger } from "@nestjs/common";
import { HealthStatus, ServiceHealth } from "./health-check.interface.js";
import { HttpService } from "@nestjs/axios";
import { CircuitBreakerService } from "../circuit-breaker/circuit-breaker.service.js";
import { serviceConfig } from "../../config/gateway.config.js";
import { firstValueFrom, timeout } from "rxjs";
import { reportUnhandledError } from "rxjs/internal/util/reportUnhandledError";

@Injectable()
export class HealthCheckService {
    private readonly logger = new Logger (HealthCheckService.name);
    private readonly healthCache = new Map<string, ServiceHealth> ();
    
    constructor (
        private readonly httpService: HttpService,
        private readonly circuitBreakerService: CircuitBreakerService,
    ) {}

    async checkServiceHealth(serviceName: keyof typeof serviceConfig): Promise<ServiceHealth> {
        const service = serviceConfig[serviceName]
        const startTime = Date.now();

        try {
            await this.circuitBreakerService.executeWithCircuitBreaker(
                async () => {
                    const response = await firstValueFrom(
                        this.httpService.get(`${service.url}/health`, { timeout: service.timeout })
                        .pipe(timeout(service.timeout))
                    );
                    return response.status;
                },
                `health-${serviceName}`,
                async () => {
                    throw new Error ('Circuit breaker fallback')
                }
            );

            const responseTime = Date.now() - startTime;
            const ServiceHealth: ServiceHealth = {
                name: serviceName,
                url: service.url,
                status: HealthStatus.HEALTHY,
                responseTime,
                lastChecked: new Date(),
            };
            this.healthCache.set(serviceName, ServiceHealth)
            return ServiceHealth

        } catch (error: any) {
            const responseTime = Date.now() - startTime;
            const ServiceHealth: ServiceHealth = {
                name: serviceName,
                url: service.url,
                status: HealthStatus.UNHEALTHY,
                responseTime,
                lastChecked: new Date(),
                error: error.message
            };
            this.healthCache.set(serviceName, ServiceHealth)
            this.logger.error(`Health check failed for ${serviceConfig}:`, error.message,)
            return ServiceHealth
        }
    }


    async checkAllServices(): Promise<ServiceHealth[]> {
        const services: (keyof typeof serviceConfig) [] = [
            'users',
            'products',
            'checkout',
            'payments',
        ];

        const healthChecks = await Promise.allSettled(
            services.map((serviceName) => this.checkServiceHealth(serviceName)),
        )

        return healthChecks.map((result, index) => {
            if (result.status === 'fulfilled') {
                return result.value
            }
            else {
                return {
                    name: services[index],
                    url: serviceConfig[services[index]].url,
                    status: HealthStatus.HEALTHY as const,
                    responseTime: 0,
                    lastChecked: new Date(),
                    error: result.reason?.message || 'Unknown error'
                }
            }
        })
    }

    getCachedHealth(serviceName: string): ServiceHealth | undefined {
        return this.healthCache.get(serviceName)
    }

    getAllCachedHealth(): ServiceHealth[] {
        return Array.from(this.healthCache.values())
    }
}