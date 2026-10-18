import { Module } from '@nestjs/common';
import { TimeoutService } from './timeout.service.js';

@Module({
  providers: [TimeoutService],
  exports: [TimeoutService]
})
export class TimeoutModule {}
