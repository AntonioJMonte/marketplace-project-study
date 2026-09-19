import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { serviceConfig } from '../../config/gateway.config.js';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ProxyService {
    private readonly logger = new Logger(ProxyService.name);

    constructor(private readonly httpService: HttpService) {}

    // keyof is creating a union of types
    // wich in this case are the name of the services in serviceConfig, that is, 'users' | 'products' | 'checkout' | 'payments'
    // proxyRequest will intercept the req (wich has already passed through the validation middleware) and will forward the body, handle timeout, capture logs and etc
    async proxyRequest(
        serviceName: keyof typeof serviceConfig, // tipo de serviço utilizado para fazer a requisição
        method: string, 
        path: string, // é a rota que vamos bater
        data?: any, // body da requisição
        headers?: any, // cabeçalho da requisição
        userInfo?: any) {

            const service = serviceConfig[serviceName];
            const url = `${service.url}${path}`;

            this.logger.log(`Proxying request to ${url} with method ${method}`);

            try {
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
                        method: method.toLowerCase() as any,
                        url,
                        data,
                        headers: enhancedHeaders,
                        timeout: service.timeout
                    })
                );
                return response;

            } catch (error) {
                this.logger.error(`Error proxying ${method} request to ${serviceName}: ${url}`);
                throw error;
            }
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
