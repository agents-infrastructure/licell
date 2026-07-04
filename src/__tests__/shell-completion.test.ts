import { describe, expect, it } from 'vitest';
import {
  detectShellFromEnv,
  normalizeCompletionShell,
  renderCompletionScript,
  resolveCompletionCandidates
} from '../utils/shell-completion';

const ECS_LIFECYCLE_COMPLETIONS = ['stop', 'delete', 'rm', 'run', 'create'];

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

  it('suggests ecs root command and inspect + start/reboot subcommands', () => {
    const rootCandidates = resolveCompletionCandidates({
      compWords: 'licell e',
      compCword: 1,
      compCur: 'e'
    });
    expect(rootCandidates).toContain('ecs');

    const ecsCandidates = resolveCompletionCandidates({
      compWords: 'licell ecs ',
      compCword: 2,
      compCur: ''
    });
    expect(ecsCandidates).toEqual(expect.arrayContaining(['list', 'info', 'start', 'reboot']));
    for (const lifecycleCommand of ECS_LIFECYCLE_COMPLETIONS) {
      expect(ecsCandidates).not.toContain(lifecycleCommand);
    }
  });

  it('suggests global --output option from root', () => {
    const candidates = resolveCompletionCandidates({
      compWords: 'licell --',
      compCword: 1,
      compCur: '--'
    });

    expect(candidates).toContain('--output');
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

  it('suggests upgrade channel option', () => {
    const candidates = resolveCompletionCandidates({
      compWords: 'licell upgrade --',
      compCword: 2,
      compCur: '--'
    });

    expect(candidates).toContain('--channel');
    expect(candidates).toContain('--target-version');
  });

  it('suggests deploy subcommands for agent precheck flow', () => {
    const candidates = resolveCompletionCandidates({
      compWords: 'licell deploy ',
      compCword: 2,
      compCur: ''
    });

    expect(candidates).toContain('spec');
    expect(candidates).toContain('check');
  });


  it('suggests catalog options from command graph', () => {
    const candidates = resolveCompletionCandidates({
      compWords: 'licell catalog --',
      compCword: 2,
      compCur: '--'
    });

    expect(candidates).toContain('--root-command');
    expect(candidates).toContain('--command-key');
  });

  it('suggests ecs list and info options from command graph', () => {
    const listCandidates = resolveCompletionCandidates({
      compWords: 'licell ecs list --',
      compCword: 3,
      compCur: '--'
    });

    expect(listCandidates).toEqual(expect.arrayContaining([
      '--region',
      '--limit',
      '--tag',
      '--name-prefix',
      '--private-ip',
      '--public-ip',
      '--eip'
    ]));

    const infoCandidates = resolveCompletionCandidates({
      compWords: 'licell ecs info --',
      compCword: 3,
      compCur: '--'
    });
    expect(infoCandidates).toContain('--region');
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
