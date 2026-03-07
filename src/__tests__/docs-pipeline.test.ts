import { describe, expect, it } from 'vitest';
import { checkAllGeneratedDocs, getGeneratedDocTargets } from '../utils/docs-pipeline';

describe('getGeneratedDocTargets', () => {
  it('registers all generated doc targets in one place', () => {
    const targets = getGeneratedDocTargets();
    expect(targets.map((target) => target.id)).toEqual([
      'readme',
      'agent-surfaces',
      'scenario-ai-driven-deployment'
    ]);
  });
});

describe('checkAllGeneratedDocs', () => {
  it('reports generated docs are in sync', () => {
    const results = checkAllGeneratedDocs();
    expect(results.every((result) => result.updated === false)).toBe(true);
  });
});
