import { SessionGuard } from './session.guard.js';

describe('SessionGuard', () => {
  it('should be defined', () => {
    expect(new SessionGuard()).toBeDefined();
  });
});
