import type { CAC } from 'cac';
import pc from 'picocolors';
import { listCasCertificates } from '../providers/cas-query';
import { executeWithAuthRecovery } from '../utils/auth-recovery';
import { ensureAuthOrExit, isInteractiveTTY, parseListLimit, toOptionalString } from '../utils/cli-shared';
import { emitCommandResult, isJsonOutput } from '../utils/output';
import { commandInvocation, defineCliCommand, defineCommandModule, registerCliCommand } from './module';
import { DELIVERY_SECTION } from './sections';

const certListCommand = defineCliCommand({
  rawName: 'cert list',
  description: '列出阿里云证书摘要（只读）',
  region: { scope: 'auth' },
  options: [
    { rawName: '--region <regionId>', description: '查询地域；不传则使用当前 licell 默认 region' },
    { rawName: '--keyword <keyword>', description: '按证书名称、域名或 SAN 关键字过滤' },
    { rawName: '--status <status>', description: '按证书状态过滤，例如 ISSUE、REVOKE' },
    { rawName: '--cert-type <type>', description: '按证书类型过滤，例如 CA、CERT' },
    { rawName: '--source-type <type>', description: '按证书来源过滤，例如 upload、aliyun' },
    { rawName: '--limit <n>', description: '返回数量，默认 50，最大 200' }
  ],
  descriptor: {
    title: 'List certificates',
    summary: '通过 CAS ListCert 只读 API 列出当前地域的证书摘要，不返回证书正文或私钥。',
    examples: [
      'licell cert list --region cn-hangzhou --output json',
      'licell cert list --keyword example.com --status ISSUE --output json'
    ],
    related: ['domain', 'api invoke', 'capability search'],
    agentTips: [
      '先读取 `certificates[].certificateId` 或 `identifier`，需要完整协议参数时继续用 `capability describe cas.ListCert`。',
      '本命令只投影证书名称、域名、状态和有效期等摘要，不传递 PEM、私钥或其他敏感正文。',
      'CAS 未封装的其他证书能力继续通过 `capability search --product cas` 发现并回退到 `api invoke`。'
    ],
    automation: {
      preferredOutput: 'json',
      explicitInputs: ['--region', '--keyword', '--status', '--cert-type', '--source-type', '--limit']
    },
    safety: {
      level: 'safe',
      reason: '只调用 CAS ListCert 读取证书摘要，不创建、续期、吊销或部署证书。',
      confirmFlags: []
    },
    recommendedFlow: [
      { title: '列出证书', command: 'licell cert list --output json', reason: '获取当前地域内的证书摘要和标识。' },
      { title: '探索其他 CAS 能力', command: 'licell capability search --product cas --intent "查看证书详情" --action inspect --output json', reason: '发现证书详情等未封装的 protocol API。' },
      { title: '读取 capability 定义', command: 'licell capability describe <ref> --output json', reason: '确认必填参数后再决定使用领域命令或 raw API fallback。' }
    ],
    result: {
      summary: '返回 CAS 证书摘要、过滤条件、总数和截断状态。',
      outcomeKey: 'certificates',
      fields: [
        { name: 'stage', description: '固定为 `cas.certificates`。', required: true },
        { name: 'regionId', description: '实际查询地域。', required: true },
        { name: 'count', description: '本次返回证书数量。', required: true },
        { name: 'totalCount', description: '云端匹配证书总数。', required: true },
        { name: 'limit', description: '本次查询使用的返回数量上限。', required: true },
        { name: 'truncated', description: '结果是否因 limit 截断。', required: true },
        { name: 'filters', description: '实际使用的关键字、状态、类型和来源过滤条件。', required: true },
        { name: 'requestId', description: 'CAS API requestId。', required: false },
        { name: 'certificates[]', description: '证书 ID、名称、域名、状态、类型、来源和有效期摘要；不含证书正文或私钥。', required: true }
      ]
    }
  }
});

export function registerCertCommands(cli: CAC) {
  registerCliCommand(cli, certListCommand).action(async (options: {
    region?: unknown;
    keyword?: unknown;
    status?: unknown;
    certType?: unknown;
    sourceType?: unknown;
    limit?: unknown;
  }) => {
    const result = await executeWithAuthRecovery(
      { commandLabel: commandInvocation(certListCommand), interactiveTTY: isInteractiveTTY() },
      async () => {
        await ensureAuthOrExit();
        const value = await listCasCertificates({
          regionId: toOptionalString(options.region),
          keyword: toOptionalString(options.keyword),
          status: toOptionalString(options.status),
          certType: toOptionalString(options.certType),
          sourceType: toOptionalString(options.sourceType),
          limit: parseListLimit(options.limit, 50, 200)
        });
        if (isJsonOutput()) emitCommandResult(value);
        return value;
      }
    );
    if (!isJsonOutput()) {
      console.log(pc.bold(`Certificates (${result.count})`));
      for (const certificate of result.certificates) {
        console.log(`- ${pc.cyan(certificate.name || certificate.certificateId)}  ${certificate.domain || '-'}  ${certificate.status || '-'}`);
      }
    }
  });
}

export const certCommandModule = defineCommandModule({
  section: DELIVERY_SECTION,
  register: registerCertCommands,
  namespaces: {
    cert: {
      title: 'Certificate Services',
      summary: '通过 CAS 读取证书摘要，并通过 capability fallback 探索详情、续期、吊销和部署能力。',
      examples: ['licell cert list --output json'],
      agentTips: [
        '先用 `cert list` 获取安全的证书摘要；未封装的 CAS API 继续走 capability products/search/describe。'
      ]
    }
  },
  commands: [certListCommand]
});
