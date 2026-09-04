import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ALICLOUD_RUNNER_MANIFEST } from '../src/providers/openapi/runner-manifest';

const root = process.cwd();
const protocol = JSON.parse(readFileSync(join(root, 'protocol', 'alicloud-openapi', 'manifest.json'), 'utf8')) as {
  source?: { aliyunCliCommit?: string; metadataCommit?: string };
};
const issues: string[] = [];
const expectedPlatforms = ['darwin-arm64', 'darwin-x64', 'linux-arm64', 'linux-x64'];

if (protocol.source?.metadataCommit !== ALICLOUD_RUNNER_MANIFEST.metadataCommit) {
  issues.push(`runner metadata commit ${ALICLOUD_RUNNER_MANIFEST.metadataCommit} != protocol metadata commit ${protocol.source?.metadataCommit || '<missing>'}`);
}

const platforms = Object.keys(ALICLOUD_RUNNER_MANIFEST.artifacts).sort();
if (JSON.stringify(platforms) !== JSON.stringify(expectedPlatforms)) {
  issues.push(`runner platforms must be ${expectedPlatforms.join(', ')}`);
}

for (const [platform, artifact] of Object.entries(ALICLOUD_RUNNER_MANIFEST.artifacts)) {
  if (artifact.platform !== platform) issues.push(`${platform}: artifact.platform mismatch`);
  if (!artifact.url.startsWith('https://aliyuncli.alicdn.com/')) issues.push(`${platform}: URL must use the official aliyun CLI CDN`);
  if (!artifact.url.includes(`-${ALICLOUD_RUNNER_MANIFEST.version}-`)) issues.push(`${platform}: URL does not pin version ${ALICLOUD_RUNNER_MANIFEST.version}`);
  if (!/^[0-9a-f]{64}$/.test(artifact.archiveSha256)) issues.push(`${platform}: invalid archive SHA-256`);
  if (!/^[0-9a-f]{64}$/.test(artifact.binarySha256)) issues.push(`${platform}: invalid binary SHA-256`);
}

if (issues.length > 0) {
  console.error(JSON.stringify({ ok: false, issues }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  version: ALICLOUD_RUNNER_MANIFEST.version,
  commit: ALICLOUD_RUNNER_MANIFEST.commit,
  metadataCommit: ALICLOUD_RUNNER_MANIFEST.metadataCommit,
  platforms
}, null, 2));
