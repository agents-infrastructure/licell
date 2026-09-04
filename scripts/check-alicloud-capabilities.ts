import { join, resolve } from 'node:path';
import { checkAlicloudCapabilityIndex } from '../src/utils/alicloud-capability-generator';

function argument(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const protocolRoot = resolve(argument('--protocol-root') || join(process.cwd(), 'protocol', 'alicloud-openapi'));
const result = checkAlicloudCapabilityIndex(protocolRoot);
console.log(JSON.stringify({
  ok: result.ok,
  path: result.path,
  embeddedPath: result.embeddedPath,
  issues: result.issues
}, null, 2));
if (!result.ok) process.exit(1);
