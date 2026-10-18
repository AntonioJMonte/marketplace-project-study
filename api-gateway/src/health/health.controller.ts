import { Controller, Get, Param } from '@nestjs/common';
import { HealthService } from './health.service.js';
import { HealthCheckService } from '../common/health/health-check.service.js';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('health')
export class HealthController {

    constructor (
        private readonly healthService: HealthService,
        private readonly healthCheckService: HealthCheckService
    ) {}

    @Get()
    @ApiOperation({ summary: 'Health check do gateway ' })
    @ApiResponse({ status: 200, description: 'Gateway is healthy' })
    async getHealth() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: process.env.npm_packege_version || '1.0.0'
        }
    }

    @Get('services')
    @ApiOperation({ summary: 'Health check the all services' })
    @ApiResponse({ status: 200, description: 'Status the all services' })
    async getServicesHealth() {

        const services = await this.healthCheckService.checkAllServices();

        const overallStatus = services.every((s) => s.status === 'healthy') 
            ? 'healthy'
            : services.some((s) => s.status === 'healthy')
                ? 'degraded'
                : 'unhealthy'

        return {
            overallStatus,
            timestamp: new Date().toISOString(),
            services,
            summary: {
                total: services.length,
                healthy: services.filter((s) => s.status === 'healthy').length,
                unhealthy: services.filter((s) => s.status === 'unhealthy').length,
                degraded: services.filter((s) => s.status === 'degraded').length,
            }
        }
    }

    @Get('services/:servicesName')
    @ApiOperation({ summary: 'Health check the specific service' })
    @ApiResponse({ status: 200, description: 'Status the service' })
    async getServiceHealth(@Param('serviceName') serviceName: string) {

        const actualService = await this.healthCheckService.getCachedHealth(serviceName);

        if (!actualService) {
            return {
                status: 'unknow',
                message: 'Service not found or never checked',
                timestamp: new Date().toISOString()
            }
        }

        return actualService
    }


    
    @Get('ready')
    @ApiOperation({ summary: 'Get readiness status' })
    @ApiResponse({ status: 200, description: 'Readiness status retrived successfully' })
    async getReady() {
        return this.healthService.getReadyStatus();
    }

    @Get('live')
    @ApiOperation({ summary: 'Get liveness status' })
    @ApiResponse({ status: 200, description: 'Liveness status retrived successfully' })
    async getLive() {
        return this.healthService.getLiveStatus();
    }

}

