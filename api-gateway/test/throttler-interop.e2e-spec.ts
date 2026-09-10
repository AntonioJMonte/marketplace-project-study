import { Controller, Get, INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
  SkipThrottle,
  Throttle,
  ThrottlerGuard,
  ThrottlerModule,
} from '@nestjs/throttler';
import request from 'supertest';
import { App } from 'supertest/types';

@Controller()
class ProbeController {
  @Get('default')
  def() {
    return 'default';
  }

  @Throttle({ default: { limit: 2, ttl: 60_000 } })
  @Get('strict')
  strict() {
    return 'strict';
  }

  @SkipThrottle()
  @Get('skipped')
  skipped() {
    return 'skipped';
  }
}

describe('throttler <-> nest 12 interop', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const mod: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot({
          throttlers: [{ ttl: 60_000, limit: 5 }],
        }),
      ],
      controllers: [ProbeController],
      providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
    }).compile();

    app = mod.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('aplica o limite global (5) na rota padrao', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app.getHttpServer()).get('/default').expect(200);
    }
    await request(app.getHttpServer()).get('/default').expect(429);
  });

  it('@Throttle sobrescreve o limite global (metadata do decorator)', async () => {
    await request(app.getHttpServer()).get('/strict').expect(200);
    await request(app.getHttpServer()).get('/strict').expect(200);
    await request(app.getHttpServer()).get('/strict').expect(429);
  });

  it('@SkipThrottle ignora o limite (metadata do decorator)', async () => {
    for (let i = 0; i < 12; i++) {
      await request(app.getHttpServer()).get('/skipped').expect(200);
    }
  });
});
