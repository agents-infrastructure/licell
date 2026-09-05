import type { CAC } from 'cac';
import pc from 'picocolors';
import { listRamUsers } from '../providers/ram-query';
import { executeWithAuthRecovery } from '../utils/auth-recovery';
import { ensureAuthOrExit, isInteractiveTTY, parseListLimit } from '../utils/cli-shared';
import { emitCommandResult, isJsonOutput } from '../utils/output';
import { commandInvocation, defineCliCommand, defineCommandModule, registerCliCommand } from './module';
import { INFRA_SECTION } from './sections';

const ramUsersCommand = defineCliCommand({
  rawName: 'ram users',
  description: '列出 RAM 用户（只读）',
  regionExclusion: 'region-agnostic',
  options: [
    { rawName: '--limit <n>', description: '返回数量，默认 50，最大 200' }
  ],
  descriptor: {
    title: 'List RAM users',
    summary: '通过 RAM ListUsers 只读 API 列出当前账号的 RAM 用户摘要。',
    examples: [
      'licell ram users --output json',
      'licell ram users --limit 20 --output json'
    ],
    related: ['whoami', 'auth repair', 'capability search'],
    agentTips: [
      '这是 RAM 全局资源查询，不受当前 region 影响。',
      '结果只包含用户摘要，不返回邮箱、手机号、AccessKey 或策略正文。',
      '如果没有 RAM 只读权限，先读取错误的 nextActions，再决定是否执行 auth repair。'
    ],
    automation: {
      preferredOutput: 'json',
      explicitInputs: ['--limit']
    },
    safety: {
      level: 'safe',
      reason: '只调用 RAM ListUsers 读取用户摘要，不修改账号资源。',
      confirmFlags: []
    },
    recommendedFlow: [
      { title: '列出 RAM 用户', command: 'licell ram users --output json', reason: '确认账号内的 RAM 用户和名称。' },
      { title: '查询未封装 RAM 能力', command: 'licell capability search --product ram --intent "查看 RAM 角色" --action inspect --output json', reason: '进入 protocol capability 空间查找角色、策略等 raw API。' },
      { title: '读取完整 capability 定义', command: 'licell capability describe <ref> --output json', reason: '查看参数 schema 和执行策略。' }
    ],
    result: {
      summary: '返回 RAM 用户摘要、数量、截断状态和云端 requestId。',
      outcomeKey: 'users',
      fields: [
        { name: 'stage', description: '固定为 `ram.users`。', required: true },
        { name: 'count', description: '本次返回的用户数量。', required: true },
        { name: 'limit', description: '本次查询使用的返回数量上限。', required: true },
        { name: 'truncated', description: '结果是否因 limit 截断。', required: true },
        { name: 'requestId', description: 'RAM API requestId。' },
        { name: 'users[]', description: '用户 ID、名称、显示名、备注和时间摘要；不含凭证与联系方式。', required: true }
      ]
    }
  }
});

export function registerRamCommands(cli: CAC) {
  registerCliCommand(cli, ramUsersCommand).action(async (options: { limit?: unknown }) => {
    const result = await executeWithAuthRecovery(
      { commandLabel: commandInvocation(ramUsersCommand), interactiveTTY: isInteractiveTTY() },
      async () => {
        await ensureAuthOrExit();
        const value = await listRamUsers({ limit: parseListLimit(options.limit, 50, 200) });
        if (isJsonOutput()) emitCommandResult(value);
        return value;
      }
    );
    if (!isJsonOutput()) {
      console.log(pc.bold(`RAM users (${result.count})`));
      for (const user of result.users) {
        console.log(`- ${pc.cyan(user.userName || user.userId)}  ${user.displayName || '-'}`);
      }
    }
  });
}

export const ramCommandModule = defineCommandModule({
  section: INFRA_SECTION,
  register: registerRamCommands,
  namespaces: {
    ram: {
      title: 'RAM identity',
      summary: '只读查询账号内的 RAM 用户，并通过 capability fallback 探索角色、策略等能力。',
      examples: ['licell ram users --output json'],
      agentTips: [
        '先使用 `ram users` 查询用户；未封装的角色、策略 API 继续走 capability products/search/describe。'
      ]
    }
  },
  commands: [ramUsersCommand]
});
