# Account Management

Database account CRUD, password management, and privilege control.

## createAccount

**Signature:** `createAccount(request: CreateAccountRequest)`

### Supported database engines *   RDS MySQL *   RDS PostgreSQL *   RDS SQL Server *   RDS MariaDB ### References > : Before you call this operation, read the following documentation and make sure tha.

**Parameters:** (3 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accountDescription` | string | No | The description of the account. The value must be 2 to 256 characters in length. The value can conta Example: `Test` |
| `accountName` | string | Yes | The name of the database account. Example: `test1` |
| `accountPassword` | string | Yes | The password of the account. Example: `Test123456` |
| `accountType` | string | No | The account type. Valid values: Example: `Normal` |
| `checkPolicy` | boolean | No | Specifies whether to use a password policy. Example: `true` |
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-uf6wjk5xxxxxxx` |

## deleteAccount

**Signature:** `deleteAccount(request: DeleteAccountRequest)`

### Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB ### References > Before you call this operation, read the following documentation and make sure that you fully unders.

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accountName` | string | Yes | The name of the account. Example: `test1` |
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-uf6wjk5****` |

## describeAccounts

**Signature:** `describeAccounts(request: DescribeAccountsRequest)`

### [](#)Supported database engines *   RDS MySQL *   RDS PostgreSQL *   RDS SQL Server *   RDS MariaDB.

**Parameters:** (1 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accountName` | string | No | The name of the database account. Example: `test1` |
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-uf6wjk5*****` |
| `pageNumber` | number | No | The page number. Default value: **1**. Pages start from page 1. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Valid values: **30 to 200**. Default value: **30**. Example: `30` |

## modifyAccountDescription

**Signature:** `modifyAccountDescription(request: ModifyAccountDescriptionRequest)`

### [](#)Supported database engines *   RDS MySQL *   RDS PostgreSQL *   RDS SQL Server *   RDS MariaDB.

**Parameters:** (3 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accountDescription` | string | Yes | The description of the account. The value must be 2 to 256 characters in length. The value can conta Example: `Test` |
| `accountName` | string | Yes | The username of the account. You can call the DescribeAccounts operation to obtain the username of t Example: `test1` |
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-uf6wjk5xxxxxxx` |

## resetAccount

**Signature:** `resetAccount(request: ResetAccountRequest)`

### Supported database engines *   MySQL *   SQL Server *   MariaDB ### References > Before you call this operation, read the following documentation and make sure that you fully understand the prereq.

**Parameters:** (3 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accountName` | string | Yes | The name of the privileged account. Example: `test1` |
| `accountPassword` | string | Yes | The new password of the privileged account. Example: `Test123456` |
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-uf6wjk5xxxxxxx` |

## resetAccountPassword

**Signature:** `resetAccountPassword(request: ResetAccountPasswordRequest)`

### Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB ### References > Before you call this operation, read the following documentation and make sure that you fully unders.

**Parameters:** (3 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accountName` | string | Yes | The username of the account. Example: `test1` |
| `accountPassword` | string | Yes | The new password. Example: `Test123456` |
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-uf6wjk5xxxxxxx` |

## grantAccountPrivilege

**Signature:** `grantAccountPrivilege(request: GrantAccountPrivilegeRequest)`

Each account can be granted permissions on one or more databases. Before you call this operation, make sure that the instance is in the Running state. > This operation is not supported for instances t.

**Parameters:** (4 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accountName` | string | Yes | The username of the account. Example: `test1` |
| `accountPrivilege` | string | Yes | The permissions that you want to grant to the account. The number of permissions must be the same as Example: `ReadWrite` |
| `DBInstanceId` | string | Yes | The ID of the instance. Example: `rm-uf6wjk5xxxxxxxxxx` |
| `DBName` | string | Yes | The name of the database on which you want to grant permissions. Separate multiple database names wi Example: `testDB1` |

## revokeAccountPrivilege

**Signature:** `revokeAccountPrivilege(request: RevokeAccountPrivilegeRequest)`

### [](#)Supported database engines *   MySQL *   SQL Server *   MariaDB ### [](#)Prerequisites *   The instance is in the Running state. *   The database is in the Running state. ### [](#)Precautions.

**Parameters:** (3 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accountName` | string | Yes | The name of the account. Example: `test1` |
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-uf6wjk5xxxxxxx` |
| `DBName` | string | Yes | The name of the database. You can revoke all permissions of the account on this database. Separate m Example: `testDB` |

## grantOperatorPermission

**Signature:** `grantOperatorPermission(request: GrantOperatorPermissionRequest)`

### [](#)Supported database engines *   MySQL *   SQL Server ### [](#)References > Before you call this operation, read the following documentation and make sure that you fully understand the prerequi.

**Parameters:** (3 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-uf6wjk5xxxxxxx` |
| `expiredTime` | string | Yes | The expiration time of the permissions. Specify the time in the ISO 8601 standard in the *yyyy-MM-dd Example: `2019-03-27T16:00:00Z` |
| `privileges` | string | Yes | The permissions that you want to grant to the service account. Valid values: Example: `Control` |

## revokeOperatorPermission

**Signature:** `revokeOperatorPermission(request: RevokeOperatorPermissionRequest)`

### Supported database engines *   MySQL *   PostgreSQL *   SQL Server ### References > Before you call this operation, read the following documentation and make sure that you fully understand the pre.

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-uf6wjk5xxxxxxx` |

## lockAccount

**Signature:** `lockAccount(request: LockAccountRequest)`

### [](#)Supported database engines PostgreSQL ### [](#)References > Before you call this operation, carefully read the following documentation. Make sure that you fully understand the prerequisites a.

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accountName` | string | Yes | The account that you want to lock. You can lock only a single account at a time. Example: `testaccount` |
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `pgm-bpxxxxx` |

## unlockAccount

**Signature:** `unlockAccount(request: UnlockAccountRequest)`

### Supported database engine PostgreSQL ### References > Before you call this operation, read the following documentation and make sure that you fully understand the prerequisites and impacts of this.

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accountName` | string | Yes | The account that you want to unlock. You can unlock a single account at a time. Example: `testaccount` |
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `pgm-bpxxxxx` |

## checkAccountNameAvailable

**Signature:** `checkAccountNameAvailable(request: CheckAccountNameAvailableRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accountName` | string | Yes | The username of the account. Example: `DatabaseTest` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `ETnLKlblzczshOTUbOCzxxxxxxxxxx` |
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-uf6wjk5xxxxx` |


## checkAccountNameAvailable

**Signature:** `checkAccountNameAvailable(request: CheckAccountNameAvailableRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accountName` | string | Yes | The username of the account. Example: `DatabaseTest` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `ETnLKlblzczshOTUbOCzxxxxxxxxxx` |
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-uf6wjk5xxxxx` |


## modifyAccountCheckPolicy

**Signature:** `modifyAccountCheckPolicy(request: ModifyAccountCheckPolicyRequest)`

### [](#)Supported database engine *   SQL Server.

**Parameters:** (3 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accountName` | string | Yes | The account username. Example: `DatabaseTest` |
| `checkPolicy` | boolean | Yes | Specifies whether to apply the password policy Example: `true` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `ETnLKlblzczshOTUbOC****` |
| `DBInstanceId` | string | Yes | The instance ID. Example: `rm-uf6wjk5xxxxxxxxxx` |
| `resourceGroupId` | string | No | The resource group ID. For more information about resource groups, see related documentation. Example: `rg-acfmy****` |


## modifyAccountSecurityPolicy

**Signature:** `modifyAccountSecurityPolicy(request: ModifyAccountSecurityPolicyRequest)`

### [](#)Supported database engines SQL Server (This parameter is unavailable for ApsaraDB RDS for SQL Server instances that belong to the shared instance family and run SQL Server 2008 R2.) ### [](#).

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `ETnLKlblzczshOTUbOCz****` |
| `DBInstanceId` | string | Yes | The instance ID. You can call the [DescribeDBInstances](https://help.aliyun.com/document_detail/2628 Example: `rm-bp1ibu****` |
| `groupPolicy` | string | Yes | The custom password policy for the account of the ApsaraDB RDS for SQL Server instance. The followin Example: `{"accountSecurityPolicy":` |
| `resourceGroupId` | string | No | The resource group ID. Example: `rg-acfmy****` |


## describeAccountMaskingPrivilege

**Signature:** `describeAccountMaskingPrivilege(request: DescribeAccountMaskingPrivilegeRequest)`

查询全密态用户权限.

**Parameters:** (1 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceName` | string | Yes | This parameter is required. Example: `rm-t4n8t18o******6d5` |
| `DBName` | string | No | - Example: `myDB` |
| `regionId` | string | No | - Example: `ap-southeast-1` |
| `userName` | string | No | - Example: `rds` |


## modifyAccountMaskingPrivilege

**Signature:** `modifyAccountMaskingPrivilege(request: ModifyAccountMaskingPrivilegeRequest)`

修改全密态用户权限.

**Parameters:** (3 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceName` | string | Yes | This parameter is required. Example: `rm-t4n8t18o******6d5` |
| `DBName` | string | No | - Example: `myDB` |
| `expireTime` | string | No | - Example: `2026-01-22T02:01:20Z` |
| `privilege` | string | Yes | This parameter is required. Example: `restrictedAccess` |
| `regionId` | string | No | - Example: `ap-southeast-1` |
| `userName` | string | Yes | This parameter is required. Example: `user1,user2` |

