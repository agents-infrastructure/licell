/**
 * Unified Alibaba Cloud API error classification utilities.
 * Consolidates error detection patterns previously scattered across 8+ files.
 */

function extractErrorText(err: unknown): string {
  if (typeof err !== 'object' || err === null) return '';
  const code = String((err as { code?: unknown }).code || '');
  const message = String((err as { message?: unknown }).message || '');
  return `${code} ${message}`;
}

function matchesAny(text: string, patterns: string[]): boolean {
  const lower = text.toLowerCase();
  return patterns.some((p) => lower.includes(p));
}

export function isConflictError(err: unknown): boolean {
  return matchesAny(extractErrorText(err), [
    'alreadyexist', 'alreadyexists', 'entityalreadyexists', 'already exists', 'conflict', 'duplicate', 'domainrecordduplicate'
  ]);
}

export function isNotFoundError(err: unknown): boolean {
  return matchesAny(extractErrorText(err), [
    'notfound', 'no such', '404', 'entitynotexist', 'not exist'
  ]);
}

export function isTransientError(err: unknown): boolean {
  return matchesAny(extractErrorText(err), [
    'throttling', 'too many requests', 'connecttimeout', 'readtimeout',
    'requesttimeouterror', 'socket disconnected', 'econnreset',
    'econnrefused', 'service unavailable', 'internal error'
  ]);
}

export function isInstanceClassError(err: unknown): boolean {
  return matchesAny(extractErrorText(err), [
    'instanceclass', 'soldout', 'outofstock', 'invalidparameter',
    'not support', 'unsupported'
  ]);
}

export function isAccessDeniedError(err: unknown): boolean {
  return matchesAny(extractErrorText(err), [
    'accessdenied', 'forbidden', 'no permission'
  ]);
}

export function isAuthCredentialInvalidError(err: unknown): boolean {
  return matchesAny(extractErrorText(err), [
    'invalidaccesskeyid',
    'invalidaccesskeyid.notfound',
    'signaturedoesnotmatch',
    'incompletesignature',
    'authenticationfailed',
    'invalidsecuritytoken',
    'security token is invalid',
    'access key id does not exist',
    'accesskey secret not found'
  ]);
}

export function isInvalidDomainNameError(err: unknown): boolean {
  return matchesAny(extractErrorText(err), [
    'invaliddomainname.format', 'invaliddomainname.noexist', 'invalid domain name', 'domain name does not exist'
  ]);
}

export function isRoleMissingError(err: unknown): boolean {
  return matchesAny(extractErrorText(err), ['servicelinkedrole.notexist']);
}

export function isAlreadyExistsRoleError(err: unknown): boolean {
  return matchesAny(extractErrorText(err), ['entityalreadyexists.role', 'already exists']);
}

export function isCidrConflictError(err: unknown): boolean {
  const text = extractErrorText(err).toLowerCase();
  return text.includes('cidr') && (text.includes('conflict') || text.includes('overlap') || text.includes('invalid'));
}
