import { join, resolve } from 'node:path';
import { writeAlicloudCapabilityIndex } from '../src/utils/alicloud-capability-generator';

function argument(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

try {
  const protocolRoot = resolve(argument('--protocol-root') || join(process.cwd(), 'protocol', 'alicloud-openapi'));
  const result = writeAlicloudCapabilityIndex(protocolRoot);
  console.log(JSON.stringify({
    ok: true,
    updated: result.updated,
    path: result.path,
    embeddedPath: result.embeddedPath,
    indexUpdated: result.indexUpdated,
    embeddedUpdated: result.embeddedUpdated,
    kind: result.index.kind,
    schemaVersion: result.index.schemaVersion,
    source: result.index.source,
    stats: result.index.stats
  }, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
}
