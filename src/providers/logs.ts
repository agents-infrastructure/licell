import SLS, * as $SLS from '@alicloud/sls20201230';
import * as $OpenApi from '@alicloud/openapi-client';
import { Config } from '../utils/config';
import pc from 'picocolors';
import { sleep } from '../utils/runtime';
import { resolveSdkCtor } from '../utils/sdk';
import { formatErrorMessage } from '../utils/errors';

const SlsClientCtor = resolveSdkCtor<SLS>(SLS, '@alicloud/sls20201230');

export function sanitizeQueryValue(value: string): string {
  return value.replace(/['"\\*?:|\[\]{}()&!^~]/g, '');
}

interface LogEntry {
  __time__?: string;
  __source__?: string;
  message?: string;
  content?: string;
  [key: string]: unknown;
}

export interface TailLogsOptions {
  once?: boolean;
  windowSeconds?: number;
  lineLimit?: number;
  silent?: boolean;
}

function shouldIgnoreLogsBootstrapError(err: unknown) {
  const message = formatErrorMessage(err).toLowerCase();
  return message.includes('projectnotexist') || message.includes('logstorenotexist');
}

function renderLogEntries(logs: LogEntry[], seenLogs?: Set<string>, silent = false) {
  const rendered: string[] = [];
  logs
    .sort((a, b) => parseInt(a.__time__ || '0', 10) - parseInt(b.__time__ || '0', 10))
    .forEach((log) => {
      const logKey = `${log.__time__ || ''}|${log.__source__ || ''}|${log.message || log.content || ''}`;
      if (seenLogs?.has(logKey)) return;
      if (seenLogs) {
        seenLogs.add(logKey);
        if (seenLogs.size > 5000) {
          const entries = [...seenLogs];
          seenLogs.clear();
          for (const entry of entries.slice(-2500)) seenLogs.add(entry);
        }
      }

      const timeStr = new Date(parseInt(log.__time__ || '0', 10) * 1000).toLocaleTimeString();
      let formattedMsg = String(log.message || log.content || JSON.stringify(log)).trim();
      if (formattedMsg.toLowerCase().includes('error')) formattedMsg = pc.red(formattedMsg);
      const line = `${pc.gray(`[${timeStr}]`)} ${formattedMsg}`;
      rendered.push(line);
      if (!silent) {
        console.log(line);
      }
    });
  return rendered;
}

export async function tailLogs(appName: string, options: TailLogsOptions = {}) {
  const auth = Config.requireAuth();
  const slsClient = new SlsClientCtor(new $OpenApi.Config({ accessKeyId: auth.ak, accessKeySecret: auth.sk, endpoint: `${auth.region}.log.aliyuncs.com` }));
  const slsProject = `aliyun-fc-${auth.region}-${auth.accountId}`;
  const slsLogstore = `function-log`;
  const safeName = sanitizeQueryValue(appName);
  const lineLimit = options.lineLimit && options.lineLimit > 0 ? Math.floor(options.lineLimit) : 1000;

  if (options.once) {
    const windowSeconds = options.windowSeconds && options.windowSeconds > 0
      ? Math.floor(options.windowSeconds)
      : 120;
    const toTime = Math.floor(Date.now() / 1000);
    const fromTime = Math.max(0, toTime - windowSeconds);
    try {
      const res = await slsClient.getLogs(
        slsProject,
        slsLogstore,
        new $SLS.GetLogsRequest({
          from: fromTime,
          to: toTime,
          query: `* and functionName: "${safeName}"`,
          line: lineLimit
        })
      );
      const logs: LogEntry[] = (res.body as LogEntry[] | undefined) || [];
      if (logs.length === 0) {
        if (!options.silent) {
          console.log(pc.gray(`最近 ${windowSeconds}s 无日志`));
        }
        return { mode: 'once' as const, logs: [], lines: [] };
      }
      const lines = renderLogEntries(logs, undefined, Boolean(options.silent));
      return { mode: 'once' as const, logs, lines };
    } catch (err: unknown) {
      if (shouldIgnoreLogsBootstrapError(err)) {
        if (!options.silent) {
          console.log(pc.yellow(`⚠️ 日志服务尚未就绪，已跳过: ${formatErrorMessage(err)}`));
        }
        return { mode: 'once' as const, logs: [], lines: [] };
      }
      throw err;
    }
  }

  if (!options.silent) {
    console.log(pc.gray(`\n📡 正在监听云端 [${pc.cyan(appName)}] 的实时日志流 (Ctrl+C 退出)...\n`));
  }
  let lastLogTime = Math.floor(Date.now() / 1000) - 60;
  const seenLogs = new Set<string>();
  let lastErrorAt = 0;
  let running = true;

  const shutdown = () => {
    running = false;
    if (!options.silent) {
      console.log(pc.gray('\n👋 日志流已断开'));
    }
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  while (running) {
    try {
      const toTime = Math.floor(Date.now() / 1000);
      if (toTime <= lastLogTime) { await sleep(1500); continue; }
      const res = await slsClient.getLogs(slsProject, slsLogstore, new $SLS.GetLogsRequest({
        from: lastLogTime,
        to: toTime,
        query: `* and functionName: "${safeName}"`,
        line: lineLimit
      }));
      const logs: LogEntry[] = (res.body as LogEntry[] | undefined) || [];
      renderLogEntries(logs, seenLogs, Boolean(options.silent));
      if (logs.length > 0) {
        const latest = parseInt(logs[logs.length - 1].__time__ || `${lastLogTime}`, 10);
        if (Number.isFinite(latest) && latest > 0) lastLogTime = latest;
      }
    } catch (err: unknown) {
      const now = Date.now();
      if (now - lastErrorAt > 10_000) {
        const message = formatErrorMessage(err);
        if (!options.silent) {
          console.log(pc.yellow(`⚠️ 日志拉取失败，10 秒后重试: ${message}`));
        }
        lastErrorAt = now;
      }
    }
    await sleep(1500);
  }
}
