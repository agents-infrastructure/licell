import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import {
  README_MCP_FC_API_WORKFLOW_END,
  README_MCP_FC_API_WORKFLOW_START,
  README_QUICK_REFERENCE_END,
  README_QUICK_REFERENCE_START,
  renderReadmeMcpFcApiWorkflow,
  renderReadmeQuickReference,
  syncReadmeGeneratedSections,
  syncReadmeMcpFcApiWorkflowSection,
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
      '',
      README_MCP_FC_API_WORKFLOW_START,
      'workflow content',
      README_MCP_FC_API_WORKFLOW_END,
      ''
    ].join('\n');

    const output = syncReadmeQuickReferenceSection(input);
    expect(output).toContain(README_QUICK_REFERENCE_START);
    expect(output).toContain(README_QUICK_REFERENCE_END);
    expect(output).toContain('### 命令总览');
    expect(output).not.toContain('old content');
    expect(output).toContain('workflow content');
    expect(output).toContain('upgrade guidance');
  });
});

describe('syncReadmeMcpFcApiWorkflowSection', () => {
  it('replaces content between README MCP workflow markers', () => {
    const input = [
      '# Title',
      '',
      README_UPGRADE_GUIDANCE_START,
      'upgrade guidance',
      README_UPGRADE_GUIDANCE_END,
      '',
      README_QUICK_REFERENCE_START,
      'quick ref content',
      README_QUICK_REFERENCE_END,
      '',
      README_MCP_FC_API_WORKFLOW_START,
      'old workflow content',
      README_MCP_FC_API_WORKFLOW_END,
      ''
    ].join('\n');

    const output = syncReadmeMcpFcApiWorkflowSection(input);
    expect(output).toContain(README_MCP_FC_API_WORKFLOW_START);
    expect(output).toContain(README_MCP_FC_API_WORKFLOW_END);
    expect(output).toContain('`licell_fc_deploy_spec`');
    expect(output).toContain('`licell_deploy`');
    expect(output).not.toContain('old workflow content');
    expect(output).toContain('quick ref content');
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
    expect(readme).toContain(renderReadmeMcpFcApiWorkflow().trim());
  });
});
