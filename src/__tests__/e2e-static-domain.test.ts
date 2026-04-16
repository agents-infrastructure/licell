import { describe, expect, it } from 'vitest';
import {
  assertE2eStaticDeployResult,
  assertE2eStaticDomainBindResult,
  assertE2eStaticStateResult
} from '../commands/e2e';

describe('e2e static domain assertions', () => {
  it('accepts a converged static deploy result', () => {
    expect(() => assertE2eStaticDeployResult({
      command: 'deploy',
      runtime: 'static',
      url: 'https://demo-bucket.oss-cn-hangzhou.aliyuncs.com/index.html',
      fixedDomain: 'demo.example.com',
      healthCheckLogs: [
        '⚠️ OSS 地址可访问性检测未通过: GET https://demo-bucket.oss-cn-hangzhou.aliyuncs.com/index.html 返回 403',
        '✅ 固定域名可访问 (200 https://demo.example.com/)'
      ]
    }, {
      expectedFixedDomain: 'demo.example.com'
    })).not.toThrow();
  });

  it('rejects a static deploy result without fixed-domain success evidence', () => {
    expect(() => assertE2eStaticDeployResult({
      command: 'deploy',
      runtime: 'static',
      url: 'https://demo-bucket.oss-cn-hangzhou.aliyuncs.com/index.html',
      fixedDomain: 'demo.example.com',
      healthCheckLogs: ['⚠️ OSS 地址可访问性检测未通过']
    }, {
      expectedFixedDomain: 'demo.example.com'
    })).toThrow('deploy static 未确认固定域名可访问');
  });

  it('accepts persisted static state after deploy', () => {
    expect(() => assertE2eStaticStateResult({
      command: 'state show',
      state: {
        resources: {
          bucket: {
            name: 'demo-bucket',
            region: 'cn-hangzhou'
          },
          cdn: {
            enabled: true,
            cname: 'demo.example.com.w.kunluncan.com'
          }
        },
        route: {
          url: 'https://demo.example.com',
          domain: 'demo.example.com',
          ssl: true
        }
      }
    }, {
      expectedBucket: 'demo-bucket',
      expectedDomain: 'demo.example.com'
    })).not.toThrow();
  });

  it('accepts the static domain bind result shape', () => {
    expect(() => assertE2eStaticDomainBindResult({
      workflow: 'static',
      domain: 'demo-bind.example.com',
      bucket: 'demo-bucket',
      originDomain: 'demo-bucket.oss-cn-hangzhou.aliyuncs.com',
      cdnCname: 'demo-bind.example.com.w.kunluncan.com',
      ssl: true,
      httpsConfigured: true,
      finalUrl: 'https://demo-bind.example.com'
    }, {
      expectedDomain: 'demo-bind.example.com',
      expectedBucket: 'demo-bucket'
    })).not.toThrow();
  });
});
