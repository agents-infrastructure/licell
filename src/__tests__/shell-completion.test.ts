import { describe, expect, it } from 'vitest';
import {
  detectShellFromEnv,
  normalizeCompletionShell,
  renderCompletionScript,
  resolveCompletionCandidates
} from '../utils/shell-completion';

describe('resolveCompletionCandidates', () => {
  it('suggests top-level commands from partial token', () => {
    const candidates = resolveCompletionCandidates({
      compWords: 'licell d',
      compCword: 1,
      compCur: 'd'
    });

    expect(candidates).toContain('deploy');
    expect(candidates).toContain('db');
    expect(candidates).toContain('dns');
    expect(candidates).toContain('domain');
  });

  it('suggests nested dns records subcommands', () => {
    const candidates = resolveCompletionCandidates({
      compWords: 'licell dns records',
      compCword: 3,
      compCur: ''
    });

    expect(candidates).toContain('list');
    expect(candidates).toContain('add');
    expect(candidates).toContain('rm');
  });

  it('suggests deploy options when completing option token', () => {
    const candidates = resolveCompletionCandidates({
      compWords: 'licell deploy --',
      compCword: 2,
      compCur: '--'
    });

    expect(candidates).toContain('--runtime');
    expect(candidates).toContain('--type');
    expect(candidates).toContain('--target');
    expect(candidates).not.toContain('auth');
  });
});

describe('shell helpers', () => {
  it('normalizes valid shell values', () => {
    expect(normalizeCompletionShell('bash')).toBe('bash');
    expect(normalizeCompletionShell(' zsh ')).toBe('zsh');
  });

  it('rejects unsupported shell values', () => {
    expect(() => normalizeCompletionShell('fish')).toThrow('shell 仅支持 bash 或 zsh');
  });

  it('detects shell from SHELL env value', () => {
    expect(detectShellFromEnv('/bin/zsh')).toBe('zsh');
    expect(detectShellFromEnv('/usr/bin/bash')).toBe('bash');
    expect(detectShellFromEnv('/usr/bin/fish')).toBeUndefined();
  });
});

describe('renderCompletionScript', () => {
  it('renders bash completion script', () => {
    const script = renderCompletionScript('bash');
    expect(script).toContain('complete -F _licell_completion licell');
    expect(script).toContain('licell completion --engine');
  });

  it('renders zsh completion script', () => {
    const script = renderCompletionScript('zsh');
    expect(script).toContain('compdef _licell_completion licell');
    expect(script).toContain('licell completion --engine');
  });
});
