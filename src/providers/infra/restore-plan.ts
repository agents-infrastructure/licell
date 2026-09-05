import Rds, * as $Rds from '@alicloud/rds20140815';
import { formatErrorMessage } from '../../utils/errors';
import { createRdsClient } from './client';

export interface DatabaseRestorePlanOptions {
  regionId?: string;
  backupId?: string;
  restoreTime?: string;
  days?: number;
  payType?: string;
}

type DatabaseRestorePlanClient = Pick<
  Rds,
  'describeDBInstanceAttribute' | 'describeBackups' | 'describeLocalAvailableRecoveryTime'
>;

const PITR_ENGINES = new Set(['mysql', 'postgresql', 'mariadb']);

function requiredId(value: string) {
  const normalized = value.trim();
  if (!normalized) throw new Error('instanceId 不能为空');
  return normalized;
}

function rdsMinuteTimestamp(value: Date) {
  return `${value.toISOString().slice(0, 16)}Z`;
}

function normalizeRestoreTime(value: string | undefined) {
  const normalized = value?.trim();
  if (!normalized) return undefined;
  const parsed = Date.parse(normalized);
  if (!Number.isFinite(parsed)) throw new Error('restore-time 无效：请使用 ISO 8601 UTC 时间，例如 2026-09-01T08:00:00Z');
  return new Date(parsed).toISOString().replace('.000Z', 'Z');
}

function normalizePayType(value: string | undefined) {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return 'Postpaid';
  if (normalized === 'postpaid') return 'Postpaid';
  if (normalized === 'prepaid') return 'Prepaid';
  throw new Error('pay-type 无效：只支持 Postpaid 或 Prepaid');
}

function safeDays(value: number | undefined) {
  return Math.max(1, Math.min(Math.floor(value || 30), 365));
}

