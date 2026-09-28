import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { serviceConfig } from '../../config/gateway.config.js';
import { firstValueFrom } from 'rxjs';
import { CircuitBreakerService } from '../../common/circuit-breaker/circuit-breaker.service.js';

interface UserInfo { 
    userId: string;
    email: string;
    role: string;
}

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

@Injectable()
export class ProxyService {
    private readonly logger = new Logger(ProxyService.name);

    constructor(
        private readonly httpService: HttpService,
        private readonly circuitBreakerService: CircuitBreakerService
    ) {}

    // keyof is creating a union of types
    // wich in this case are the name of the services in serviceConfig, that is, 'users' | 'products' | 'checkout' | 'payments'
    // proxyRequest will intercept the req (wich has already passed through the validation middleware) and will forward the body, handle timeout, capture logs and etc
    async proxyRequest(
        serviceName: keyof typeof serviceConfig, // tipo de serviço utilizado para fazer a requisição
        method: string, 
        path: string, // é a rota que vamos bater
        data?: unknown, // body da requisição
        headers?: Record<string, string>, // cabeçalho da requisição
        userInfo?: UserInfo) {

            const service = serviceConfig[serviceName];
            const url = `${service.url}${path}`;

            this.logger.log(`Proxying request to ${url} with method ${method}`);

            
            return this.circuitBreakerService.executeWithCircuitBreaker(
                async () => {
                    // adiciona tudo que vem de header e complementa com as infos do usuário
                    const enhancedHeaders = { 
                        ...headers, 
                        'x-user-id': userInfo?.userId,
                        'x-user-email': userInfo?.email,
                        'x-user-role': userInfo?.role,
                    }

                    // cria a request para ser enviada para o servidor
                    const response = await firstValueFrom(
                        this.httpService.request({
                            method: method.toLowerCase() as HttpMethod,
                            url,
                            data,
                            headers: enhancedHeaders,
                            timeout: service.timeout
                        })
                    );
                    return response;

                },
                `proxy-${serviceName}`,
                () => {
                    throw new Error (`${serviceName} service is temporarily unavailable`)
                },
                { failureThreshold: 3, timeout: 30000, resetTimeout: 30000 }
            )
    } 

    async getServiceHealth (serviceName: keyof typeof serviceConfig) {

        try {
            const service = serviceConfig[serviceName];
            const response = await firstValueFrom(
                this.httpService.get(`${service.url}/health`, { timeout: 3000 })
            );
            return { status: 'healthy', data: response.data };

        } catch (error: any) {
            return { status: 'unhealthy', error: error?.message ?? 'Unknown error' }
        }

    }   
} 
