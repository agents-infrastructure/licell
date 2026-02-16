import { spawn } from 'child_process';

interface BuildLog {
  message: string;
}

export interface RuntimeBuildResult {
  success: boolean;
  logs: BuildLog[];
}

export async function sleep(ms: number) {
  if (typeof Bun !== 'undefined' && typeof Bun.sleep === 'function') {
    await Bun.sleep(ms);
    return;
  }
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function buildEntrypointWithBun(entryFile: string, outdir: string): Promise<RuntimeBuildResult> {
  if (typeof Bun !== 'undefined' && typeof Bun.build === 'function') {
    const result = await Bun.build({
      entrypoints: [entryFile],
      outdir,
      target: 'node',
      format: 'cjs',
      minify: true
    });
    return {
      success: result.success,
      logs: result.logs.map((log) => ({ message: log.message }))
    };
  }

  const args = ['build', entryFile, '--target', 'node', '--format', 'cjs', '--minify', '--outdir', outdir];
  const commandResult = await new Promise<{
    code: number | null;
    stdout: string;
    stderr: string;
    error?: Error;
  }>((resolve) => {
    const child = spawn('bun', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });
    child.on('error', (error) => {
      resolve({ code: null, stdout, stderr, error });
    });
    child.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });
  });

  if (commandResult.error) {
    return {
      success: false,
      logs: [{ message: `调用 bun build 失败: ${commandResult.error.message}` }]
    };
  }
  if (commandResult.code !== 0) {
    const message = commandResult.stderr.trim() || commandResult.stdout.trim() || `bun build 失败，退出码 ${commandResult.code}`;
    return { success: false, logs: [{ message }] };
  }
  return { success: true, logs: [] };
}
