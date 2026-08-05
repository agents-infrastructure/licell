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

const EXPECTED_AUTOMATION_REGION_METADATA: Record<string, CommandRegionMetadata> = {
  'auth export': { scope: 'auth' },
  doctor: { scope: 'auth' },
  'workspace doctor': { scope: 'auth' },
  'e2e run': { scope: 'auth' },
  'e2e cleanup': { scope: 'manifest' }
};

describe('automation command region contract', () => {
  it('locks all five automation commands to their declared region scope', () => {
    expect(Object.keys(EXPECTED_AUTOMATION_REGION_METADATA)).toHaveLength(5);

    for (const [key, expectedRegion] of Object.entries(EXPECTED_AUTOMATION_REGION_METADATA)) {
      const command = commandsByKey[key];
      expect(command, key).toBeDefined();
      expect(command?.region, key).toEqual(expectedRegion);
      expect(command?.options?.filter((option) => option.rawName.includes('--region')), key).toHaveLength(1);
      expect(command?.descriptor?.result?.fields).toContainEqual({
        name: 'callRegionId',
        description: '本次命令实际使用的阿里云地域 ID。',
        required: false
      });
    }
  });

  it('does not make e2e list regional', () => {
    expect(commandsByKey['e2e list']?.region).toBeUndefined();
    expect(commandsByKey['e2e list']?.options?.some((option) => option.rawName.includes('--region'))).not.toBe(true);
  });
});
