# Database Management

Database CRUD, character set, and collation management.

## createDatabase

**Signature:** `createDatabase(request: CreateDatabaseRequest)`

### Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB ### References > Before you call this operation, read the following documentation and make sure that you fully unders.

**Parameters:** (3 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `characterSetName` | string | Yes | The character set. Example: `gbk` |
| `DBDescription` | string | No | The description of the database. The description must be 2 to 256 characters in length and can conta Example: `Database` |
| `DBInstanceId` | string | Yes | The instance ID. You can call the [DescribeDBInstances](https://help.aliyun.com/document_detail/6103 Example: `rm-uf6wjk5xxxxxxxxxx` |
| `DBName` | string | Yes | The name of the database. Example: `rds_mysql` |

## deleteDatabase

**Signature:** `deleteDatabase(request: DeleteDatabaseRequest)`

### [](#)Supported database engines *   RDS MySQL *   RDS PostgreSQL *   RDS SQL Server *   RDS MariaDB ### [](#)References > : Before you call this operation, read the following documentation and mak.

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-uf6wjk5*****` |
| `DBName` | string | Yes | The name of the database. Example: `testdb01` |

## describeDatabases

**Signature:** `describeDatabases(request: DescribeDatabasesRequest)`

### Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB.

**Parameters:** (1 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-uf6wjk5****` |
| `DBName` | string | No | The name of the database. Example: `testDB01` |
| `DBStatus` | string | No | The status of the database. Valid values: Example: `Creating` |
| `pageNumber` | number | No | The page number. Pages start from 1. Example: `1` |
| `pageSize` | number | No | The number of entries to return per page. Valid values: Example: `30` |

## modifyDBDescription

**Signature:** `modifyDBDescription(request: ModifyDBDescriptionRequest)`

### [](#)Supported database engines *   RDS MySQL *   RDS PostgreSQL *   RDS SQL Server *   RDS MariaDB.

**Parameters:** See `ModifyDBDescriptionRequest` model.

## copyDatabase

**Signature:** `copyDatabase(request: CopyDatabaseRequest)`

This operation is phased out..

**Parameters:** (0 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceName` | string | No | The instance name. Example: `rm-uf6wjk5******` |
| `dstDBName` | string | No | The destination database name. Example: `db2***` |
| `reserveAccount` | number | No | The reserved account. Example: `1` |
| `resourceGroupId` | string | No | The ID of the resource group. Example: `rg-acfmy*****` |
| `srcDBName` | string | No | The source database name. Example: `db1***` |

## copyDatabaseBetweenInstances

**Signature:** `copyDatabaseBetweenInstances(request: CopyDatabaseBetweenInstancesRequest)`

### Supported database engines RDS SQL Server ### References > : Before you call this operation, read the following documentation and make sure that you fully understand the prerequisites and impacts .

**Parameters:** (3 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `backupId` | string | No | The ID of the backup set based on which you want to restore databases of the source instance. When y Example: `106523874****` |
| `DBInstanceId` | string | Yes | The source instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-uf6wjk5xxxxxxx` |
| `dbNames` | string | Yes | The names of the databases that you want to copy. Format: `Source database name 1,Source database na Example: `{"test1":"newtest1","test2":"newtest2"}` |
| `restoreTime` | string | No | The point in time when the system replicates databases. You can select a point in time within the ba Example: `2011-06-11T16:00:00Z` |
| `syncUserPrivilege` | string | No | Specifies whether to copy users and permissions. Example: `NO` |
| `targetDBInstanceId` | string | Yes | The destination instance ID. You can call the DescribeDBInstances operation to query the instance ID Example: `rm-ut5ajk3xxxxxxx` |

## describeCollationTimeZones

**Signature:** `describeCollationTimeZones(request: DescribeCollationTimeZonesRequest)`

### Supported database engine SQL Server.

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerId` | number | No | - |

## describeCharacterSetName

**Signature:** `describeCharacterSetName(request: DescribeCharacterSetNameRequest)`

### Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `engine` | string | Yes | The type of the database engine. Valid values: Example: `mysql` |
| `regionId` | string | Yes | The region ID. You can call the DescribeRegions operation to query the most recent region list. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The resource group ID. You can call the DescribeDBInstanceAttribute operation to query the resource  Example: `rg-acfmy*****` |


## checkDBNameAvailable

**Signature:** `checkDBNameAvailable(request: CheckDBNameAvailableRequest)`

### [](#)Supported database engines *   RDS MySQL *   RDS PostgreSQL *   RDS SQL Server *   RDS MariaDB.


## modifyDatabaseConfig

**Signature:** `modifyDatabaseConfig(request: ModifyDatabaseConfigRequest)`

### [](#)Supported database engine *   SQL Server ### [](#)References You can call this operation to modify the database properties of an ApsaraDB RDS for SQL Server instance and archive data from an .

**Parameters:** (4 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceId` | string | Yes | The instance ID. Example: `rm-t4nnu1my39qr8****` |
| `DBName` | string | Yes | The database name. Example: `testDB` |
| `databasePropertyName` | string | Yes | The database property that you want to modify. Example: `compatibility_level` |
| `databasePropertyValue` | string | Yes | The value of the database property that you want to modify. Example: `150` |

