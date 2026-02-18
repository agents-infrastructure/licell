import { spawnSync } from 'child_process';

export function runHook(hookName: string, command: string | undefined): void {
  if (!command || !command.trim()) return;
  const result = spawnSync('sh', ['-c', command.trim()], {
    stdio: 'inherit',
    env: process.env
  });
  if (result.status !== 0) {
    throw new Error(`${hookName} hook 执行失败（exit=${result.status ?? 'unknown'}）: ${command.trim()}`);
  }
}
