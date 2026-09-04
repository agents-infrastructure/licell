import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  type AlicloudProtocolScope,
  updateAlicloudProtocol
} from '../src/utils/alicloud-protocol';
import { writeAlicloudCapabilityIndex } from '../src/utils/alicloud-capability-generator';

function argument(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function git(path: string, args: string[]) {
  return execFileSync('git', ['-C', path, ...args], { encoding: 'utf8' }).trim();
}

function resolveSource(source: string) {
  const absolute = resolve(source);
  const nestedMetadata = join(absolute, 'aliyun-openapi-meta');
  if (existsSync(join(nestedMetadata, 'metadatas', 'products.json'))) {
    return { aliyunCliRoot: absolute, metadataRoot: nestedMetadata };
  }
  if (existsSync(join(absolute, 'metadatas', 'products.json'))) {
    return { metadataRoot: absolute };
  }
  throw new Error(`找不到 aliyun-openapi-meta/metadatas/products.json: ${absolute}`);
}

function summarize(changes: ReturnType<typeof updateAlicloudProtocol>['changes']) {
  return changes.reduce<Record<string, number>>((summary, change) => {
    summary[change.kind] = (summary[change.kind] || 0) + 1;
    return summary;
  }, {});
}

try {
  const sourceArg = argument('--source');
  if (!sourceArg) throw new Error('缺少 --source <aliyun-cli-or-metadata-repo>');
  const targetRoot = resolve(argument('--target') || join(process.cwd(), 'protocol', 'alicloud-openapi'));
  const { aliyunCliRoot, metadataRoot } = resolveSource(sourceArg);
  const all = process.argv.includes('--all');
  const scope: AlicloudProtocolScope | undefined = all ? { mode: 'full', products: [] } : undefined;
  const result = updateAlicloudProtocol({
    metadataRoot,
    targetRoot,
    scope,
    source: {
      repository: git(metadataRoot, ['config', '--get', 'remote.origin.url']),
      ...(aliyunCliRoot ? { aliyunCliCommit: git(aliyunCliRoot, ['rev-parse', 'HEAD']) } : {}),
      metadataCommit: git(metadataRoot, ['rev-parse', 'HEAD']),
      metadataCommitDate: git(metadataRoot, ['show', '-s', '--format=%cI', 'HEAD'])
    }
  });
  const capabilityIndex = writeAlicloudCapabilityIndex(targetRoot);

  console.log(JSON.stringify({
    ok: true,
    target: targetRoot,
    source: result.manifest.source,
    scope: result.manifest.scope,
    products: result.manifest.products.length,
    apis: result.manifest.products.reduce((total, product) => total + product.apiCount, 0),
    files: result.manifest.content.fileCount,
    treeSha256: result.manifest.content.treeSha256,
    capabilityIndex: capabilityIndex.index.stats,
    changes: summarize(result.changes),
    changeDetails: result.changes.slice(0, 20)
  }, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
}
