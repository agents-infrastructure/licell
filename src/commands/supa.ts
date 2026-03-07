import type { CAC } from 'cac';
import type { CommandMetadataMap } from './module';
import { confirm, isCancel } from '@clack/prompts';
import pc from 'picocolors';
import { executeWithAuthRecovery } from '../utils/auth-recovery';
import {
  provisionSupabase,
  listSupabaseInstances,
  getSupabaseInstanceDetail,
  getSupabaseEndpoints,
  getSupabaseAuthInfo,
  getSupabaseStorageConfig,
  getSupabaseRAGConfig,
  getSupabaseIpWhitelist,
  modifySupabaseAuthConfig,
  modifySupabaseStorageConfig,
  modifySupabaseRAGConfig,
  modifySupabaseIpWhitelist,
  resetSupabasePassword,
  restartSupabaseInstance,
  stopSupabaseInstance,
  startSupabaseInstance,
  deleteSupabaseInstance
} from '../providers/supabase';
import {
  ensureAuthOrExit,
  createSpinner,
  isInteractiveTTY,
  showIntro,
  showOutro,
  toOptionalString,
  parseListLimit,
  withSpinner
} from '../utils/cli-shared';
import { emitCliResult, isJsonOutput } from '../utils/output';

export function registerSupaCommands(cli: CAC) {

  // ── supa add ──
  cli.command('supa add', '创建 RDS Supabase 实例')
    .option('--name <name>', '应用名称')
    .option('--vsw <vSwitchId>', '指定 VSwitch ID')
    .option('--class <instanceClass>', '实例规格（默认 rdsai.supabase.basic）')
    .option('--db-instance <dbInstanceName>', '关联已有 RDS PostgreSQL 实例 ID')
    .option('--dashboard-user <user>', 'Dashboard 用户名（默认 supabase）')
    .option('--dashboard-password <password>', 'Dashboard 密码（自动生成）')
    .option('--db-password <password>', '数据库密码（自动生成）')
    .option('--public-network', '开启公网 NAT 网关')
    .action(async (options: {
      name?: unknown;
      vsw?: unknown;
      class?: unknown;
      dbInstance?: unknown;
      dashboardUser?: unknown;
      dashboardPassword?: unknown;
      dbPassword?: unknown;
      publicNetwork?: boolean;
    }) => {
      await executeWithAuthRecovery(
        { commandLabel: 'licell supa add', interactiveTTY: isInteractiveTTY(), requiredCapabilities: ['rdsai', 'vpc'] },
        async () => {
          showIntro(pc.bgGreen(pc.black(' 🟢 Supabase Provisioning ')));
          ensureAuthOrExit();
          const s = createSpinner();
          const result = await withSpinner(
            s,
            '正在创建 Supabase 实例...',
            '❌ 创建失败',
            () => provisionSupabase(s, {
              appName: toOptionalString(options.name),
              vSwitchId: toOptionalString(options.vsw),
              instanceClass: toOptionalString(options.class),
              dbInstanceName: toOptionalString(options.dbInstance),
              dashboardUsername: toOptionalString(options.dashboardUser),
              dashboardPassword: toOptionalString(options.dashboardPassword),
              databasePassword: toOptionalString(options.dbPassword),
              publicNetworkAccessEnabled: options.publicNetwork ?? false
            })
          );
          if (!result) return;
          if (isJsonOutput()) {
            emitCliResult({ stage: 'supa.add', ...result });
            return;
          }
          s.stop(pc.green('✅ Supabase 实例已就绪！'));
          console.log(`\ninstanceName:  ${pc.cyan(result.instanceName)}`);
          console.log(`appName:       ${pc.cyan(result.appName)}`);
          if (result.supabaseUrl) console.log(`url:           ${pc.cyan(result.supabaseUrl)}`);
          console.log(`dashboard:     ${pc.cyan(result.dashboardUsername)} / ${pc.cyan(result.dashboardPassword)}`);
          console.log(`db password:   ${pc.cyan(result.databasePassword)}`);
          if (result.anonKey) console.log(`anon key:      ${pc.gray(result.anonKey.slice(0, 30))}...`);
          if (result.serviceKey) console.log(`service key:   ${pc.gray(result.serviceKey.slice(0, 30))}...`);
          console.log('');
          showOutro('凭证已保存到项目环境变量 (SUPABASE_URL, SUPABASE_ANON_KEY 等)');
        }
      );
    });

  // ── supa list ──
  cli.command('supa list', '查看 Supabase 实例列表')
    .option('--limit <n>', '返回数量，默认 20')
    .action(async (options: { limit?: unknown }) => {
      await executeWithAuthRecovery(
        { commandLabel: 'licell supa list', interactiveTTY: isInteractiveTTY(), requiredCapabilities: ['rdsai'] },
        async () => {
          ensureAuthOrExit();
          const limit = parseListLimit(options.limit, 20, 200);
          const s = createSpinner();
          const instances = await withSpinner(s, '正在拉取 Supabase 实例列表...', '❌ 获取失败', () => listSupabaseInstances(limit));
          if (!instances) return;
          if (isJsonOutput()) {
            emitCliResult({ stage: 'supa.list', count: instances.length, instances });
            return;
          }
          s.stop(pc.green(`✅ 共获取 ${instances.length} 个实例`));
          if (instances.length === 0) { showOutro('当前地域没有 Supabase 实例'); return; }
          for (const item of instances) {
            console.log(
              `${pc.cyan(item.instanceName)}  app=${pc.gray(item.appName || '-')}  status=${pc.gray(item.status || '-')}  pg=${pc.gray(item.dbInstanceName || '-')}`
            );
          }
          console.log('');
          showOutro('Done.');
        }
      );
    });

  // ── supa info ──
  cli.command('supa info <instanceName>', '查看 Supabase 实例详情')
    .action(async (instanceName: string) => {
      await executeWithAuthRecovery(
        { commandLabel: 'licell supa info', interactiveTTY: isInteractiveTTY(), requiredCapabilities: ['rdsai'] },
        async () => {
          ensureAuthOrExit();
          const name = instanceName.trim();
          const s = createSpinner();
          const detail = await withSpinner(s, `正在拉取实例 ${name} 详情...`, '❌ 获取失败', () => getSupabaseInstanceDetail(name));
          if (!detail) return;
          if (isJsonOutput()) { emitCliResult({ stage: 'supa.info', detail }); return; }
          s.stop(pc.green('✅ 获取成功'));
          console.log(`\ninstanceName:  ${pc.cyan(detail.instanceName)}`);
          console.log(`appName:       ${pc.cyan(detail.appName || '-')}`);
          console.log(`status:        ${pc.cyan(detail.status || '-')}`);
          console.log(`class:         ${pc.cyan(detail.instanceClass || '-')}`);
          console.log(`region/zone:   ${pc.cyan(`${detail.regionId || '-'} / ${detail.zoneId || '-'}`)}`);
          console.log(`pgInstance:    ${pc.cyan(detail.dbInstanceName || '-')}`);
          console.log(`vSwitch:       ${pc.cyan(detail.vSwitchId || '-')}`);
          if (detail.vpcConnectionString) console.log(`vpc url:       ${pc.cyan(detail.vpcConnectionString)}`);
          if (detail.publicConnectionString) console.log(`public url:    ${pc.cyan(detail.publicConnectionString)}`);
          console.log('');
          showOutro('Done.');
        }
      );
    });

  // ── supa connect ──
  cli.command('supa connect <instanceName>', '查看 Supabase 连接信息和 API Keys')
    .action(async (instanceName: string) => {
      await executeWithAuthRecovery(
        { commandLabel: 'licell supa connect', interactiveTTY: isInteractiveTTY(), requiredCapabilities: ['rdsai'] },
        async () => {
          ensureAuthOrExit();
          const name = instanceName.trim();
          const s = createSpinner();
          const [endpoints, authInfo] = await withSpinner(
            s, '正在获取连接信息...', '❌ 获取失败',
            () => Promise.all([getSupabaseEndpoints(name), getSupabaseAuthInfo(name)])
          ) || [null, null];
          if (!endpoints || !authInfo) return;
          if (isJsonOutput()) { emitCliResult({ stage: 'supa.connect', instanceName: name, endpoints, authInfo }); return; }
          s.stop(pc.green('✅ 连接信息'));
          console.log(pc.yellow('\n── Supabase Endpoints ──'));
          for (const ep of endpoints.instanceEndpoints) {
            console.log(`  ${pc.gray(ep.ipType || '-')}: ${pc.cyan(ep.connectionString || '-')}`);
          }
          if (endpoints.dbInstanceEndpoints.length > 0) {
            console.log(pc.yellow('\n── DB Endpoints ──'));
            for (const ep of endpoints.dbInstanceEndpoints) {
              console.log(`  ${pc.gray(ep.ipType || '-')}: ${pc.cyan(ep.connectionString || '-')}:${pc.cyan(ep.port || '-')}`);
            }
          }
          console.log(pc.yellow('\n── API Keys ──'));
          if (authInfo.jwtSecret) console.log(`jwt secret:    ${pc.gray(authInfo.jwtSecret.slice(0, 20))}...`);
          if (authInfo.anonKey) console.log(`anon key:      ${pc.gray(authInfo.anonKey.slice(0, 40))}...`);
          if (authInfo.serviceKey) console.log(`service key:   ${pc.gray(authInfo.serviceKey.slice(0, 40))}...`);
          if (authInfo.configList.length > 0) {
            console.log(pc.yellow('\n── Auth Config ──'));
            for (const c of authInfo.configList) {
              console.log(`  ${pc.gray(c.name)}: ${pc.cyan(c.value)}`);
            }
          }
          console.log('');
          showOutro('Done.');
        }
      );
    });

  // ── supa config ──
  cli.command('supa config <instanceName>', '查看 Supabase 实例配置（auth/storage/rag）')
    .option('--set-auth <key=value>', '修改 Auth 配置（如 GOTRUE_SITE_URL=http://example.com）')
    .option('--set-storage <key=value>', '修改 Storage 配置（如 TENANT_ID=my-prefix）')
    .option('--rag <on|off>', '开启/关闭 RAG Agent')
    .option('--set-rag <key=value>', '修改 RAG 配置（如 LLM_MODEL=qwen-flash）')
    .action(async (instanceName: string, options: {
      setAuth?: string;
      setStorage?: string;
      rag?: string;
      setRag?: string;
    }) => {
      await executeWithAuthRecovery(
        { commandLabel: 'licell supa config', interactiveTTY: isInteractiveTTY(), requiredCapabilities: ['rdsai'] },
        async () => {
          ensureAuthOrExit();
          const name = instanceName.trim();
          const s = createSpinner();

          // Handle modifications
          if (options.setAuth) {
            const [key, ...rest] = options.setAuth.split('=');
            const value = rest.join('=');
            if (!key || value === undefined) throw new Error('格式: --set-auth KEY=VALUE');
            await withSpinner(s, `正在修改 Auth 配置 ${key}...`, '❌ 修改失败',
              () => modifySupabaseAuthConfig(name, [{ name: key, value }]));
            if (!isJsonOutput()) s.stop(pc.green(`✅ Auth 配置 ${key} 已更新`));
            else { emitCliResult({ stage: 'supa.config', action: 'set-auth', key, value }); return; }
          }
          if (options.setStorage) {
            const [key, ...rest] = options.setStorage.split('=');
            const value = rest.join('=');
            if (!key || value === undefined) throw new Error('格式: --set-storage KEY=VALUE');
            await withSpinner(s, `正在修改 Storage 配置 ${key}...`, '❌ 修改失败',
              () => modifySupabaseStorageConfig(name, [{ name: key, value }]));
            if (!isJsonOutput()) s.stop(pc.green(`✅ Storage 配置 ${key} 已更新`));
            else { emitCliResult({ stage: 'supa.config', action: 'set-storage', key, value }); return; }
          }
          if (options.rag || options.setRag) {
            const ragStatus = options.rag === 'on' ? true : options.rag === 'off' ? false : undefined;
            let ragConfig: { name: string; value: string }[] | undefined;
            if (options.setRag) {
              const [key, ...rest] = options.setRag.split('=');
              const value = rest.join('=');
              if (!key || value === undefined) throw new Error('格式: --set-rag KEY=VALUE');
              ragConfig = [{ name: key, value }];
            }
            await withSpinner(s, '正在修改 RAG 配置...', '❌ 修改失败',
              () => modifySupabaseRAGConfig(name, ragStatus, ragConfig));
            if (!isJsonOutput()) s.stop(pc.green('✅ RAG 配置已更新'));
            else { emitCliResult({ stage: 'supa.config', action: 'set-rag', ragStatus, ragConfig }); return; }
          }

          // If no modification flags, show current config
          if (!options.setAuth && !options.setStorage && !options.rag && !options.setRag) {
            const [authInfo, storageConfig, ragConfig] = await withSpinner(
              s, '正在获取配置...', '❌ 获取失败',
              () => Promise.all([
                getSupabaseAuthInfo(name),
                getSupabaseStorageConfig(name),
                getSupabaseRAGConfig(name)
              ])
            ) || [null, null, null];
            if (!authInfo || !storageConfig || !ragConfig) return;
            if (isJsonOutput()) {
              emitCliResult({ stage: 'supa.config', instanceName: name, authInfo, storageConfig, ragConfig });
              return;
            }
            s.stop(pc.green('✅ 配置信息'));
            if (authInfo.configList.length > 0) {
              console.log(pc.yellow('\n── Auth Config ──'));
              for (const c of authInfo.configList) console.log(`  ${pc.gray(c.name)}: ${pc.cyan(c.value)}`);
            }
            if (storageConfig.length > 0) {
              console.log(pc.yellow('\n── Storage Config (OSS) ──'));
              for (const c of storageConfig) console.log(`  ${pc.gray(c.name)}: ${pc.cyan(c.value)}`);
            }
            console.log(pc.yellow('\n── RAG Agent ──'));
            console.log(`  status: ${ragConfig.status ? pc.green('enabled') : pc.gray('disabled')}`);
            if (ragConfig.configList.length > 0) {
              for (const c of ragConfig.configList) console.log(`  ${pc.gray(c.name)}: ${pc.cyan(c.value)}`);
            }
            console.log('');
            showOutro('使用 --set-auth / --set-storage / --rag / --set-rag 修改配置');
          }
        }
      );
    });

  // ── supa whitelist ──
  cli.command('supa whitelist <instanceName>', '查看/修改 Supabase IP 白名单')
    .option('--set <ips>', '设置白名单 IP（覆盖模式，逗号分隔）')
    .option('--add <ips>', '追加白名单 IP（逗号分隔）')
    .option('--remove <ips>', '删除白名单 IP（逗号分隔）')
    .option('--group <name>', '白名单分组名称（默认 default）')
    .action(async (instanceName: string, options: {
      set?: string;
      add?: string;
      remove?: string;
      group?: string;
    }) => {
      await executeWithAuthRecovery(
        { commandLabel: 'licell supa whitelist', interactiveTTY: isInteractiveTTY(), requiredCapabilities: ['rdsai'] },
        async () => {
          ensureAuthOrExit();
          const name = instanceName.trim();
          const group = options.group?.trim() || 'default';
          const s = createSpinner();

          if (options.set) {
            await withSpinner(s, '正在设置白名单...', '❌ 设置失败',
              () => modifySupabaseIpWhitelist(name, options.set!, 'Cover', group));
            if (isJsonOutput()) { emitCliResult({ stage: 'supa.whitelist', action: 'set', ips: options.set }); return; }
            s.stop(pc.green('✅ 白名单已更新'));
          } else if (options.add) {
            await withSpinner(s, '正在追加白名单...', '❌ 追加失败',
              () => modifySupabaseIpWhitelist(name, options.add!, 'Append', group));
            if (isJsonOutput()) { emitCliResult({ stage: 'supa.whitelist', action: 'add', ips: options.add }); return; }
            s.stop(pc.green('✅ 白名单已追加'));
          } else if (options.remove) {
            await withSpinner(s, '正在删除白名单...', '❌ 删除失败',
              () => modifySupabaseIpWhitelist(name, options.remove!, 'Delete', group));
            if (isJsonOutput()) { emitCliResult({ stage: 'supa.whitelist', action: 'remove', ips: options.remove }); return; }
            s.stop(pc.green('✅ 白名单已删除'));
          } else {
            const groups = await withSpinner(s, '正在获取白名单...', '❌ 获取失败', () => getSupabaseIpWhitelist(name));
            if (!groups) return;
            if (isJsonOutput()) { emitCliResult({ stage: 'supa.whitelist', instanceName: name, groups }); return; }
            s.stop(pc.green('✅ IP 白名单'));
            for (const g of groups) {
              console.log(`\n${pc.yellow(`── ${g.groupName} ──`)}`);
              console.log(`  ${pc.cyan(g.ipWhitelist || '(empty)')}`);
            }
            console.log('');
            showOutro('使用 --set / --add / --remove 修改白名单');
          }
        }
      );
    });

  // ── supa reset-password ──
  cli.command('supa reset-password <instanceName>', '重置 Supabase Dashboard 或数据库密码')
    .option('--dashboard-password <password>', '新的 Dashboard 密码')
    .option('--db-password <password>', '新的数据库密码')
    .action(async (instanceName: string, options: { dashboardPassword?: string; dbPassword?: string }) => {
      await executeWithAuthRecovery(
        { commandLabel: 'licell supa reset-password', interactiveTTY: isInteractiveTTY(), requiredCapabilities: ['rdsai'] },
        async () => {
          ensureAuthOrExit();
          const name = instanceName.trim();
          if (!options.dashboardPassword && !options.dbPassword) {
            throw new Error('请指定 --dashboard-password 或 --db-password');
          }
          const s = createSpinner();
          await withSpinner(s, '正在重置密码...', '❌ 重置失败',
            () => resetSupabasePassword(name, options.dashboardPassword, options.dbPassword));
          if (isJsonOutput()) { emitCliResult({ stage: 'supa.reset-password', instanceName: name }); return; }
          s.stop(pc.green('✅ 密码已重置'));
          showOutro('Done.');
        }
      );
    });

  // ── supa restart / stop / start ──
  for (const [cmd, label, fn] of [
    ['supa restart', '重启', restartSupabaseInstance],
    ['supa stop', '暂停', stopSupabaseInstance],
    ['supa start', '启动', startSupabaseInstance]
  ] as const) {
    cli.command(`${cmd} <instanceName>`, `${label} Supabase 实例`)
      .action(async (instanceName: string) => {
        await executeWithAuthRecovery(
          { commandLabel: `licell ${cmd}`, interactiveTTY: isInteractiveTTY(), requiredCapabilities: ['rdsai'] },
          async () => {
            ensureAuthOrExit();
            const name = instanceName.trim();
            const s = createSpinner();
            await withSpinner(s, `正在${label}实例 ${name}...`, `❌ ${label}失败`, () => fn(name));
            if (isJsonOutput()) { emitCliResult({ stage: `supa.${cmd.split(' ')[1]}`, instanceName: name }); return; }
            s.stop(pc.green(`✅ 实例 ${name} 已${label}`));
            showOutro('Done.');
          }
        );
      });
  }

  // ── supa rm ──
  cli.command('supa rm <instanceName>', '删除 Supabase 实例')
    .option('--yes', '跳过确认')
    .action(async (instanceName: string, options: { yes?: boolean }) => {
      await executeWithAuthRecovery(
        { commandLabel: 'licell supa rm', interactiveTTY: isInteractiveTTY(), requiredCapabilities: ['rdsai'] },
        async () => {
          showIntro(pc.bgRed(pc.white(' 🗑️ Delete Supabase Instance ')));
          ensureAuthOrExit();
          const name = instanceName.trim();
          if (!name) throw new Error('请提供 instanceName');

          if (!options.yes && isInteractiveTTY()) {
            const ok = await confirm({ message: `确认删除 Supabase 实例 ${pc.red(name)}？此操作不可恢复。\n⚠️ 注意：关联的 RDS PostgreSQL 实例和 NAT 网关需要手动删除。` });
            if (isCancel(ok) || !ok) { showOutro('已取消'); return; }
          }

          const s = createSpinner();
          await withSpinner(s, `正在删除实例 ${name}...`, '❌ 删除失败', () => deleteSupabaseInstance(name));
          if (isJsonOutput()) { emitCliResult({ stage: 'supa.rm', instanceName: name }); return; }
          showOutro(`实例 ${name} 已删除。⚠️ 关联的 PG 实例和 NAT 网关需手动清理。`);
        }
      );
    });
}

export const supaCommandMetadata: CommandMetadataMap = {
  supa: {
    summary: 'Supabase 实例的创建、配置、连接、生命周期与白名单管理。',
    examples: ['licell supa list', 'licell supa info <instanceName>', 'licell supa config <instanceName> --output json']
  },
  'supa rm': {
    safety: {
      level: 'destructive',
      reason: '会删除 Supabase 实例及其相关配置。'
    }
  }
};
