import type { CAC } from 'cac';
import pc from 'picocolors';
import { Config } from '../utils/config';
import { showIntro, showOutro, toOptionalString } from '../utils/cli-shared';
import { normalizeDomainSuffix } from '../utils/cli-shared';
import { emitCliResult, isJsonOutput } from '../utils/output';

export function registerConfigCommands(cli: CAC) {
  cli.command('config domain [suffix]', '查看或设置全局默认域名后缀')
    .option('--unset', '清除已设置的全局域名后缀')
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
