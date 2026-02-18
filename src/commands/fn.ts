import type { CAC } from 'cac';
import { outro, spinner } from '@clack/prompts';
import pc from 'picocolors';
import { readFileSync, realpathSync } from 'fs';
import { resolve, relative, isAbsolute } from 'path';
import { Config } from '../utils/config';
import {
  getFunctionInfo,
  invokeFunction,
  listFunctions,
  removeFunction
} from '../providers/fc';
import {
  ensureAuthOrExit,
  ensureDestructiveActionConfirmed,
  toOptionalString,
  parseListLimit,
  withSpinner
} from '../utils/cli-shared';

export function registerFnCommands(cli: CAC) {
  cli.command('fn list', '查看函数列表')
    .option('--limit <n>', '返回数量，默认 20')
    .option('--prefix <prefix>', '按函数名前缀过滤')
    .action(async (options: { limit?: unknown; prefix?: unknown }) => {
      ensureAuthOrExit();
      const limit = parseListLimit(options.limit, 20, 200);
      const prefix = toOptionalString(options.prefix);

      const s = spinner();
      const functions = await withSpinner(
        s,
        '正在拉取函数列表...',
        '❌ 获取函数列表失败',
        () => listFunctions(limit, prefix)
      );
      if (!functions) return;
      s.stop(pc.green(`✅ 共获取 ${functions.length} 个函数`));
      if (functions.length === 0) {
        outro('当前地域没有函数');
        return;
      }
      for (const fn of functions) {
        console.log(
          `${pc.cyan(fn.functionName)}  runtime=${pc.gray(fn.runtime || '-')}  state=${pc.gray(fn.state || '-')}  updated=${pc.gray(fn.lastModifiedTime || '-')}`
        );
      }
      console.log('');
      outro('Done.');
    });

  cli.command('fn info [name]', '查看函数详情')
    .option('--target <target>', '指定 alias/version（如 prod/preview/1）')
    .action(async (name: string | undefined, options: { target?: unknown }) => {
      ensureAuthOrExit();
      const project = Config.getProject();
      const functionName = toOptionalString(name) || project.appName;
      if (!functionName) {
        throw new Error('请传入函数名，或先在当前项目执行 licell deploy 生成 appName');
      }
      const qualifier = toOptionalString(options.target);

      const s = spinner();
      const fn = await withSpinner(
        s,
        `正在拉取函数 ${functionName} 详情...`,
        '❌ 获取函数详情失败',
        () => getFunctionInfo(functionName, qualifier || undefined)
      );
      if (!fn) return;
      s.stop(pc.green('✅ 获取成功'));
      console.log(`\nfunction: ${pc.cyan(fn.functionName || functionName)}`);
      if (qualifier) console.log(`qualifier: ${pc.cyan(qualifier)}`);
      console.log(`runtime:   ${pc.cyan(fn.runtime || '-')}`);
      console.log(`handler:   ${pc.cyan(fn.handler || '-')}`);
      console.log(`state:     ${pc.cyan(fn.state || '-')}`);
      console.log(`memory:    ${pc.cyan(String(fn.memorySize || '-'))}`);
      console.log(`timeout:   ${pc.cyan(String(fn.timeout || '-'))}`);
      console.log(`updated:   ${pc.cyan(fn.lastModifiedTime || '-')}`);
      console.log(`envCount:  ${pc.cyan(String(Object.keys(fn.environmentVariables || {}).length))}`);
      console.log('');
      outro('Done.');
    });

  cli.command('fn invoke [name]', '调用函数（同步）')
    .option('--target <target>', '指定 alias/version（如 prod/preview/1）')
    .option('--payload <text>', '传入原始 payload 文本')
    .option('--file <path>', '从文件读取 payload')
    .action(async (name: string | undefined, options: { target?: unknown; payload?: unknown; file?: unknown }) => {
      ensureAuthOrExit();
      const project = Config.getProject();
      const functionName = toOptionalString(name) || project.appName;
      if (!functionName) {
        throw new Error('请传入函数名，或先在当前项目执行 licell deploy 生成 appName');
      }
      const qualifier = toOptionalString(options.target);
      const payloadText = toOptionalString(options.payload);
      const payloadFile = toOptionalString(options.file);
      if (payloadText && payloadFile) throw new Error('--payload 与 --file 不能同时使用');
      let payload: string | undefined;
      if (payloadFile) {
        let resolvedPath: string;
        try {
          resolvedPath = realpathSync(resolve(payloadFile));
        } catch {
          throw new Error(`文件不存在或无法访问: ${payloadFile}`);
        }
        const rel = relative(process.cwd(), resolvedPath);
        if (rel.startsWith('..') || isAbsolute(rel)) {
          throw new Error('--file 路径必须在当前工作目录内');
        }
        payload = readFileSync(resolvedPath, 'utf-8');
      } else {
        payload = payloadText;
      }

      const s = spinner();
      const result = await withSpinner(
        s,
        `正在调用函数 ${functionName}...`,
        '❌ 函数调用失败',
        () => invokeFunction(functionName, { qualifier: qualifier || undefined, payload: payload || undefined })
      );
      if (!result) return;
      s.stop(pc.green(`✅ 调用完成 (status=${result.statusCode})`));
      console.log('');
      if (result.body && result.body.trim().length > 0) {
        console.log(result.body);
      } else {
        console.log('<empty response>');
      }
      console.log('');
      outro('Done.');
    });

  cli.command('fn rm [name]', '删除函数')
    .option('--force', '级联删除触发器、alias、已发布版本后再删除函数')
    .option('--yes', '跳过二次确认（危险）')
    .action(async (name: string | undefined, options: { force?: boolean; yes?: boolean }) => {
      ensureAuthOrExit();
      const project = Config.getProject();
      const functionName = toOptionalString(name) || project.appName;
      if (!functionName) {
        throw new Error('请传入函数名，或先在当前项目执行 licell deploy 生成 appName');
      }
      await ensureDestructiveActionConfirmed(
        options.force ? `删除函数 ${functionName}（含触发器/alias/版本）` : `删除函数 ${functionName}`,
        { yes: Boolean(options.yes) }
      );

      const s = spinner();
      const deleted = await withSpinner(
        s,
        options.force
          ? `正在级联清理并删除函数 ${functionName}...`
          : `正在删除函数 ${functionName}...`,
        '❌ 删除函数失败',
        () => removeFunction(functionName, { force: Boolean(options.force) })
      );
      if (!deleted) return;
      s.stop(pc.green('✅ 函数已删除'));
      if (deleted.forced) {
        console.log(`\ncleanup: triggers=${deleted.deletedTriggers.length} aliases=${deleted.deletedAliases.length} versions=${deleted.deletedVersions.length}`);
      }
      outro('Done.');
    });
}
