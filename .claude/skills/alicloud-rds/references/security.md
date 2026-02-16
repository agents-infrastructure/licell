# Security & Network

IP whitelist, security groups, SSL, TDE encryption, and AD domain.

## modifySecurityIps

**Signature:** `modifySecurityIps(request: ModifySecurityIpsRequest)`

### Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB ### References > Before you call this operation, read the following documentation and make sure that you fully unders.

**Parameters:** (2 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceIPArrayAttribute` | string | No | The attribute of the IP address whitelist. By default, this parameter is empty. Example: `hidden` |
| `DBInstanceIPArrayName` | string | No | The name of the IP address whitelist that you want to modify. Default value: **Default**. Example: `test` |
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `pgm-bp18n0c8zt45****` |
| `freshWhiteListReadins` | string | No | The read-only instances to which you want to synchronize the IP address whitelist. Example: `pgr-bp17yuz4dn3d****,pgr-bp1vn2ph54u1****` |
| `modifyMode` | string | No | The method that is used to modify the whitelist. Valid values: Example: `Cover` |
| `securityIPType` | string | No | The IP address type. The value is fixed as IPv4. Example: `IPv4` |
| `securityIps` | string | Yes | The IP addresses in an IP address whitelist. Separate multiple IP addresses with commas (,). Each IP Example: `10.23.XX.XX` |
| `whitelistNetworkType` | string | No | The network type of the IP address whitelist. Valid values: Example: `Classic` |

## describeDBInstanceIPArrayList

**Signature:** `describeDBInstanceIPArrayList(request: DescribeDBInstanceIPArrayListRequest)`

### [](#)Supported database engines *   RDS MySQL *   RDS PostgreSQL *   RDS SQL Server *   RDS MariaDB.

**Parameters:** See `DescribeDBInstanceIPArrayListRequest` model.

## modifySecurityGroupConfiguration

**Signature:** `modifySecurityGroupConfiguration(request: ModifySecurityGroupConfigurationRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server ### [](#)References > Before you call this operation, carefully read the following documentation. Make sure that you fully u.

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-uf6wjk5xxxxxx` |
| `securityGroupId` | string | Yes | The ID of the ECS security group. Each instance can be added to up to 10 security groups. Separate m Example: `sg-xxxxxxx` |

## describeSecurityGroupConfiguration

**Signature:** `describeSecurityGroupConfiguration(request: DescribeSecurityGroupConfigurationRequest)`

### [](#)Supported database engines * MySQL * PostgreSQL * SQL Server ### [](#)References > Before you call this operation, carefully read the following documentation. Make sure that you fully underst.

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-uf6wjk5xxxxxx` |

## describeWhitelistTemplate

**Signature:** `describeWhitelistTemplate(request: DescribeWhitelistTemplateRequest)`

### Supported database engines *   RDS MySQL *   RDS PostgreSQL *   RDS SQL Server.

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `regionId` | string | No | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/26243.html Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The resource group ID. Example: `rg-acfmy****` |
| `templateId` | number | Yes | The ID of the whitelist template. You can call the [DescribeAllWhitelistTemplate](https://help.aliyu Example: `1012` |

## describeWhitelistTemplateLinkedInstance

**Signature:** `describeWhitelistTemplateLinkedInstance(request: DescribeWhitelistTemplateLinkedInstanceRequest)`

### Supported database engines *   RDS MySQL *   RDS PostgreSQL *   RDS SQL Server.

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `regionId` | string | No | The region ID. You can call the DescribeRegions operation to query the most recent region list. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The resource group ID. You can leave this parameter empty. Example: `rg-acfmy*****` |
| `templateId` | number | Yes | The ID of the whitelist template. You can call the DescribeAllWhitelistTemplate operation to obtain  Example: `412` |

## describeAllWhitelistTemplate

**Signature:** `describeAllWhitelistTemplate(request: DescribeAllWhitelistTemplateRequest)`

### Supported database engines *   RDS MySQL *   RDS PostgreSQL *   RDS SQL Server.

**Parameters:** (2 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fuzzySearch` | boolean | No | Specifies whether to enable fuzzy search. Valid values: Example: `true` |
| `maxRecordsPerPage` | number | Yes | The number of entries to return on each page. Enumerated valid values: 10, 30, and 50. Example: `10` |
| `pageNumbers` | number | Yes | The page number. Example: `1` |
| `regionId` | string | No | The region ID. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The resource group ID. For more information about resource groups, see related documentation. Example: `rg-acfmyhigxskzysy` |
| `templateName` | string | No | The name of the IP whitelist template. If you specify this parameter when you perform a fuzzy search Example: `template` |

## modifyWhitelistTemplate

**Signature:** `modifyWhitelistTemplate(request: ModifyWhitelistTemplateRequest)`

### Supported database engines *   RDS MySQL *   RDS PostgreSQL *   RDS SQL Server.

**Parameters:** (3 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ipWhitelist` | string | Yes | The IP addresses in an IP address whitelist. Separate multiple IP addresses with commas (,). Each IP Example: `139.196.X.X,101.132.X.X` |
| `regionId` | string | No | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/26243.html Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The resource group ID. For more information about resource groups, see related documentation. Example: `rg-acfmy****` |
| `templateId` | number | Yes | The ID of the whitelist template. This parameter is required when you modify or delete a whitelist.  Example: `539` |
| `templateName` | string | Yes | The name of the IP whitelist. This parameter is required when you create a whitelist. The value of t Example: `template_123` |

## attachWhitelistTemplateToInstance

**Signature:** `attachWhitelistTemplateToInstance(request: AttachWhitelistTemplateToInstanceRequest)`

### Supported database engines *   MySQL *   PostgreSQL *   SQL Server.

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `insName` | string | Yes | The name of the instance. Example: `rm-bp191w771kd3****` |
| `regionId` | string | No | The region ID. You can call the DescribeRegions operation to query the most recent region list. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group. For more information about resource groups, see Resource groups. Example: `rg-acfmy*****` |
| `templateId` | number | Yes | The ID of the whitelist template. You can call the DescribeAllWhitelistTemplate operation to obtain  Example: `412` |

## modifyDBInstanceSSL

**Signature:** `modifyDBInstanceSSL(request: ModifyDBInstanceSSLRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server ### [](#)References > Before you call this operation, read the following documentation and make sure that you fully understa.

**Parameters:** See `ModifyDBInstanceSSLRequest` model.

## describeDBInstanceSSL

**Signature:** `describeDBInstanceSSL(request: DescribeDBInstanceSSLRequest)`

### [](#)Supported database engines *   RDS MySQL *   RDS PostgreSQL *   RDS SQL Server ### [](#)References *   [Use the SSL encryption feature for an ApsaraDB RDS for MySQL instance](https://help.ali.

**Parameters:** See `DescribeDBInstanceSSLRequest` model.

## modifyDBInstanceTDE

**Signature:** `modifyDBInstanceTDE(request: ModifyDBInstanceTDERequest)`

### Supported database engines *   MySQL *   PostgreSQL *   SQL Server ### References > Before you call this operation, read the following documentation and make sure that you fully understand the pre.

**Parameters:** See `ModifyDBInstanceTDERequest` model.

## describeDBInstanceTDE

**Signature:** `describeDBInstanceTDE(request: DescribeDBInstanceTDERequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server.

**Parameters:** See `DescribeDBInstanceTDERequest` model.

## describeDBInstanceEncryptionKey

**Signature:** `describeDBInstanceEncryptionKey(request: DescribeDBInstanceEncryptionKeyRequest)`

You can call the DescribeDBInstanceEncryptionKey operation to check whether disk encryption is enabled for an instance. You can also query details about the keys that are used for disk encryption. Thi.

**Parameters:** See `DescribeDBInstanceEncryptionKeyRequest` model.

## modifyADInfo

**Signature:** `modifyADInfo(request: ModifyADInfoRequest)`

### [](#)Supported database engine *   SQL Server ### [](#)References > Before you call this operation, read the following documentation and make sure that you fully understand the prerequisites and i.

**Parameters:** See `ModifyADInfoRequest` model.

## describeADInfo

**Signature:** `describeADInfo(request: DescribeADInfoRequest)`

### [](#)Supported database engines *   SQL Server.

**Parameters:** See `DescribeADInfoRequest` model.


## createDBInstanceSecurityGroupRule

**Signature:** `createDBInstanceSecurityGroupRule(request: CreateDBInstanceSecurityGroupRuleRequest)`

### [](#)Supported database engine SQL Server ### [](#)References [Configure security group settings for an ApsaraDB RDS for SQL Server instance](https://help.aliyun.com/document_detail/2392322.html).


## deleteDBInstanceSecurityGroupRule

**Signature:** `deleteDBInstanceSecurityGroupRule(request: DeleteDBInstanceSecurityGroupRuleRequest)`

### [](#)Supported database engine SQL Server ### [](#)References [Configure security group settings for an ApsaraDB RDS for SQL Server instance](https://help.aliyun.com/document_detail/2392322.html).


## describeDBInstanceSecurityGroupRule

**Signature:** `describeDBInstanceSecurityGroupRule(request: DescribeDBInstanceSecurityGroupRuleRequest)`

### [](#)Supported database engine SQL Server ### [](#)References [Configure security group settings for an ApsaraDB RDS for SQL Server instance](https://help.aliyun.com/document_detail/2392322.html).


## modifyDBInstanceSecurityGroupRule

**Signature:** `modifyDBInstanceSecurityGroupRule(request: ModifyDBInstanceSecurityGroupRuleRequest)`

### [](#)Supported database engine SQL Server ### [](#)References [Configure security group settings for an ApsaraDB RDS for SQL Server instance](https://help.aliyun.com/document_detail/2392322.html).


## describeDTCSecurityIpHostsForSQLServer

**Signature:** `describeDTCSecurityIpHostsForSQLServer(request: DescribeDTCSecurityIpHostsForSQLServerRequest)`

### [](#)Supported database engines SQL Server ### [](#)References > Before you call this operation, carefully read the following documentation. Make sure that you fully understand the prerequisites a.


## modifyDTCSecurityIpHostsForSQLServer

**Signature:** `modifyDTCSecurityIpHostsForSQLServer(request: ModifyDTCSecurityIpHostsForSQLServerRequest)`

### [](#)Supported database engine SQL Server ### [](#)References > Before you call this operation, carefully read the following documentation. Make sure that you fully understand the prerequisites an.


## describeInstanceLinkedWhitelistTemplate

**Signature:** `describeInstanceLinkedWhitelistTemplate(request: DescribeInstanceLinkedWhitelistTemplateRequest)`

### Supported database engines *   RDS MySQL *   RDS PostgreSQL *   RDS SQL Server.

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `insName` | string | Yes | The instance name. Example: `rm-bp191w771kd3****` |
| `regionId` | string | No | The region ID. You can call the DescribeRegions operation to query the most recent region list. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The resource group ID. You can leave this parameter empty. Example: `rg-aek3dbzqbh6****` |


## detachWhitelistTemplateToInstance

**Signature:** `detachWhitelistTemplateToInstance(request: DetachWhitelistTemplateToInstanceRequest)`

### Supported database engines *   RDS MySQL *   RDS PostgreSQL *   RDS SQL Server.

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `insName` | string | Yes | The instance name. Example: `rm-bp191w771k******` |
| `regionId` | string | No | The region ID. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The resource group ID. For more information about resource groups, see Resource groups. Example: `rg-acfmz3kjr******` |
| `templateId` | number | Yes | The ID of the whitelist template. You can call the DescribeAllWhitelistTemplate operation to obtain  Example: `412` |


## checkCloudResourceAuthorized

**Signature:** `checkCloudResourceAuthorized(request: CheckCloudResourceAuthorizedRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB.

**Parameters:** (0 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceId` | string | No | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-t4n7j9eb52y7c1960` |
| `regionId` | string | No | The region ID. You can call the DescribeRegions operation to query the most recent region list. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The resource group ID. Example: `rg-acfmy**********` |
| `targetRegionId` | string | No | The destination region ID. You can call the DescribeRegions operation to query the most recent regio Example: `us-east-1` |


## describeKmsAssociateResources

**Signature:** `describeKmsAssociateResources(request: DescribeKmsAssociateResourcesRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server.

**Parameters:** (3 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `ETnLKlblzczshOTUbOCz****` |
| `kmsResourceId` | string | Yes | The ID of the KMS resource. Only key IDs are supported. Example: `494c98ce-f2b5-48ab-96ab-36c986b6****` |
| `kmsResourceRegionId` | string | No | The ID of the region to which the KMS resource belongs. Example: `cn-hangzhou` |
| `kmsResourceType` | string | Yes | The type of the KMS resource. Only key is supported. Example: `key` |
| `kmsResourceUser` | string | Yes | The ID of the Alibaba Cloud account to which the KMS resource belongs. Example: `164882191396****` |
| `regionId` | string | No | The region ID. You can call the DescribeRegions operation to query the most recent region list. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The resource group ID. Example: `rg-bp67acfmxazb4p****` |


## createSecret

**Signature:** `createSecret(request: CreateSecretRequest)`

### [](#)Supported database engines *   MySQL.

**Parameters:** (6 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `ETnLKlblzczshOTUbOCz*****` |
| `dbInstanceId` | string | Yes | The ID of the instance. You can call the DescribeDBInstances operation to query the ID of the instan Example: `rm-sdfljk123***` |
| `dbNames` | string | No | The name of the database. Example: `users` |
| `description` | string | No | The description of the credential. Example: `test` |
| `engine` | string | Yes | The engine of the database. Example: `MySQL` |
| `password` | string | Yes | The password that is used to access the database. Example: `12345678` |
| `regionId` | string | Yes | The region ID of the instance. You can call the DescribeDBInstanceAttribute operation to query the r Example: `cn-hangzhou` |
| `resourceGroupId` | string | Yes | The ID of the resource group to which the instance belongs. You can call the DescribeDBInstanceAttri Example: `rg-acfmxypivk***` |
| `secretName` | string | No | The name of the credential. Example: `Foo` |
| `username` | string | Yes | The username that is used to access the database. Example: `user_jack` |


## deleteSecret

**Signature:** `deleteSecret(request: DeleteSecretRequest)`

Deletes the credential of a user who uses the Data API feature..

**Parameters:** (2 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `ETnLKlblzczshOTUbOCz*****` |
| `dbInstanceId` | string | No | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-sfjdlsjxxxxx` |
| `engine` | string | Yes | The engine of the database. Example: `MySQL` |
| `regionId` | string | Yes | The region ID. You can call the DescribeSecrets operation to query the region ID. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The resource group ID. You can call the DescribeDBInstanceAttribute operation to query the resource  Example: `rg-acfmy****` |
| `secretArn` | string | No | The Alibaba Cloud Resource Name (ARN) of the credential for the created Data API account. You can ca Example: `acs:rds:cn-hangzhou:1335786***:dbInstance/rm-bp1m7l3j63****` |
| `secretName` | string | No | The name of the credential. Example: `Foo` |


## describeSecrets

**Signature:** `describeSecrets(request: DescribeSecretsRequest)`

### [](#)Supported database engine *   MySQL.

**Parameters:** (4 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The language of the text within the response. Valid values: Example: `en-US` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `ETnLKlblzczshOTUbOCz*****` |
| `dbInstanceId` | string | No | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-xjkljjxxxxx` |
| `engine` | string | Yes | The database engine of the database. Example: `MySQL` |
| `pageNumber` | number | Yes | The number of the page to return. Valid values: any non-zero positive integer. Example: `1` |
| `pageSize` | number | Yes | The number of entries per page. Example: `10` |
| `regionId` | string | Yes | The region ID. You can call the DescribeDBInstanceAttribute operation to query the region ID. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which the instance belongs. Example: `rg-acfmxypivk***` |


## createMaskingRules

**Signature:** `createMaskingRules(request: CreateMaskingRulesRequest)`

创建全密态规则.

**Parameters:** (2 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `columns` | string[] | No | - |
| `DBInstanceName` | string | Yes | This parameter is required. Example: `rm-t4n8t18o3*****d5` |
| `DBName` | string | No | - Example: `testdb` |
| `defaultAlgo` | string | No | - Example: `aes-128-gcm` |
| `maskingAlgo` | string | No | - Example: `[{"name":` |
| `regionId` | string | No | - Example: `ap-southeast-1` |
| `ruleName` | string | Yes | This parameter is required. Example: `rulename1` |


## deleteMaskingRules

**Signature:** `deleteMaskingRules(request: DeleteMaskingRulesRequest)`

删除全密态规则.

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceName` | string | Yes | This parameter is required. Example: `rm-t4n8t18o******6d5` |
| `DBName` | string | No | - Example: `myDB` |
| `regionId` | string | No | - Example: `ap-southeast-1` |
| `ruleName` | string | Yes | This parameter is required. Example: `test` |


## describeMaskingRules

**Signature:** `describeMaskingRules(request: DescribeMaskingRulesRequest)`

查询全密态规则.

**Parameters:** (1 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceName` | string | Yes | This parameter is required. Example: `rm-t4n8t18o******5` |
| `DBName` | string | No | - Example: `myDB` |
| `regionId` | string | No | - Example: `ap-southeast-1` |
| `ruleName` | string | No | - Example: `test1,test2` |


## modifyMaskingRules

**Signature:** `modifyMaskingRules(request: ModifyMaskingRulesRequest)`

修改全密态规则.

**Parameters:** (2 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `columns` | string[] | No | - |
| `DBInstanceName` | string | Yes | This parameter is required. Example: `rm-t4n8t18o******6d5` |
| `DBName` | string | No | - Example: `myDB` |
| `defaultAlgo` | string | No | - Example: `sm4-128-gcm` |
| `enabled` | string | No | - Example: `true` |
| `maskingAlgo` | string | No | - Example: `[{"name":` |
| `regionId` | string | No | - Example: `ap-southeast-1` |
| `ruleName` | string | Yes | This parameter is required. Example: `rulename1` |


## modifyADInfo

**Signature:** `modifyADInfo(request: ModifyADInfoRequest)`

### [](#)Supported database engine *   SQL Server ### [](#)References > Before you call this operation, read the following documentation and make sure that you fully understand the prerequisites and i.


## describeADInfo

**Signature:** `describeADInfo(request: DescribeADInfoRequest)`

### [](#)Supported database engines *   SQL Server.


## deleteADSetting

**Signature:** `deleteADSetting(request: DeleteADSettingRequest)`

### [](#)Supported database engines *   SQL Server.

