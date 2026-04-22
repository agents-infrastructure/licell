import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import {
  renderAgentSurfaceReferenceDoc,
  renderSkillAgentUsageGuide
} from '../utils/agent-surface-docs';

describe('renderSkillAgentUsageGuide', () => {
  it('renders CLI-driven agent usage guidance', () => {
    const output = renderSkillAgentUsageGuide();
    expect(output).toContain('## Agent Usage');
    expect(output).toContain('### Schema Contracts');
    expect(output).toContain('@@LICELL_JSON@@');
    expect(output).toContain('CLI Event Record');
    expect(output).toContain('CLI Error Record');
    expect(output).toContain('licell-cli-record@1.0');
    expect(output).toContain('licell-help@1.0');
    expect(output).toContain('licell-agent-command-catalog@1.0');
    expect(output).toContain('`licell catalog --output json`');
    expect(output).toContain('`licell <command> --help --output json`');
    expect(output).toContain('`nextActions[]`');
    expect(output).toContain('\n- `kind`: Fixed to `licell-cli-record`.');
    expect(output).not.toContain('\n  - `kind`: Fixed to `licell-cli-record`.');
    expect(output).not.toContain('命令发现');
  });
});

describe('renderAgentSurfaceReferenceDoc', () => {
  it('renders CLI-centric agent reference sections', () => {
    const output = renderAgentSurfaceReferenceDoc();
    expect(output).toContain('# Agent Surface Reference');
    expect(output).toContain('## Schema Contracts');
    expect(output).toContain('@@LICELL_JSON@@');
    expect(output).toContain('CLI Event Record');
    expect(output).toContain('CLI Error Record');
    expect(output).toContain('先匹配 `kind`，再检查 `schemaVersion`');
    expect(output).toContain('`nextActions[]`');
    expect(output).toContain('## CLI 命令目录');
    expect(output).toContain('## Recommended Agent Flow');
    expect(output).toContain('`licell deploy check`');
    expect(output).not.toContain('Tool Reference');
    expect(output).toContain('\n- `kind`：固定为 `licell-cli-record`。');
    expect(output).not.toContain('\n  - `kind`：固定为 `licell-cli-record`。');
  });

  it('keeps generated docs file in sync with renderer', () => {
    const current = readFileSync('docs/reference/agent-surfaces.md', 'utf8');
    expect(current).toBe(renderAgentSurfaceReferenceDoc());
  });
});
