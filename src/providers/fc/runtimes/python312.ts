import { preparePythonEntrypoint } from '../runtime';
import type { RuntimeHandler, ResolvedRuntimeConfig } from '../runtime-handler';

export const python312Handler: RuntimeHandler = {
  name: 'python3.12',
  defaultEntry: 'src/main.py',
  unsupportedMessage: '当前地域暂不支持 runtime=python3.12。请改用 nodejs20，或确认 python3.12 在目标地域可用后重试。',

  async prepareBootFile(entryFile: string, outdir: string) {
    return preparePythonEntrypoint(entryFile, outdir, 'python3.12');
  },

  async resolveConfig(_outdir: string, bootFile: string): Promise<ResolvedRuntimeConfig> {
    const handler = `${bootFile.replace(/\.[^.]+$/, '').replace(/\//g, '.')}.handler`;
    return { runtime: 'python3.12', handler };
  }
};
