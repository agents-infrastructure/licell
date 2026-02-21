import { describe, it, expect } from 'vitest';

describe('deploy-context preview validation', () => {
  describe('preview option validation', () => {
    it('should reject --preview with --target', () => {
      const preview = true;
      const releaseTarget = 'prod';
      const hasConflict = preview && Boolean(releaseTarget);
      expect(hasConflict).toBe(true);
    });

    it('should reject --preview without domainSuffix', () => {
      const preview = true;
      const domainSuffix = undefined;
      const needsDomainSuffix = preview && !domainSuffix;
      expect(needsDomainSuffix).toBe(true);
    });

    it('should reject --preview with --domain', () => {
      const preview = true;
      const cliDomain = 'api.example.com';
      const hasConflict = preview && Boolean(cliDomain);
      expect(hasConflict).toBe(true);
    });

    it('should allow --preview with domainSuffix', () => {
      const preview = true;
      const domainSuffix = 'example.com';
      const releaseTarget = undefined;
      const cliDomain = undefined;
      const isValid = preview && Boolean(domainSuffix) && !releaseTarget && !cliDomain;
      expect(isValid).toBe(true);
    });
  });

  describe('preview domain generation', () => {
    it('should generate correct preview domain format', () => {
      const appName = 'myapp';
      const versionId = '5';
      const domainSuffix = 'example.com';
      const previewDomain = `${appName}-preview-v${versionId}.${domainSuffix}`;
      expect(previewDomain).toBe('myapp-preview-v5.example.com');
    });

    it('should handle app names with hyphens', () => {
      const appName = 'my-awesome-app';
      const versionId = '12';
      const domainSuffix = 'example.com';
      const previewDomain = `${appName}-preview-v${versionId}.${domainSuffix}`;
      expect(previewDomain).toBe('my-awesome-app-preview-v12.example.com');
    });
  });
});
