import { describe, it, expect } from 'vitest';
import { createPool } from '../utils/concurrency';

describe('createPool', () => {
  it('limits concurrency to specified value', async () => {
    const pool = createPool(2);
    let active = 0;
    let maxActive = 0;

    const task = () => pool(async () => {
      active++;
      maxActive = Math.max(maxActive, active);
      await new Promise((r) => setTimeout(r, 50));
      active--;
    });

    await Promise.all([task(), task(), task(), task(), task()]);
    expect(maxActive).toBeLessThanOrEqual(2);
  });

  it('executes all tasks', async () => {
    const pool = createPool(3);
    const results: number[] = [];

    const tasks = Array.from({ length: 10 }, (_, i) =>
      pool(async () => {
        results.push(i);
        return i;
      })
    );

    const returned = await Promise.all(tasks);
    expect(results.length).toBe(10);
    expect(returned).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('returns task result', async () => {
    const pool = createPool(1);
    const result = await pool(async () => 'hello');
    expect(result).toBe('hello');
  });

  it('propagates errors', async () => {
    const pool = createPool(1);
    await expect(
      pool(async () => { throw new Error('boom'); })
    ).rejects.toThrow('boom');
  });

  it('continues processing after error', async () => {
    const pool = createPool(1);
    const results: string[] = [];

    const p1 = pool(async () => { throw new Error('fail'); }).catch(() => results.push('caught'));
    const p2 = pool(async () => { results.push('ok'); });

    await Promise.all([p1, p2]);
    expect(results).toContain('caught');
    expect(results).toContain('ok');
  });

  it('handles concurrency of 1 (serial execution)', async () => {
    const pool = createPool(1);
    const order: number[] = [];

    await Promise.all([
      pool(async () => { order.push(1); await new Promise((r) => setTimeout(r, 30)); order.push(2); }),
      pool(async () => { order.push(3); await new Promise((r) => setTimeout(r, 10)); order.push(4); }),
    ]);

    expect(order).toEqual([1, 2, 3, 4]);
  });

  it('handles high concurrency limit gracefully', async () => {
    const pool = createPool(100);
    const results = await Promise.all(
      Array.from({ length: 5 }, (_, i) => pool(async () => i))
    );
    expect(results).toEqual([0, 1, 2, 3, 4]);
  });

  it('throws on non-positive concurrency', () => {
    expect(() => createPool(0)).toThrow('concurrency must be a positive integer');
    expect(() => createPool(-1)).toThrow('concurrency must be a positive integer');
    expect(() => createPool(1.5)).toThrow('concurrency must be a positive integer');
  });
});
