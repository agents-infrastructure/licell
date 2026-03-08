import { describe, expect, it } from 'vitest';
import {
  buildLicellMcpToolAnnotations,
  resolveLicellMcpToolSummary,
  resolveLicellMcpToolTitle,
  type LicellMcpToolMetadataEnvelope
} from '../mcp/tool-metadata';

describe('mcp tool metadata helpers', () => {
  it('falls back to shared agent command title/summary by command signature', () => {
    const metadata: LicellMcpToolMetadataEnvelope = {
      licell: {
        source: 'licell-mcp-tool-registry',
        toolKind: 'generated',
        preferredOutput: 'json',
        supportsStructuredOutput: true,
        openWorld: false,
        command: {
          signature: 'deploy check',
          rootCommand: 'deploy'
        },
        tags: [],
        workflows: [],
        tasks: [],
        decisionGuide: []
      }
    };

    expect(resolveLicellMcpToolTitle(metadata)).toBe('Precheck FC API deploy readiness');
    expect(resolveLicellMcpToolSummary(metadata)).toContain('预检');
  });

  it('derives annotations from metadata safety/openWorld', () => {
    const metadata: LicellMcpToolMetadataEnvelope = {
      licell: {
        source: 'licell-mcp-tool-registry',
        toolKind: 'builtin',
        preferredOutput: 'json',
        supportsStructuredOutput: true,
        openWorld: true,
        safety: {
          level: 'destructive',
          reason: 'dangerous',
          confirmFlags: ['--yes']
        },
        tags: [],
        workflows: [],
        tasks: [],
        decisionGuide: []
      }
    };

    expect(buildLicellMcpToolAnnotations({ metadata })).toEqual({
      destructiveHint: true,
      openWorldHint: true
    });
  });
});
