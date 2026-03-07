import { describe, expect, it } from 'vitest';
import {
  getBuiltinUpgradeSafetyHint,
  renderReadmeUpgradeGuidance,
  renderSkillUpgradeNotes
} from '../utils/install-upgrade-docs';

describe('install-upgrade-docs', () => {
  it('renders README upgrade guidance bullets', () => {
    const output = renderReadmeUpgradeGuidance();
    expect(output).toContain('`licell upgrade` 会优先按“当前正在执行的安装来源”升级');
    expect(output).toContain('`--channel auto|release|npm|pnpm|yarn|bun`');
    expect(output).toContain('`licell upgrade --dry-run`');
  });

  it('renders skills upgrade notes in English', () => {
    const output = renderSkillUpgradeNotes();
    expect(output).toContain('follows the current installation source');
    expect(output).toContain('project-local `node_modules`');
    expect(output).toContain('`licell upgrade --dry-run`');
  });

  it('exposes a concise builtin safety hint', () => {
    expect(getBuiltinUpgradeSafetyHint()).toContain('`licell upgrade --dry-run`');
    expect(getBuiltinUpgradeSafetyHint()).toContain('explicit `--channel`');
  });
});
