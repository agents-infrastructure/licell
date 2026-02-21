import { describe, it, expect } from 'vitest';

describe('preview-cleanup', () => {
  describe('extractVersionFromPreviewDomain', () => {
    function extractVersionFromPreviewDomain(domain: string, appName: string): number | null {
      const match = domain.match(new RegExp(`^${appName}-preview-v(\\d+)\\.`));
      if (!match) return null;
      return parseInt(match[1], 10);
    }

    it('should extract version number from valid preview domain', () => {
      expect(extractVersionFromPreviewDomain('myapp-preview-v5.example.com', 'myapp')).toBe(5);
      expect(extractVersionFromPreviewDomain('myapp-preview-v123.example.com', 'myapp')).toBe(123);
    });

    it('should return null for non-preview domains', () => {
      expect(extractVersionFromPreviewDomain('myapp.example.com', 'myapp')).toBeNull();
      expect(extractVersionFromPreviewDomain('other-preview-v5.example.com', 'myapp')).toBeNull();
    });

    it('should handle app names with hyphens', () => {
      expect(extractVersionFromPreviewDomain('my-app-preview-v10.example.com', 'my-app')).toBe(10);
    });

    it('should return null for malformed preview domains', () => {
      expect(extractVersionFromPreviewDomain('myapp-preview-vABC.example.com', 'myapp')).toBeNull();
      expect(extractVersionFromPreviewDomain('myapp-preview-.example.com', 'myapp')).toBeNull();
    });
  });
});
