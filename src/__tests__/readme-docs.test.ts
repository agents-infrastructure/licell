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
    expect(output).toContain('`capability products/search/describe --output json`');
    expect(output).toContain('`execution.preferred`');
    expect(output).toContain('raw 写操作必须先 `--dry-run`');
    expect(output).toContain('### 命令总览');
    expect(output).toContain('**Task 函数工作流**');
    expect(output).toContain('#### Cloud Infrastructure');
    expect(output).toContain('licell ecs list');
    expect(output).toContain('licell ecs info <instanceId>');
    expect(output).toContain('licell ecs start <instanceId>');
    expect(output).toContain('licell ecs stop <instanceId>');
    expect(output).toContain('licell ecs delete <instanceId>');
    expect(output).toContain('licell ecs rm <instanceId>');
    expect(output.indexOf('#### Data Services')).toBeLessThan(output.indexOf('#### Cloud Infrastructure'));
    expect(output.indexOf('#### Cloud Infrastructure')).toBeLessThan(output.indexOf('#### Automation & Tooling'));
    expect(output).not.toMatch(/licell ecs (run|create)|runInstances/);
    expect(output).toContain('licell deploy --type task --runtime nodejs22 --entry src/task.ts --target preview --output json');
    expect(output).toMatch(/\| `licell db add` \|[^\n]+\| `--region`,/);
    expect(output).toMatch(/\| `licell cache add` \|[^\n]+\| `--region`,/);
    expect(output).toMatch(/\| `licell supa add` \|[^\n]+\| `--region`,/);
    expect(output).toMatch(/\| `licell login` \|[^\n]+\| `--account-id`, `--ak`, `--sk` \|/);
    expect(output).toMatch(/\| `licell auth repair` \|[^\n]+\| `--account-id`, `--ak`, `--sk` \|/);
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
    expect(readme).toContain('**Task 函数工作流**');
    expect(readme).toContain('ECS 实例查询、详情诊断与生命周期操作（启动 / 重启 / 停止 / 删除）');
    expect(readme).toContain('#### Cloud Infrastructure');
    expect(readme).toContain('licell ecs list');
    expect(readme).toContain('licell ecs info <instanceId>');
    expect(readme).toContain('licell ecs start <instanceId>');
    expect(readme).toContain('licell ecs stop <instanceId>');
    expect(readme).toContain('licell ecs delete <instanceId>');
    expect(readme).toContain('licell ecs rm <instanceId>');
    expect(readme).not.toMatch(/licell ecs (run|create)|runInstances/);
  });
});
