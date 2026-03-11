import type { CAC } from 'cac';
import { defineCommandModule, defineCliCommand, registerCliCommand } from './module';
import pc from 'picocolors';
import { Config } from '../utils/config';
import { showIntro, showOutro, toOptionalString } from '../utils/cli-shared';
import { normalizeDomainSuffix } from '../utils/cli-shared';
import { emitCliResult, isJsonOutput } from '../utils/output';
import { SETUP_SECTION } from './sections';

const configDomainCommand = defineCliCommand({
  rawName: 'config domain [suffix]',
  description: '查看或设置全局默认域名后缀',
  options: [
    { rawName: '--unset', description: '清除已设置的全局域名后缀' }
  ],
  descriptor: {
    notes: ['设置后，未显式指定域名后缀的 deploy / domain 流程会优先复用该值。'],
    examples: ['licell config domain', 'licell config domain example.com', 'licell config domain --unset --output json'],
    argumentHints: {
      suffix: '域名后缀，例如 `example.com`。'
    },
    automation: {
      preferredOutput: 'json',
      explicitInputs: ['[suffix]', '--unset'],
      notes: ['自动化里建议显式区分读取、设置与清除三种用法，并统一追加 `--output json`。']
    },
    optionInsights: {
      '--unset': {
        whenToUse: '需要清除全局默认域名后缀，让后续流程重新显式传入或重新推导时使用。',
        cautions: ['会影响后续未显式指定域名后缀的 deploy / domain 命令行为。']
      }
    },
    recommendedFlow: [
      { title: '查看当前值', command: 'licell config domain --output json', reason: '先确认当前是否已有默认域名后缀。' },
      { title: '设置默认值', command: 'licell config domain <suffix> --output json', reason: '让后续域名相关流程共享同一默认后缀。' },
      { title: '必要时清除', command: 'licell config domain --unset --output json', reason: '当默认值不再适用时回退到显式传参。' }
    ],
    result: {
      summary: '返回当前或更新后的全局域名后缀。',
      outcomeKey: 'domainSuffix',
      fields: [
        { name: 'stage', description: '固定为 `config.domain`。', required: true },
        { name: 'domainSuffix', description: '当前全局域名后缀；未设置时为 `null`。', required: true },
        { name: 'action', description: '执行了 `set` / `unset` 时返回。' }
      ]
    }
  }
});

export function registerConfigCommands(cli: CAC) {
  registerCliCommand(cli, configDomainCommand)
    .action((suffix: string | undefined, options: { unset?: boolean }) => {
      const globalConfig = Config.getGlobalConfig();

      if (options.unset) {
        Config.setGlobalConfig({ domainSuffix: undefined });
        if (isJsonOutput()) {
          emitCliResult({ stage: 'config.domain', domainSuffix: null, action: 'unset' });
        } else {
          showIntro(pc.bgMagenta(pc.white(' ⚙ Config ')));
          showOutro(pc.green('已清除全局域名后缀'));
        }
        return;
      }

      const value = toOptionalString(suffix);
      if (!value) {
        const current = globalConfig.domainSuffix || null;
        if (isJsonOutput()) {
          emitCliResult({ stage: 'config.domain', domainSuffix: current });
        } else {
          if (current) {
            console.log(`全局域名后缀: ${pc.cyan(current)}`);
          } else {
            console.log(pc.gray('未设置全局域名后缀。用法: licell config domain <suffix>'));
          }
        }
        return;
      }

      const normalized = normalizeDomainSuffix(value);
      Config.setGlobalConfig({ domainSuffix: normalized });
      if (isJsonOutput()) {
        emitCliResult({ stage: 'config.domain', domainSuffix: normalized, action: 'set' });
      } else {
        showIntro(pc.bgMagenta(pc.white(' ⚙ Config ')));
        console.log(`全局域名后缀已设置为: ${pc.cyan(normalized)}`);
        showOutro('后续 deploy/domain 命令将自动使用此域名后缀');
      }
    });
}

export const configCommandModule = defineCommandModule({
  section: SETUP_SECTION,
  register: registerConfigCommands,
  namespaces: {
    config: {
      summary: '全局默认配置管理。',
      examples: ['licell config domain', 'licell config domain example.com']
    }
  },
  commands: [configDomainCommand]
});
