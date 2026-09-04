export const README_UPGRADE_GUIDANCE_START = '<!-- BEGIN GENERATED:README_UPGRADE_GUIDANCE -->';
export const README_UPGRADE_GUIDANCE_END = '<!-- END GENERATED:README_UPGRADE_GUIDANCE -->';

interface GuidanceItem {
  id: string;
  zh: string;
  en: string;
}

const UPGRADE_GUIDANCE_ITEMS: GuidanceItem[] = [
  {
    id: 'auto-source',
    zh: '`licell upgrade` 会优先按“当前正在执行的安装来源”升级',
    en: '`licell upgrade` follows the current installation source by default.'
  },
  {
    id: 'single-source',
    zh: '不要同时保留多个全局安装来源；PATH 中排在最前的 `licell` 会遮蔽其它已升级版本，可用 `licell upgrade --dry-run --output json` 查看冲突入口',
    en: 'Do not keep multiple global installation sources; the first `licell` on PATH shadows other upgraded copies, and `licell upgrade --dry-run --output json` reports conflicts.'
  },
  {
    id: 'package-manager',
    zh: '如果当前是 `npm` / `pnpm` / `yarn` / `bun` 全局安装，会调用对应包管理器执行全局升级',
    en: 'If licell was installed globally via `npm` / `pnpm` / `yarn` / `bun`, `licell upgrade` will reuse that package manager automatically.'
  },
  {
    id: 'project-local-guard',
    zh: '如果当前是项目内依赖、`node_modules/.bin/licell` 或开发链接，默认不会自动做全局升级',
    en: 'If licell is running from project-local `node_modules` or a dev-linked checkout, default `licell upgrade` refuses global self-upgrade.'
  },
  {
    id: 'release-artifacts',
    zh: '安装脚本和二进制都来自同一个 `releases/latest`，优先下载预构建单文件可执行；若当前平台暂无预构建资产，自动回退源码安装',
    en: 'The release installer prefers prebuilt standalone artifacts from `releases/latest`, and falls back to source install when no prebuilt asset exists for the current platform.'
  },
  {
    id: 'force-release',
    zh: '如显式传入 `--repo` 或 `--script-url`，则强制走 GitHub release 升级渠道',
    en: 'Passing `--repo` or `--script-url` forces the GitHub release upgrade path.'
  },
  {
    id: 'channel-override',
    zh: '可通过 `--channel auto|release|npm|pnpm|yarn|bun` 显式覆盖升级渠道；推荐先用 `licell upgrade --dry-run` 预览计划',
    en: 'Use `--channel auto|release|npm|pnpm|yarn|bun` to override the upgrade channel explicitly; prefer `licell upgrade --dry-run` first to inspect the plan.'
  }
];

export function renderReadmeUpgradeGuidance() {
  return `${UPGRADE_GUIDANCE_ITEMS.map((item) => `- ${item.zh}`).join('\n').trim()}\n`;
}

export function renderSkillUpgradeNotes() {
  return `${UPGRADE_GUIDANCE_ITEMS.map((item) => `- ${item.en}`).join('\n').trim()}\n`;
}

export function getBuiltinUpgradeSafetyHint() {
  return 'For self-upgrade, prefer `licell upgrade --dry-run` first; project-local installs require explicit `--channel`.';
}
