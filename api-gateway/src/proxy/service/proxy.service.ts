import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { serviceConfig } from '../../config/gateway.config.js';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ProxyService {
    private readonly logger = new Logger(ProxyService.name);

    constructor(private readonly httpService: HttpService) {}

    // Keyof está criando uma união de tipos, 
    // que nesse caso é o nome dos serviços que estão no serviceConfig, ou seja, 'users' | 'products' | 'checkout' | 'payments'
    // proxyRequest vai interceptar a requisição e realizar a validação (verifica segurança, headers, auth, métodos e etc) e 
    // depois, se a requisição for válida, redireciona para o servidor 
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
