import { ThrottlerGuard } from './throttler.guard.js';

describe('ThrottlerGuard', () => {
  it('should be defined', () => {
    expect(new ThrottlerGuard()).toBeDefined();
  });
});
