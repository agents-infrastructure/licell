import { describe, expect, it } from 'vitest';
import { getSupportedFcRuntimes, normalizeFcRuntime } from '../providers/fc';
import { getRuntime } from '../providers/fc/runtime-handler';

describe('docker runtime integration', () => {
  it('docker is registered as a supported runtime', () => {
    expect(getSupportedFcRuntimes()).toContain('docker');
  });

  it('normalizeFcRuntime accepts docker', () => {
    expect(normalizeFcRuntime('docker')).toBe('docker');
    expect(normalizeFcRuntime(' Docker ')).toBe('docker');
  });

  it('getRuntime returns docker handler', () => {
    const handler = getRuntime('docker');
    expect(handler.name).toBe('docker');
    expect(handler.defaultEntry).toBe('');
    expect(handler.unsupportedMessage).toContain('custom-container');
  });

  it('docker resolveConfig returns custom-container runtime with skipCodePackaging', async () => {
    const handler = getRuntime('docker');
    const config = await handler.resolveConfig('/tmp/fake', 'registry-vpc.cn-hangzhou.aliyuncs.com/licell/app:20260217');
    expect(config.runtime).toBe('custom-container');
    expect(config.skipCodePackaging).toBe(true);
    expect(config.customContainerConfig).toBeDefined();
    expect(config.customRuntimeConfig).toBeUndefined();
  });
});
