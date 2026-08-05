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

const EXPECTED_DATA_REGION_METADATA: Record<string, CommandRegionMetadata> = {
  'db add': { scope: 'auth' },
  'db class': { scope: 'auth' },
  'db list': { scope: 'auth' },
  'db info': { scope: 'binding', binding: 'database', target: { argumentIndex: 0 } },
  'db connect': { scope: 'binding', binding: 'database', target: { argumentIndex: 0 } },
  'db public-access': { scope: 'binding', binding: 'database', target: { argumentIndex: 0 } },
  'db rm': { scope: 'binding', binding: 'database', target: { argumentIndex: 0 } },
  'cache add': { scope: 'auth' },
  'cache class': { scope: 'auth' },
  'cache list': { scope: 'auth' },
  'cache info': { scope: 'binding', binding: 'cache', target: { argumentIndex: 0 } },
  'cache connect': { scope: 'binding', binding: 'cache', target: { argumentIndex: 0 } },
  'cache rotate-password': { scope: 'binding', binding: 'cache', target: { option: 'instance' } },
  'cache public-access': { scope: 'binding', binding: 'cache', target: { argumentIndex: 0 } },
  'cache rm': { scope: 'binding', binding: 'cache', target: { argumentIndex: 0 } },
  'supa add': { scope: 'auth' },
  'supa list': { scope: 'auth' },
  'supa info': { scope: 'binding', binding: 'supabase', target: { argumentIndex: 0 } },
  'supa connect': { scope: 'binding', binding: 'supabase', target: { argumentIndex: 0 } },
  'supa config': { scope: 'binding', binding: 'supabase', target: { argumentIndex: 0 } },
  'supa whitelist': { scope: 'binding', binding: 'supabase', target: { argumentIndex: 0 } },
  'supa reset-password': { scope: 'binding', binding: 'supabase', target: { argumentIndex: 0 } },
  'supa restart': { scope: 'binding', binding: 'supabase', target: { argumentIndex: 0 } },
  'supa stop': { scope: 'binding', binding: 'supabase', target: { argumentIndex: 0 } },
  'supa start': { scope: 'binding', binding: 'supabase', target: { argumentIndex: 0 } },
  'supa rm': { scope: 'binding', binding: 'supabase', target: { argumentIndex: 0 } }
};

describe('data command region contract', () => {
  it('locks every RDS, Cache, and Supabase command to its declared region scope', () => {
    expect(Object.keys(EXPECTED_DATA_REGION_METADATA)).toHaveLength(26);

    for (const [key, expectedRegion] of Object.entries(EXPECTED_DATA_REGION_METADATA)) {
      const command = commandsByKey[key];
      expect(command, key).toBeDefined();
      expect(command?.region, key).toEqual(expectedRegion);
      expect(command?.options?.filter((option) => option.rawName.includes('--region')), key).toHaveLength(1);
      expect(command?.descriptor?.result?.fields, key).toContainEqual({
        name: 'callRegionId',
        description: '本次命令实际使用的阿里云地域 ID。',
        required: false
      });
    }
  });

  it('keeps db info resource region separate from invocation region', () => {
    const fields = commandsByKey['db info']?.descriptor?.result?.fields || [];
    expect(fields.some((field) => field.name === 'regionId')).toBe(true);
    expect(fields.some((field) => field.name === 'callRegionId')).toBe(true);
  });

  it('documents whether cache password rotation updated the project binding', () => {
    const command = commandsByKey['cache rotate-password'];
    expect(command?.options?.find((option) => option.rawName.startsWith('--instance'))?.description)
      .toContain('不改写项目 binding/env');
    expect(command?.descriptor?.result?.fields).toContainEqual({
      name: 'projectConfigSynced',
      description: '是否同步更新了项目 cache binding 与 REDIS_* 环境变量。',
      required: true
    });
  });
});
