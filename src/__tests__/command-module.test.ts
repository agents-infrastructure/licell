import { cac } from 'cac';
import { describe, expect, it, vi } from 'vitest';
import {
  buildCommandDescriptors,
  commandInvocation,
  defineCliCommand,
  defineCommandBundle,
  defineCommandModule,
  registerCliCommand
} from '../commands/module';
import { getInvocationRegionId } from '../utils/region-context';
import { Config, normalizeProject } from '../utils/config';

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

  it('derives the shared regional option and result contract', () => {
    const command = defineCliCommand({
      rawName: 'probe region',
      description: '探测地域',
      region: { scope: 'auth' }
    });

    expect(command.options?.map((option) => option.rawName)).toContain('--region <regionId>');
    expect(command.descriptor?.optionInsights?.['--region']?.whenToUse).toContain('本次命令');
    expect(command.descriptor?.result?.fields).toContainEqual({
      name: 'callRegionId',
      description: '本次命令实际使用的阿里云地域 ID。',
      required: false
    });
  });

  it('describes binding and project region defaults on generated options', () => {
    const binding = defineCliCommand({
      rawName: 'probe binding',
      description: '探测资源绑定地域',
      region: { scope: 'binding', binding: 'database' }
    });
    const project = defineCliCommand({
      rawName: 'probe project',
      description: '探测项目地域',
      region: { scope: 'project' }
    });

    expect(binding.options.find((option) => option.rawName.includes('--region'))?.description)
      .toContain('项目资源绑定地域');
    expect(project.options.find((option) => option.rawName.includes('--region'))?.description)
      .toContain('项目默认地域');
  });

  it('preserves an existing regional option alias', () => {
    const command = defineCliCommand({
      rawName: 'probe logs',
      description: '探测日志地域',
      options: [{ rawName: '-r, --region <region>', description: '查询地域' }],
      region: { scope: 'auth' }
    });

    expect(command.options).toEqual([
      { rawName: '-r, --region <region>', description: '查询地域' }
    ]);
  });

  it('establishes region context around a real CAC action dispatch', async () => {
    const cli = cac('licell');
    const command = defineCliCommand({
      rawName: 'probe region',
      description: '探测地域',
      region: { scope: 'auth' }
    });
    let observedRegion: string | undefined;

    let complete!: () => void;
    const completed = new Promise<void>((resolve) => { complete = resolve; });
    registerCliCommand(cli, command).action(async () => {
      await Promise.resolve();
      observedRegion = getInvocationRegionId();
      complete();
    });

    cli.parse(['node', 'src/cli.ts', 'probe region', '--region', 'cn-shanghai']);
    await completed;

    expect(observedRegion).toBe('cn-shanghai');
  });

  it('does not read project config for auth-scoped commands', async () => {
    const getProjectSpy = vi.spyOn(Config, 'getProject');
    const getDefaultRegionSpy = vi.spyOn(Config, 'getDefaultRegion').mockReturnValue('cn-hangzhou');
    try {
      const cli = cac('licell');
      const command = defineCliCommand({
        rawName: 'probe auth',
        description: '探测 auth 地域',
        region: { scope: 'auth' }
      });
      let observedRegion: string | undefined;
      registerCliCommand(cli, command).action(() => {
        observedRegion = getInvocationRegionId();
      });

      await cli.parse(['node', 'src/cli.ts', 'probe auth']);

      expect(observedRegion).toBe('cn-hangzhou');
      expect(getProjectSpy).not.toHaveBeenCalled();
      expect(getDefaultRegionSpy).toHaveBeenCalledTimes(1);
    } finally {
      getProjectSpy.mockRestore();
      getDefaultRegionSpy.mockRestore();
    }
  });

  it('resolves project and binding scopes during real dispatch', async () => {
    const project = normalizeProject({
      region: 'cn-shanghai',
      envs: {},
      database: {
        instanceId: 'pgm-project',
        region: 'cn-beijing'
      },
      cache: {
        type: 'redis',
        instanceId: 'r-project',
        region: 'cn-chengdu'
      }
    });
    const getProjectSpy = vi.spyOn(Config, 'getProject').mockReturnValue(project);
    const getDefaultRegionSpy = vi.spyOn(Config, 'getDefaultRegion').mockReturnValue('cn-hangzhou');

    try {
      const projectCli = cac('licell');
      const projectCommand = defineCliCommand({
        rawName: 'probe project',
        description: '探测项目地域',
        region: { scope: 'project' }
      });
      let projectRegion: string | undefined;
      registerCliCommand(projectCli, projectCommand).action(() => {
        projectRegion = getInvocationRegionId();
      });
      await projectCli.parse(['node', 'src/cli.ts', 'probe project']);

      const bindingCli = cac('licell');
      const bindingCommand = defineCliCommand({
        rawName: 'probe binding [instanceId]',
        description: '探测绑定地域',
        region: {
          scope: 'binding',
          binding: 'database',
          target: { argumentIndex: 0 }
        }
      });
      const bindingRegions: Array<string | undefined> = [];
      registerCliCommand(bindingCli, bindingCommand).action(() => {
        bindingRegions.push(getInvocationRegionId());
      });
      await bindingCli.parse(['node', 'src/cli.ts', 'probe binding']);
      await bindingCli.parse(['node', 'src/cli.ts', 'probe binding', 'pgm-project']);
      await bindingCli.parse(['node', 'src/cli.ts', 'probe binding', 'pgm-other']);

      const overrideCli = cac('licell');
      let overrideRegion: string | undefined;
      registerCliCommand(overrideCli, bindingCommand).action(() => {
        overrideRegion = getInvocationRegionId();
      });
      await overrideCli.parse(['node', 'src/cli.ts', 'probe binding', 'pgm-project', '--region', 'cn-wulanchabu']);

      const optionCli = cac('licell');
      const optionCommand = defineCliCommand({
        rawName: 'probe option',
        description: '探测 option binding 地域',
        options: [{ rawName: '--instance <instanceId>', description: '实例 ID' }],
        region: {
          scope: 'binding',
          binding: 'cache',
          target: { option: 'instance' }
        }
      });
      const optionRegions: Array<string | undefined> = [];
      registerCliCommand(optionCli, optionCommand).action(() => {
        optionRegions.push(getInvocationRegionId());
      });
      await optionCli.parse(['node', 'src/cli.ts', 'probe option']);
      await optionCli.parse(['node', 'src/cli.ts', 'probe option', '--instance', 'r-other']);

      expect(projectRegion).toBe('cn-shanghai');
      expect(bindingRegions).toEqual(['cn-beijing', 'cn-beijing', 'cn-hangzhou']);
      expect(overrideRegion).toBe('cn-wulanchabu');
      expect(optionRegions).toEqual(['cn-chengdu', 'cn-hangzhou']);
    } finally {
      getProjectSpy.mockRestore();
      getDefaultRegionSpy.mockRestore();
    }
  });

  it('compares user-defined Supabase binding names case-sensitively', async () => {
    const getProjectSpy = vi.spyOn(Config, 'getProject').mockReturnValue(normalizeProject({
      envs: {},
      supabase: { instanceName: 'Demo-Supa', region: 'cn-shanghai' }
    }));
    const getDefaultRegionSpy = vi.spyOn(Config, 'getDefaultRegion').mockReturnValue('cn-hangzhou');
    try {
      const cli = cac('licell');
      const command = defineCliCommand({
        rawName: 'probe supabase <instanceName>',
        description: '探测 Supabase binding 地域',
        region: {
          scope: 'binding',
          binding: 'supabase',
          target: { argumentIndex: 0 }
        }
      });
      let observedRegion: string | undefined;
      registerCliCommand(cli, command).action(() => {
        observedRegion = getInvocationRegionId();
      });

      await cli.parse(['node', 'src/cli.ts', 'probe supabase', 'demo-supa']);

      expect(observedRegion).toBe('cn-hangzhou');
    } finally {
      getProjectSpy.mockRestore();
      getDefaultRegionSpy.mockRestore();
    }
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
