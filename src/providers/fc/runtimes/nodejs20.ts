import { relative } from 'path';
import { buildEntrypointWithBun } from '../../../utils/runtime';
import { findFirstJsOutput } from '../runtime';
import type { RuntimeHandler, ResolvedRuntimeConfig } from '../runtime-handler';

export const nodejs20Handler: RuntimeHandler = {
  name: 'nodejs20',
  defaultEntry: 'src/index.ts',
  unsupportedMessage: '当前地域暂不支持 runtime=nodejs20。请确认 nodejs20 在目标地域可用后重试。',

  async prepareBootFile(entryFile: string, outdir: string) {
    const buildResult = await buildEntrypointWithBun(entryFile, outdir);
    if (!buildResult.success) {
      const logs = buildResult.logs.map((log) => log.message).join('\n');
      throw new Error(`构建失败:\n${logs}`);
    }
    const jsOutputPath = findFirstJsOutput(outdir);
    if (!jsOutputPath) throw new Error('构建完成但未发现可执行 JS 产物');
    return relative(outdir, jsOutputPath).replace(/\\/g, '/');
  },

  async resolveConfig(_outdir: string, bootFile: string): Promise<ResolvedRuntimeConfig> {
    const handler = `${bootFile.replace(/\.[^.]+$/, '').replace(/\//g, '.')}.handler`;
    return { runtime: 'nodejs20', handler };
  }
};
