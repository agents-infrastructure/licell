import { describe, expect, it } from 'vitest';
import { buildPreviewDomain, extractPreviewVersionFromDomain } from '../utils/preview-domain';

describe('preview domain helpers', () => {
  it('builds preview domain from app/version/suffix', () => {
    expect(buildPreviewDomain('myapp', 5, 'example.com')).toBe('myapp-preview-v5.example.com');
    expect(buildPreviewDomain(' my-app ', '12', ' Example.COM ')).toBe('my-app-preview-v12.example.com');
  });

  it('extracts version number from valid preview domain', () => {
    expect(extractPreviewVersionFromDomain('myapp-preview-v5.example.com', 'myapp')).toBe(5);
    expect(extractPreviewVersionFromDomain('myapp-preview-v123.example.com', 'myapp')).toBe(123);
  });

  it('returns null for non-preview domains', () => {
    expect(extractPreviewVersionFromDomain('myapp.example.com', 'myapp')).toBeNull();
    expect(extractPreviewVersionFromDomain('other-preview-v5.example.com', 'myapp')).toBeNull();
  });

  it('handles app names with hyphens', () => {
    expect(extractPreviewVersionFromDomain('my-app-preview-v10.example.com', 'my-app')).toBe(10);
  });

  it('returns null for malformed preview domains', () => {
    expect(extractPreviewVersionFromDomain('myapp-preview-vABC.example.com', 'myapp')).toBeNull();
    expect(extractPreviewVersionFromDomain('myapp-preview-.example.com', 'myapp')).toBeNull();
  });
});
