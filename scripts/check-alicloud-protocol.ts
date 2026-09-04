import { join, resolve } from 'node:path';
import { checkAlicloudProtocol } from '../src/utils/alicloud-protocol';

function argument(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const targetRoot = resolve(argument('--target') || join(process.cwd(), 'protocol', 'alicloud-openapi'));
const result = checkAlicloudProtocol(targetRoot);

if (!result.ok) {
  console.error(JSON.stringify({ ok: false, target: targetRoot, issues: result.issues }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  target: targetRoot,
  source: result.manifest?.source,
  scope: result.manifest?.scope,
  products: result.manifest?.products.length,
  apis: result.manifest?.products.reduce((total, product) => total + product.apiCount, 0),
  files: result.manifest?.content.fileCount,
  treeSha256: result.manifest?.content.treeSha256
}, null, 2));
