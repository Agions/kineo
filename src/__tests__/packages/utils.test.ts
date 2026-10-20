/**
 * utils.test.ts — Unit tests for @kineo/utils package
 */

import { delay, simpleHash, formatTime, formatBytes } from '../../../packages/utils/src/index';

describe('@kineo/utils Package Suite', () => {
  it('Should delay execution by specified milliseconds', async () => {
    const start = Date.now();
    await delay(50);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(40);
  });

  it('Should compute deterministic hash strings', () => {
    const hash1 = simpleHash('Kineo AI Studio');
    const hash2 = simpleHash('Kineo AI Studio');
    const hash3 = simpleHash('Different Prompt');

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(typeof hash1).toBe('string');
  });

  it('Should format seconds into mm:ss format', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(65)).toBe('01:05');
    expect(formatTime(3600)).toBe('60:00');
  });

  it('Should format byte numbers into readable units', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1048576)).toBe('1 MB');
  });
});