function parseTime(value: string | undefined) {
  if (!value) return undefined;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function planDatabaseRestore(
  instanceId: string,
  options: DatabaseRestorePlanOptions = {},
  injected?: DatabaseRestorePlanClient
) {
  const id = requiredId(instanceId);
  const backupId = options.backupId?.trim() || undefined;
  const restoreTime = normalizeRestoreTime(options.restoreTime);
  if (backupId && restoreTime) throw new Error('backup-id 与 restore-time 不能同时使用');

  const days = safeDays(options.days);
  const payType = normalizePayType(options.payType);
  const resolved = injected
    ? { client: injected, regionId: options.regionId?.trim() || 'injected' }
    : createRdsClient(options.regionId);
  const { client, regionId } = resolved;

  const attributeResponse = await client.describeDBInstanceAttribute(
    new $Rds.DescribeDBInstanceAttributeRequest({ DBInstanceId: id })
  );
  const attributes = attributeResponse.body?.items?.DBInstanceAttribute || [];
  const source = attributes.find((item) => item.DBInstanceId === id) || attributes[0];
  if (!source?.DBInstanceId) throw new Error(`未找到数据库实例: ${id}（region=${regionId}）`);

  const now = new Date();
  const backupRequest = backupId
    ? new $Rds.DescribeBackupsRequest({ DBInstanceId: id, backupId, pageNumber: 1, pageSize: 30 })
    : new $Rds.DescribeBackupsRequest({
      DBInstanceId: id,
      startTime: rdsMinuteTimestamp(new Date(now.getTime() - days * 86_400_000)),
      endTime: rdsMinuteTimestamp(now),
      backupStatus: 'Success',
      pageNumber: 1,
      pageSize: 30
    });
  const backupResponse = await client.describeBackups(backupRequest);
  const backupRows = backupResponse.body?.items?.backup || [];
  const parsedBackupTotal = Number(backupResponse.body?.totalRecordCount);
  const backupTotalCount = Number.isFinite(parsedBackupTotal) ? parsedBackupTotal : undefined;
  const backups = backupRows.map((item) => ({
    backupId: item.backupId,
    status: item.backupStatus,
    type: item.backupType,
    mode: item.backupMode,
    method: item.backupMethod,
    sizeBytes: item.backupSize,
    startTime: item.backupStartTime,
    endTime: item.backupEndTime,
    storageClass: item.storageClass
  }));

  const engine = source.engine || '';
  const pitrSupported = PITR_ENGINES.has(engine.toLowerCase());
  let pitr: { supported: boolean; available: boolean; beginTime?: string; endTime?: string; reason?: string } = {
    supported: pitrSupported,
    available: false,
    ...(!pitrSupported ? { reason: `${engine || '当前引擎'} 不在 DescribeLocalAvailableRecoveryTime 的已知支持范围内` } : {})
  };
  if (pitrSupported) {
    try {
      const response = await client.describeLocalAvailableRecoveryTime(
        new $Rds.DescribeLocalAvailableRecoveryTimeRequest({ DBInstanceId: id, region: regionId })
      );
      pitr = {
        supported: true,
        available: Boolean(response.body?.recoveryBeginTime && response.body?.recoveryEndTime),
        beginTime: response.body?.recoveryBeginTime,
        endTime: response.body?.recoveryEndTime
      };
    } catch (error: unknown) {
      if (restoreTime) throw error;
      pitr = { supported: true, available: false, reason: formatErrorMessage(error) };
    }
  }

  const mode = backupId ? 'backup-set' : restoreTime ? 'point-in-time' : 'inspect';
  const blockers: Array<{ code: string; message: string }> = [];
  const warnings: Array<{ code: string; message: string }> = [];

  if (mode === 'inspect') {
    blockers.push({ code: 'RESTORE_SOURCE_REQUIRED', message: '请选择 --backup-id 或 --restore-time 后重新生成计划。' });
  }
  if (backupId) {
    const selected = backups.find((item) => item.backupId === backupId);
    if (!selected) blockers.push({ code: 'BACKUP_NOT_FOUND', message: `实例 ${id} 中未找到备份集 ${backupId}。` });
    else if ((selected.status || '').toLowerCase() !== 'success') {
      blockers.push({ code: 'BACKUP_NOT_READY', message: `备份集 ${backupId} 状态为 ${selected.status || 'unknown'}，不可用于恢复。` });
    }
  }
  if (restoreTime) {
    if (!pitr.supported) blockers.push({ code: 'PITR_UNSUPPORTED', message: pitr.reason || '当前引擎不支持本地时间点恢复检查。' });
    else if (!pitr.available) blockers.push({ code: 'PITR_WINDOW_UNAVAILABLE', message: pitr.reason || '未获取到可恢复时间窗口。' });
    else {
      const requested = parseTime(restoreTime)!;
      const begin = parseTime(pitr.beginTime);
      const end = parseTime(pitr.endTime);
      if (begin === undefined || end === undefined || requested < begin || requested > end) {
        blockers.push({
          code: 'RESTORE_TIME_OUT_OF_RANGE',
          message: `恢复时间 ${restoreTime} 不在可用窗口 ${pitr.beginTime || '?'} ~ ${pitr.endTime || '?'} 内。`
        });
      }
    }
  }
  if ((source.DBInstanceStatus || '').toLowerCase() !== 'running') {
    warnings.push({ code: 'SOURCE_NOT_RUNNING', message: `源实例状态为 ${source.DBInstanceStatus || 'unknown'}，执行恢复前需再次确认云端前置条件。` });
  }
  if (!options.payType?.trim()) {
    warnings.push({ code: 'PAY_TYPE_DEFAULTED', message: '目标计费方式未指定，请求草案使用 Postpaid。' });
  }
  if (pitr.supported && !pitr.available && !restoreTime) {
    warnings.push({ code: 'PITR_WINDOW_UNAVAILABLE', message: pitr.reason || '未获取到可恢复时间窗口。' });
  }

  const requestDraft = mode === 'inspect' ? null : {
    DBInstanceId: id,
    RegionId: regionId,
    PayType: payType,
    ...(backupId ? { BackupId: backupId } : {}),
    ...(restoreTime ? { RestoreTime: restoreTime } : {})
  };

  return {
    instanceId: id,
    regionId,
    operation: 'rds.CloneDBInstance',
    mode,
    source: {
      instanceId: source.DBInstanceId,
      description: source.DBInstanceDescription,
      engine: source.engine,
      engineVersion: source.engineVersion,
      status: source.DBInstanceStatus,
      category: source.category,
      instanceClass: source.DBInstanceClass,
      storageGb: source.DBInstanceStorage,
      storageType: source.DBInstanceStorageType,
      zoneId: source.zoneId,
      vpcId: source.vpcId,
      vSwitchId: source.vSwitchId
    },
    availability: {
      days,
      backupCount: backups.length,
      backupTotalCount,
      backupsTruncated: backupTotalCount !== undefined ? backups.length < backupTotalCount : backups.length >= 30,
      backups,
      pitr
    },
    selection: backupId
      ? { type: 'backup-set', backupId }
      : restoreTime
        ? { type: 'point-in-time', restoreTime }
        : null,
    requestDraft,
    validation: { valid: blockers.length === 0, blockers, warnings },
    execution: {
      supported: false,
      performed: false,
      reason: '当前命令只读取恢复条件并生成计划，不调用 CloneDBInstance。'
    }
  };
}
