import { describe, expect, it } from 'vitest';
import { buildCommandDescriptors, commandInvocation, defineCliCommand, defineCommandBundle, defineCommandModule } from '../commands/module';

describe('command module DSL', () => {
  it('derives invocation and descriptor key from raw command syntax', () => {
    const command = defineCliCommand({
      rawName: 'dns records add <domain>',
      description: '添加域名解析记录'
    });

    expect(commandInvocation(command)).toBe('licell dns records add');

    const descriptors = buildCommandDescriptors({
      commands: [command]
    });

    expect(descriptors['dns records add']?.summary).toBe('添加域名解析记录');
  });



  it('registers declared options through the DSL', () => {
    const command = defineCliCommand({
      rawName: 'upgrade',
      description: '按当前安装来源升级 licell',
      options: [
        { rawName: '--dry-run', description: '只输出将执行的升级计划' }
      ]
    });

    const descriptors = buildCommandDescriptors({ commands: [command] });
    expect(descriptors.upgrade?.summary).toBe('按当前安装来源升级 licell');
    expect(command.options?.[0]?.rawName).toBe('--dry-run');
  });

  it('merges child bundles into parent modules', () => {
    const childBundle = defineCommandBundle({
      register: () => {},
      commands: [
        defineCliCommand({ rawName: 'fn domain list', description: '列出函数域名' })
      ]
    });

    const module = defineCommandModule({
      section: { id: 'delivery', title: 'Delivery Workflow' },
      register: () => {},
      commands: [
        defineCliCommand({ rawName: 'fn list', description: '列出函数' })
      ],
      namespaces: {
        fn: { summary: '函数管理' }
      },
      mergeBundles: [childBundle]
    });

    expect(module.roots).toEqual(['fn']);
    expect(module.descriptors.fn?.summary).toBe('函数管理');
    expect(module.descriptors['fn list']?.summary).toBe('列出函数');
    expect(module.descriptors['fn domain list']?.summary).toBe('列出函数域名');
  });

  it('defines self-described command modules with inferred roots', () => {
    const command = defineCliCommand({
      rawName: 'auth repair',
      description: '修复授权'
    });

    const module = defineCommandModule({
      section: { id: 'setup', title: 'Setup & Identity' },
      register: () => {},
      commands: [
        defineCliCommand({ rawName: 'login', description: '登录' }),
        command
      ],
      namespaces: {
        auth: { summary: '授权管理' }
      }
    });

    expect(module.roots).toEqual(['login', 'auth']);
    expect(module.descriptors.login?.summary).toBe('登录');
    expect(module.descriptors['auth repair']?.summary).toBe('修复授权');
    expect(module.descriptors.auth?.summary).toBe('授权管理');
  });

  it('keeps explicit descriptor summary over CLI description', () => {
    const command = defineCliCommand({
      rawName: 'fn domain unbind <domain>',
      description: '解绑 FC 自定义域名',
      descriptor: {
        summary: '解绑 FC 自定义域名，可选同步清理 DNS。'
      }
    });

    const descriptors = buildCommandDescriptors({ commands: [command] });
    expect(descriptors['fn domain unbind']?.summary).toBe('解绑 FC 自定义域名，可选同步清理 DNS。');
  });
});
