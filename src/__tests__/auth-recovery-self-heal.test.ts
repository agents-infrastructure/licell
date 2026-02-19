import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../providers/ram', () => ({
  repairLicellRamAccess: vi.fn()
}));

vi.mock('../utils/config', () => ({
  DEFAULT_ALI_REGION: 'cn-hangzhou',
  Config: {
    getAuth: vi.fn(),
    setAuth: vi.fn()
  }
}));

vi.mock('@clack/prompts', () => ({
  confirm: vi.fn(async () => true),
  isCancel: vi.fn(() => false),
  password: vi.fn(async () => { throw new Error('password prompt should not be called in this test'); }),
  text: vi.fn(async () => { throw new Error('text prompt should not be called in this test'); })
}));

import { repairLicellRamAccess } from '../providers/ram';
import { Config } from '../utils/config';
import { runAuthRepairFlow } from '../utils/auth-recovery';

const mockRepairLicellRamAccess = repairLicellRamAccess as unknown as ReturnType<typeof vi.fn>;
const mockGetAuth = Config.getAuth as unknown as ReturnType<typeof vi.fn>;
const mockSetAuth = Config.setAuth as unknown as ReturnType<typeof vi.fn>;

const CURRENT_AUTH = {
  accountId: '1234567890',
  ak: 'LTAI-CURRENT',
  sk: 'CURRENT-SECRET',
  region: 'cn-hangzhou',
  authSource: 'manual' as const
};

describe('runAuthRepairFlow self-heal', () => {
  beforeEach(() => {
    mockRepairLicellRamAccess.mockReset();
    mockGetAuth.mockReset();
    mockSetAuth.mockReset();
    mockGetAuth.mockReturnValue(CURRENT_AUTH);
  });

  it('repairs silently with current auth key before asking for admin key', async () => {
    mockRepairLicellRamAccess.mockResolvedValue({
      mode: 'updated-existing-key',
      userName: 'licell-operator',
      policyName: 'LicellOperatorPolicy',
      accessKeyId: CURRENT_AUTH.ak,
      accessKeySecret: CURRENT_AUTH.sk
    });

    const result = await runAuthRepairFlow({
      commandLabel: 'licell deploy',
      reason: 'manual',
      interactiveTTY: false,
      currentAuth: CURRENT_AUTH
    });

    expect(mockRepairLicellRamAccess).toHaveBeenCalledTimes(1);
    expect(mockRepairLicellRamAccess).toHaveBeenCalledWith({
      adminAuth: {
        accountId: CURRENT_AUTH.accountId,
        ak: CURRENT_AUTH.ak,
        sk: CURRENT_AUTH.sk,
        region: CURRENT_AUTH.region
      },
      currentAuth: CURRENT_AUTH,
      userName: undefined,
      policyName: undefined,
      forceRotateKey: false
    });
    expect(mockSetAuth).toHaveBeenCalledWith({
      accountId: CURRENT_AUTH.accountId,
      ak: CURRENT_AUTH.ak,
      sk: CURRENT_AUTH.sk,
      region: CURRENT_AUTH.region,
      authSource: 'bootstrap',
      ramUser: 'licell-operator',
      ramPolicy: 'LicellOperatorPolicy'
    });
    expect(result.mode).toBe('updated-existing-key');
  });

  it('falls back to explicit super key when self-heal lacks permission', async () => {
    mockRepairLicellRamAccess
      .mockRejectedValueOnce({ code: 'AccessDenied', message: 'forbidden' })
      .mockResolvedValueOnce({
        mode: 'rotated-new-key',
        userName: 'licell-operator',
        policyName: 'LicellOperatorPolicy',
        accessKeyId: 'LTAI-NEW',
        accessKeySecret: 'NEW-SECRET'
      });

    const result = await runAuthRepairFlow({
      commandLabel: 'licell deploy',
      reason: 'manual',
      interactiveTTY: false,
      currentAuth: CURRENT_AUTH,
      accountId: '1234567890',
      adminAk: 'LTAI-SUPER',
      adminSk: 'SUPER-SECRET',
      region: 'cn-hangzhou'
    });

    expect(mockRepairLicellRamAccess).toHaveBeenCalledTimes(2);
    expect(mockRepairLicellRamAccess).toHaveBeenNthCalledWith(2, {
      adminAuth: {
        accountId: '1234567890',
        ak: 'LTAI-SUPER',
        sk: 'SUPER-SECRET',
        region: 'cn-hangzhou'
      },
      currentAuth: CURRENT_AUTH,
      userName: undefined,
      policyName: undefined,
      forceRotateKey: false
    });
    expect(mockSetAuth).toHaveBeenCalledWith({
      accountId: '1234567890',
      ak: 'LTAI-NEW',
      sk: 'NEW-SECRET',
      region: 'cn-hangzhou',
      authSource: 'bootstrap',
      ramUser: 'licell-operator',
      ramPolicy: 'LicellOperatorPolicy'
    });
    expect(result.mode).toBe('rotated-new-key');
  });

  it('throws non-interactive guidance when self-heal fails and no super key is provided', async () => {
    mockRepairLicellRamAccess.mockRejectedValue({ code: 'AccessDenied', message: 'not authorized' });

    await expect(runAuthRepairFlow({
      commandLabel: 'licell deploy',
      reason: 'access_denied',
      interactiveTTY: false,
      currentAuth: CURRENT_AUTH
    })).rejects.toThrow('请先执行 `licell auth repair --account-id <id> --ak <super-ak> --sk <super-sk> [--region cn-hangzhou]`');

    expect(mockRepairLicellRamAccess).toHaveBeenCalledTimes(1);
  });
});
