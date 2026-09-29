import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { serviceConfig } from '../../config/gateway.config.js';
import { firstValueFrom } from 'rxjs';
import { CircuitBreakerService } from '../../common/circuit-breaker/circuit-breaker.service.js';
import { CacheFallBackService } from '../../common/fallback/cache.fallback.js';
import { DefaultFallBackService } from '../../common/fallback/default.fallback.js';
import { ListFormat } from 'typescript';

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
        private readonly circuitBreakerService: CircuitBreakerService,
        private readonly cacheFallBackService: CacheFallBackService,
        private readonly defaultFallBackService: DefaultFallBackService
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

            const fallback = this.createServiceFallback(serviceName, method, path);
            
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
                    if (method.toLocaleLowerCase() === 'get') { 
                        this.cacheFallBackService.saveSuccessfulResponse(
                            `${serviceName}-${path}`,
                            response.data 
                        )    
                    }
                    return response.data;

                },
                `proxy-${serviceName}`,
                fallback,
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

    createServiceFallback (serviceName: string, method: string, path: string) {
        switch (serviceName) {
            case 'users':
                if (path.includes('/auth/login')) {
                    return this.defaultFallBackService.createErrorFallback('users', 'Authentication service unavailable')
                }
                return this.defaultFallBackService.createErrorFallback('users', 'User service unavailable')
            case 'products':
                if (method.toLowerCase() === 'get') {
                    return this.cacheFallBackService.createCacheFallback(`product-${path}`, { products: [], total: 0, page: 1, limit: 10 })
                }
                return this.defaultFallBackService.createErrorFallback('products', 'Products service unavailable')
            case 'checkout':
            case 'payments':
                return this.defaultFallBackService.createErrorFallback(serviceName, `${serviceName} service unavailable`)
            default:
                return this.defaultFallBackService.createErrorFallback(serviceName, 'Service unavailable')
        }
    }
} 
