import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { HealthService } from './health.service.js';
import { HealthCheckService } from '../common/health/health-check.service.js';
import { HealthCheckModule } from '../common/health/health-check.module.js';

@Module({
  imports: [HealthCheckModule],
  controllers: [HealthController],
  providers: [HealthService]
})
export class HealthModule {}
