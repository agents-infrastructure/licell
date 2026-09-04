export const ALICLOUD_RUNNER_VERSION = '3.4.11';

export interface AlicloudRunnerArtifact {
  platform: 'darwin-x64' | 'darwin-arm64' | 'linux-x64' | 'linux-arm64';
  url: string;
  archiveSha256: string;
  binarySha256: string;
}

export const ALICLOUD_RUNNER_MANIFEST = {
  kind: 'licell-aliyun-cli-runner-manifest',
  schemaVersion: '1.0',
  version: ALICLOUD_RUNNER_VERSION,
  repository: 'https://github.com/aliyun/aliyun-cli',
  commit: 'f54f5fe9caa99723a6324b20eaa60f3de3b049cb',
  metadataCommit: '2563691c22229a0b493606e11166b95896707095',
  artifacts: {
    'darwin-x64': {
      platform: 'darwin-x64',
      url: 'https://aliyuncli.alicdn.com/aliyun-cli-macosx-3.4.11-universal.tgz',
      archiveSha256: '5db234fe636c2c48fec956e50710486a11c7ae91687a8d79c63b756a31b2e0e4',
      binarySha256: '0171171bb7d9e74b312b8e1fab5b4d7df4f67f142b0ee4ea8178fd228301db5f'
    },
    'darwin-arm64': {
      platform: 'darwin-arm64',
      url: 'https://aliyuncli.alicdn.com/aliyun-cli-macosx-3.4.11-universal.tgz',
      archiveSha256: '5db234fe636c2c48fec956e50710486a11c7ae91687a8d79c63b756a31b2e0e4',
      binarySha256: '0171171bb7d9e74b312b8e1fab5b4d7df4f67f142b0ee4ea8178fd228301db5f'
    },
    'linux-x64': {
      platform: 'linux-x64',
      url: 'https://aliyuncli.alicdn.com/aliyun-cli-linux-3.4.11-amd64.tgz',
      archiveSha256: 'a7e3df497db14c10d4d7587795e9fa7849b0c51dfce02908b9de5a41fe717d5c',
      binarySha256: 'bd40a62b5b887363b8dd827753e03812b0f3804988ee35d2c0a654abdda1a06b'
    },
    'linux-arm64': {
      platform: 'linux-arm64',
      url: 'https://aliyuncli.alicdn.com/aliyun-cli-linux-3.4.11-arm64.tgz',
      archiveSha256: 'b0b6f6f7545f9472b697fc27915c8956e5a3320a6160729dcc5b4eff21435ae8',
      binarySha256: '106197dc36899596bad4aad646f064c930b174bb75e031b1a4e74cde78f5e43e'
    }
  } satisfies Record<string, AlicloudRunnerArtifact>
} as const;
