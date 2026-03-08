function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizePreviewDomainInput(value: string, label: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) throw new Error(`${label} 不能为空`);
  return normalized;
}

export function buildPreviewDomain(appName: string, versionId: string | number, domainSuffix: string) {
  const normalizedAppName = normalizePreviewDomainInput(appName, 'appName');
  const normalizedVersionId = String(versionId).trim();
  if (!normalizedVersionId) throw new Error('versionId 不能为空');
  const normalizedDomainSuffix = normalizePreviewDomainInput(domainSuffix, 'domainSuffix');
  return `${normalizedAppName}-preview-v${normalizedVersionId}.${normalizedDomainSuffix}`;
}

export function extractPreviewVersionFromDomain(domain: string, appName: string): number | null {
  const normalizedDomain = normalizePreviewDomainInput(domain, 'domain');
  const normalizedAppName = normalizePreviewDomainInput(appName, 'appName');
  const match = normalizedDomain.match(new RegExp(`^${escapeRegex(normalizedAppName)}-preview-v(\\d+)\\.`));
  if (!match) return null;
  return parseInt(match[1], 10);
}
