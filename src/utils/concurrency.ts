export function createPool(concurrency: number) {
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new Error('concurrency must be a positive integer');
  }
  let active = 0;
  const queue: Array<() => void> = [];

  function next() {
    if (queue.length > 0 && active < concurrency) {
      active += 1;
      queue.shift()!();
    }
  }

  return async function run<T>(fn: () => Promise<T>): Promise<T> {
    if (active >= concurrency) {
      await new Promise<void>((resolve) => queue.push(resolve));
    } else {
      active += 1;
    }
    try {
      return await fn();
    } finally {
      active -= 1;
      next();
    }
  };
}
