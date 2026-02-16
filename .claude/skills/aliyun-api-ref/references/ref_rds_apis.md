# 阿里云RDS核心API列表


## 1. 实例管理 (Instance Management)

| API 名称 | 功能描述 | 请求方法 | 关键参数 |
| --- | --- | --- | --- |
| `CreateDBInstance` | 创建一个新的RDS实例 | POST | `Engine`, `EngineVersion`, `DBInstanceClass`, `DBInstanceStorage`, `PayType` |
| `DeleteDBInstance` | 删除一个指定的RDS实例 | POST | `DBInstanceId` |
| `RestartDBInstance` | 重启一个运行中的RDS实例 | POST | `DBInstanceId` |
| `StopDBInstance` | 暂停一个运行中的RDS实例 | POST | `DBInstanceId` |
| `StartDBInstance` | 启动一个已暂停的RDS实例 | POST | `DBInstanceId` |
| `ModifyDBInstanceSpec` | 变更实例的规格，如CPU、内存、存储空间 | POST | `DBInstanceId`, `DBInstanceClass`, `DBInstanceStorage`, `PayType` |
| `DescribeDBInstances` | 查询名下所有或指定RDS实例的详细信息 | POST | `RegionId`, `DBInstanceId`, `Engine` |

## 2. 数据库管理 (Database Management)

| API 名称 | 功能描述 | 请求方法 | 关键参数 |
| --- | --- | --- | --- |
| `CreateDatabase` | 在指定的RDS实例中创建一个新的数据库 | POST | `DBInstanceId`, `DBName`, `CharacterSetName` |
| `DeleteDatabase` | 删除指定的RDS实例中的一个数据库 | POST | `DBInstanceId`, `DBName` |
| `DescribeDatabases` | 查询指定RDS实例中的数据库列表 | POST | `DBInstanceId`, `DBName` |

## 3. 账号管理 (Account Management)

| API 名称 | 功能描述 | 请求方法 | 关键参数 |
| --- | --- | --- | --- |
| `CreateAccount` | 在指定的RDS实例中创建一个新的数据库账号 | POST | `DBInstanceId`, `AccountName`, `AccountPassword` |
| `DeleteAccount` | 删除指定的RDS实例中的一个数据库账号 | POST | `DBInstanceId`, `AccountName` |
| `ResetAccountPassword` | 重置指定数据库账号的密码 | POST | `DBInstanceId`, `AccountName`, `AccountPassword` |
| `GrantAccountPrivilege` | 为指定的数据库账号授予数据库的访问权限 | POST | `DBInstanceId`, `AccountName`, `DBName`, `AccountPrivilege` |
| `DescribeAccounts` | 查询指定RDS实例中的账号列表 | POST | `DBInstanceId`, `AccountName` |

## 4. 网络与安全 (Networking and Security)

| API 名称 | 功能描述 | 请求方法 | 关键参数 |
| --- | --- | --- | --- |
| `AllocateInstancePublicConnection` | 为RDS实例申请一个公网连接地址 | POST | `DBInstanceId`, `ConnectionStringPrefix`, `Port` |
| `ReleaseInstancePublicConnection` | 释放RDS实例的公网连接地址 | POST | `DBInstanceId`, `CurrentConnectionString` |
| `ModifySecurityIps` | 修改RDS实例的IP白名单 | POST | `DBInstanceId`, `SecurityIps`, `ModifyMode` |
| `DescribeDBInstanceIPArrayList` | 查询RDS实例的IP白名单信息 | POST | `DBInstanceId` |

## 5. 备份与恢复 (Backup and Recovery)

| API 名称 | 功能描述 | 请求方法 | 关键参数 |
| --- | --- | --- | --- |
| `CreateBackup` | 对指定的RDS实例发起一次手动的全量或增量备份 | POST | `DBInstanceId`, `BackupType` |
| `DescribeBackups` | 查询指定RDS实例的备份列表 | POST | `DBInstanceId`, `BackupId`, `BackupStatus` |
| `RecoveryDBInstance` | 使用指定的备份集恢复出一个新的RDS实例 | POST | `DBInstanceId`, `BackupId`, `DBInstanceClass`, `DBInstanceStorage` |
| `RestoreTable` | 将指定的库表从备份集恢复到原实例 | POST | `DBInstanceId`, `BackupId`, `TableMeta` |
