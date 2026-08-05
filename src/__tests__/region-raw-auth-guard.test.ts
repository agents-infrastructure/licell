import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const EXPECTED_RAW_AUTH_CALLS: Record<string, number> = {
  'src/cli.ts': 2,
  'src/commands/auth.ts': 4,
  'src/commands/bootstrap.ts': 1,
  'src/commands/deploy.ts': 2,
  'src/commands/e2e.ts': 1,
  'src/utils/auth-recovery.ts': 3,
  'src/utils/cli-shared.ts': 2,
  'src/utils/deploy-plan.ts': 2
};

function listTypeScriptFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return entry.name === '__tests__' ? [] : listTypeScriptFiles(path);
    }
    return entry.isFile() && entry.name.endsWith('.ts') ? [path] : [];
  });
}

function countRawAuthCalls(path: string) {
  return readFileSync(path, 'utf8').match(/\bConfig\s*\.\s*getAuth\s*\(/g)?.length || 0;
}

describe('raw auth region guard', () => {
  it('requires an explicit baseline update for every raw Config.getAuth call', () => {
    const root = resolve(process.cwd());
    const actual = Object.fromEntries(
      listTypeScriptFiles(join(root, 'src'))
        .map((path) => [relative(root, path), countRawAuthCalls(path)] as const)
        .filter(([, count]) => count > 0)
    );

    expect(actual).toEqual(EXPECTED_RAW_AUTH_CALLS);
  });
});
