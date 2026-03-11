import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import {
  README_QUICK_REFERENCE_END,
  README_QUICK_REFERENCE_START,
  renderReadmeQuickReference,
  syncReadmeGeneratedSections,
  syncReadmeQuickReferenceSection
} from '../utils/readme-docs';
import {
  README_UPGRADE_GUIDANCE_END,
  README_UPGRADE_GUIDANCE_START,
  renderReadmeUpgradeGuidance
} from '../utils/install-upgrade-docs';

describe('syncReadmeQuickReferenceSection', () => {
  it('replaces content between README quick reference markers', () => {
    const input = [
      '# Title',
      '',
      README_UPGRADE_GUIDANCE_START,
      'upgrade guidance',
      README_UPGRADE_GUIDANCE_END,
      '',
      README_QUICK_REFERENCE_START,
      'old content',
      README_QUICK_REFERENCE_END,
      ''
    ].join('\n');

    const output = syncReadmeQuickReferenceSection(input);
    expect(output).toContain(README_QUICK_REFERENCE_START);
    expect(output).toContain(README_QUICK_REFERENCE_END);
    expect(output).toContain('### Agent Contract');
    expect(output).toContain('@@LICELL_JSON@@');
    expect(output).toContain('CLI Event Record');
    expect(output).toContain('CLI Error Record');
    expect(output).toContain('licell-cli-record');
    expect(output).toContain('licell-help@1.0');
    expect(output).toContain('`nextActions[]`');
    expect(output).toContain('### 命令总览');
    expect(output).not.toContain('old content');
    expect(output).toContain('upgrade guidance');
  });
});

describe('syncReadmeGeneratedSections', () => {
  it('keeps README generated blocks in sync with renderers', () => {
    const readme = readFileSync('README.md', 'utf8');
    const synced = syncReadmeGeneratedSections(readme);
    expect(synced).toBe(readme);
    expect(readme).toContain(renderReadmeUpgradeGuidance().trim());
    expect(readme).toContain(renderReadmeQuickReference().trim());
    expect(readme).toContain('### Agent Contract');
    expect(readme).toContain('CLI Event Record');
  });
});
