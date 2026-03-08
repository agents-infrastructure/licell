import type { CAC } from 'cac';
import { defineCommandModule } from './module';
import { domainAppCommandBundle } from './domain-app';
import { domainStaticCommandBundle } from './domain-static';
import { DELIVERY_SECTION } from './sections';

export function registerDomainCommands(cli: CAC) {
  domainAppCommandBundle.register(cli);
  domainStaticCommandBundle.register(cli);
}

export const domainCommandModule = defineCommandModule({
  section: DELIVERY_SECTION,
  register: registerDomainCommands,
  namespaces: {
    domain: {
      summary: '跨资源域名 workflow 入口：按 app / static 场景编排 DNS、网关、CDN 与 HTTPS。',
      notes: [
        '顶层 `domain` 负责 workflow；资源级原子操作请用 `fn domain`、`oss domain`、`dns records`。',
        '`deploy --domain ...` / `--domain-suffix ...`（API）与 `deploy --type static --domain ...`（Static）都会复用各自的 domain workflow，而不是在 deploy 内单独维护一套编排。'
      ],
      examples: [
        'licell domain app bind api.example.com --target prod --ssl',
        'licell domain static bind static.example.com --ssl'
      ],
      related: ['domain app', 'domain static', 'fn domain', 'oss domain', 'dns records'],
      taskHints: [
        {
          phase: 'mutate',
          title: '给 API / 应用绑定域名并启用 HTTPS',
          description: '选择 app workflow，让 DNS、函数域名、alias 与证书一起编排。',
          commands: ['licell domain app bind api.example.com --target prod --ssl']
        },
        {
          phase: 'mutate',
          title: '给静态站点绑定域名',
          description: '选择 static workflow，让 CDN、DNS 与 HTTPS 按静态站点方式编排。',
          commands: ['licell domain static bind static.example.com --ssl']
        }
      ]
    }
  },
  mergeBundles: [domainAppCommandBundle, domainStaticCommandBundle]
});
