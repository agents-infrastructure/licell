import { parse } from 'tldts';

export interface ParsedDomain {
  rootDomain: string;
  subDomain: string;
}

export function parseRootAndSubdomain(input: string): ParsedDomain {
  const domainName = input.trim().toLowerCase();
  const parsed = parse(domainName);
  if (!parsed.domain) {
    throw new Error(`无效域名: ${input}`);
  }
  const rootDomain = parsed.domain;
  const subDomain = parsed.subdomain || '@';
  return { rootDomain, subDomain };
}
