import { describe, it, expect } from 'vitest';
import { resolveStaticProxyFunctionName } from '../providers/fc/static-proxy';

describe('static-proxy', () => {
  describe('resolveStaticProxyFunctionName', () => {
    it('should append -static-proxy suffix to app name', () => {
      expect(resolveStaticProxyFunctionName('myapp')).toBe('myapp-static-proxy');
    });

    it('should handle app names with hyphens', () => {
      expect(resolveStaticProxyFunctionName('my-awesome-app')).toBe('my-awesome-app-static-proxy');
    });

    it('should handle single character app names', () => {
      expect(resolveStaticProxyFunctionName('a')).toBe('a-static-proxy');
    });
  });
});
