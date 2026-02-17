import { describe, expect, it } from 'vitest';
import { buildImageUri, formatTimestampTag, normalizeAcrNamespace, type AcrInfo } from '../providers/cr';

describe('acr utilities', () => {
  const enterpriseAcr: AcrInfo = {
    instanceId: 'cri-test123',
    registryEndpoint: 'myinst-registry.cn-hangzhou.cr.aliyuncs.com',
    vpcRegistryEndpoint: 'myinst-registry-vpc.cn-hangzhou.cr.aliyuncs.com',
    namespace: 'licell',
    repoName: 'my-app'
  };

  const personalAcr: AcrInfo = {
    instanceId: null,
    registryEndpoint: 'registry.cn-hangzhou.aliyuncs.com',
    vpcRegistryEndpoint: 'registry-vpc.cn-hangzhou.aliyuncs.com',
    namespace: 'licell',
    repoName: 'my-app'
  };

  describe('buildImageUri', () => {
    it('builds public URI for enterprise ACR', () => {
      expect(buildImageUri(enterpriseAcr, '20260217-120000')).toBe(
        'myinst-registry.cn-hangzhou.cr.aliyuncs.com/licell/my-app:20260217-120000'
      );
    });

    it('builds VPC URI for enterprise ACR', () => {
      expect(buildImageUri(enterpriseAcr, '20260217-120000', true)).toBe(
        'myinst-registry-vpc.cn-hangzhou.cr.aliyuncs.com/licell/my-app:20260217-120000'
      );
    });

    it('builds public URI for personal ACR', () => {
      expect(buildImageUri(personalAcr, 'latest')).toBe(
        'registry.cn-hangzhou.aliyuncs.com/licell/my-app:latest'
      );
    });

    it('builds VPC URI for personal ACR', () => {
      expect(buildImageUri(personalAcr, 'latest', true)).toBe(
        'registry-vpc.cn-hangzhou.aliyuncs.com/licell/my-app:latest'
      );
    });
  });

  describe('formatTimestampTag', () => {
    it('returns YYYYMMDD-HHmmss format', () => {
      const tag = formatTimestampTag();
      expect(tag).toMatch(/^\d{8}-\d{6}$/);
    });

    it('returns consistent length', () => {
      expect(formatTimestampTag()).toHaveLength(15);
    });
  });

  describe('normalizeAcrNamespace', () => {
    it('normalizes case and whitespace', () => {
      expect(normalizeAcrNamespace('  Team_A-1  ')).toBe('team_a-1');
    });

    it('accepts dot as delimiter when not at boundaries', () => {
      expect(normalizeAcrNamespace('team.core')).toBe('team.core');
    });

    it('rejects empty namespace', () => {
      expect(() => normalizeAcrNamespace('   ')).toThrow('不能为空');
    });

    it('rejects namespace shorter than 2 chars', () => {
      expect(() => normalizeAcrNamespace('a')).toThrow('长度需在 2-120 之间');
    });

    it('rejects namespace with invalid characters', () => {
      expect(() => normalizeAcrNamespace('team/ops')).toThrow('仅支持小写字母、数字、点、短横线、下划线');
    });

    it('rejects namespace with separator at boundaries', () => {
      expect(() => normalizeAcrNamespace('-team')).toThrow('分隔符不能在首尾');
      expect(() => normalizeAcrNamespace('team-')).toThrow('分隔符不能在首尾');
    });
  });
});
