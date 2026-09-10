import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import { ProxyService } from './proxy/service/proxy.service.js';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly proxyService: ProxyService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async getHealth() {
    return {
      statusbar: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        users: await this.proxyService.getServiceHealth('users'),
        products: await this.proxyService.getServiceHealth('products'),
        checkout: await this.proxyService.getServiceHealth('checkout'),
        payments: await this.proxyService.getServiceHealth('payments')
      }
    }
  }

}
