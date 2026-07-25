import { describe, it, expect } from 'vitest';

describe('Sanity Check', () => {
  it('should run successfully in jsdom environment', () => {
    expect(true).toBe(true);
    expect(window).toBeDefined();
  });
});
