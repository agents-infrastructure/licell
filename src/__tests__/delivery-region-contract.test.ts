import { describe, expect, it } from 'vitest';
import { LICELL_COMMAND_MANIFEST } from '../commands/registry';
import type { CommandRegionMetadata, DeclaredCliCommand } from '../commands/module';

function commandKey(rawName: string) {
  return rawName
    .trim()
    .split(/\s+/)
    .filter((token) => !/^[<[].*[>\]]$/.test(token))
    .join(' ');
}

const commandsByKey = Object.fromEntries(
  LICELL_COMMAND_MANIFEST.modules
    .flatMap((module) => [...(module.declaredCommands || [])])
    .map((command) => [commandKey(command.rawName), command] as const)
) as Record<string, DeclaredCliCommand>;

const EXPECTED_DELIVERY_REGION_METADATA: Record<string, CommandRegionMetadata> = {
  deploy: { scope: 'project' },
  'deploy plan': { scope: 'project' },
  'task config': { scope: 'project' },
  'task config set': { scope: 'project' },
  'task config rm': { scope: 'project' },
  'task invoke': { scope: 'project' },
  'task list': { scope: 'project' },
  'task info': { scope: 'project' },
  'task stop': { scope: 'project' },
  'release list': { scope: 'project' },
  'release promote': { scope: 'project' },
  'release rollback': { scope: 'project' },
  'release prune': { scope: 'project' },
  'fn list': { scope: 'auth' },
  'fn info': { scope: 'project' },
  'fn invoke': { scope: 'project' },
  'fn rm': { scope: 'project' },
  'fn logs': { scope: 'project' },
  'fn domain list': { scope: 'project' },
  'fn domain info': { scope: 'project' },
  'fn domain bind': { scope: 'project' },
  'fn domain unbind': { scope: 'project' },
  'env list': { scope: 'project' },
  'env set': { scope: 'project' },
  'env rm': { scope: 'project' },
  'env pull': { scope: 'project' },
  'domain app bind': { scope: 'project' },
  'domain app unbind': { scope: 'project' },
  'domain static bind': { scope: 'project' },
  'domain static unbind': { scope: 'project' }
};

describe('delivery command region contract', () => {
  it('locks every delivery command to its declared region scope', () => {
    expect(Object.keys(EXPECTED_DELIVERY_REGION_METADATA)).toHaveLength(30);

    for (const [key, expectedRegion] of Object.entries(EXPECTED_DELIVERY_REGION_METADATA)) {
      const command = commandsByKey[key];
      expect(command, key).toBeDefined();
      expect(command?.region, key).toEqual(expectedRegion);
      expect(command?.options?.filter((option) => option.rawName.includes('--region')), key).toHaveLength(1);
      const callRegionField = command?.descriptor?.result?.fields?.find((field) => field.name === 'callRegionId');
      expect(callRegionField, key).toBeDefined();
      expect(callRegionField?.required, key).toBe(false);
      if (key !== 'deploy plan') {
        expect(callRegionField?.description, key).toBe('本次命令实际使用的阿里云地域 ID。');
      }
    }
  });

  it('documents the one-shot deploy override follow-up', () => {
    const deploy = commandsByKey.deploy;
    expect(deploy?.descriptor?.agentTips).toEqual(expect.arrayContaining([
      expect.stringContaining('后续 project-scope 命令继续传同一 `--region`')
    ]));
    expect(deploy?.descriptor?.result?.fields).toContainEqual({
      name: 'regionGuidance',
      description: '仅当调用地域不同于项目默认地域时，提示后续继续显式传 Region 或更新项目默认值。',
      required: false
    });
  });

  it('distinguishes deploy plan invocation region from per-component target regions', () => {
    expect(commandsByKey['deploy plan']?.descriptor?.result?.fields).toContainEqual({
      name: 'callRegionId',
      description: '本次 plan 的 project-scope 调用地域；异构 workspace 中各 component 的目标地域仍以 `components[].target.region` 为准。',
      required: false
    });
  });
});
