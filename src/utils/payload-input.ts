import { readFileSync, realpathSync } from 'fs';
import { isAbsolute, relative, resolve } from 'path';
import { toOptionalString } from './cli-shared';

export interface PayloadInputOptions {
  payload?: unknown;
  file?: unknown;
}

export function resolveOptionalPayloadInput(options: PayloadInputOptions) {
  const payloadText = toOptionalString(options.payload);
  const payloadFile = toOptionalString(options.file);
  if (payloadText && payloadFile) throw new Error('--payload 与 --file 不能同时使用');
  if (!payloadFile) return payloadText;

  let resolvedPath: string;
  try {
    resolvedPath = realpathSync(resolve(payloadFile));
  } catch {
    throw new Error(`文件不存在或无法访问: ${payloadFile}`);
  }
  const rel = relative(process.cwd(), resolvedPath);
  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error('--file 路径必须在当前工作目录内');
  }
  return readFileSync(resolvedPath, 'utf-8');
}
