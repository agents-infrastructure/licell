# Instance Management

RDS instance CRUD, lifecycle, specification changes, restart, start/stop, and status queries.

## createDBInstance

**Signature:** `createDBInstance(request: CreateDBInstanceRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB ### [](#)References >  Fees of an instance are changed if the call is successful. Before you call this operation.

**Parameters:** See `CreateDBInstanceRequest` model.

## deleteDBInstance

**Signature:** `deleteDBInstance(request: DeleteDBInstanceRequest)`

### Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB ### References > Note Before you call this operation, read the following documentation and make sure that you fully u.

**Parameters:** See `DeleteDBInstanceRequest` model.

## describeDBInstances

**Signature:** `describeDBInstances(request: DescribeDBInstancesRequest)`

### Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB.

**Parameters:** See `DescribeDBInstancesRequest` model.

## describeDBInstanceAttribute

**Signature:** `describeDBInstanceAttribute(request: DescribeDBInstanceAttributeRequest)`

### [](#)Supported database engines *   RDS MySQL *   RDS PostgreSQL *   RDS SQL Server *   RDS MariaDB.

**Parameters:** See `DescribeDBInstanceAttributeRequest` model.

## describeDBInstanceByTags

**Signature:** `describeDBInstanceByTags(request: DescribeDBInstanceByTagsRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB.

**Parameters:** See `DescribeDBInstanceByTagsRequest` model.

## describeDBInstancesForClone

**Signature:** `describeDBInstancesForClone(request: DescribeDBInstancesForCloneRequest)`

describeDBInstancesForClone operation.

**Parameters:** See `DescribeDBInstancesForCloneRequest` model.

## describeDBInstancesAsCsv

**Signature:** `describeDBInstancesAsCsv(request: DescribeDBInstancesAsCsvRequest)`

describeDBInstancesAsCsv operation.

**Parameters:** See `DescribeDBInstancesAsCsvRequest` model.

## describeAvailableClasses

**Signature:** `describeAvailableClasses(request: DescribeAvailableClassesRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB.

**Parameters:** (6 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | string | Yes | The RDS edition of the instance. Valid values: Example: `HighAvailability` |
| `commodityCode` | string | No | The commodity code of the instance. Valid values: Example: `bards` |
| `DBInstanceId` | string | No | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-uf6wjk5xxxxxx` |
| `DBInstanceStorageType` | string | Yes | The storage type of the instance. Valid values: Example: `local_ssd` |
| `engine` | string | Yes | The database engine that is run by the instance. Valid values: Example: `MySQL` |
| `engineVersion` | string | Yes | The database engine version of the instance. Valid values: Example: `8.0` |
| `instanceChargeType` | string | No | The billing method of the instance. Valid values: Example: `Prepaid` |
| `orderType` | string | No | The type of order. Set the value to **BUY** Example: `BUY` |
| `regionId` | string | Yes | The region ID of the instance. You can call the DescribeDBInstanceAttribute operation to query the r Example: `cn-hangzhou` |
| `zoneId` | string | Yes | The zone ID of the instance. You can call the DescribeDBInstanceAttribute operation to query the zon Example: `cn-hangzhou-h` |

## describeAvailableZones

**Signature:** `describeAvailableZones(request: DescribeAvailableZonesRequest)`

### [](#)Supported database engines *   RDS MySQL *   RDS PostgreSQL *   RDS SQL Server *   RDS MariaDB > You can call this operation to query the available zones for an instance. The query result may.

**Parameters:** (2 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | string | No | The RDS edition of the instance. Valid values: Example: `HighAvailability` |
| `commodityCode` | string | No | The commodity code of the instance. This operation can return the resources that you can purchase ba Example: `bards` |
| `DBInstanceName` | string | No | The ID of the primary instance. If you want to query the read-only instances that you can purchase f Example: `rm-uf6wjk5xxxxxxx` |
| `dispenseMode` | string | No | Specifies whether to return the zones in which the single-zone deployment method is supported. Valid Example: `0` |
| `engine` | string | Yes | The database engine of the instance. Valid values: Example: `MySQL` |
| `engineVersion` | string | No | The database engine version. Valid values: Example: `8.0` |
| `regionId` | string | Yes | The region ID. You can call the DescribeRegions operation to query the most recent region list. Example: `cn-hangzhou` |
| `zoneId` | string | No | The zone ID. If the instance spans more than one zone, the value of this parameter contains an `MAZ` Example: `cn-hangzhou-e` |

## describeRegions

**Signature:** `describeRegions(request: DescribeRegionsRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB.

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The language that is used for the return value of the **LocalName** parameter. Valid values: Example: `en-US` |

## describeDBInstanceNetInfo

**Signature:** `describeDBInstanceNetInfo(request: DescribeDBInstanceNetInfoRequest)`

### Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB.

**Parameters:** See `DescribeDBInstanceNetInfoRequest` model.

## describeDBInstanceNetInfoForChannel

**Signature:** `describeDBInstanceNetInfoForChannel(request: DescribeDBInstanceNetInfoForChannelRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB.

**Parameters:** See `DescribeDBInstanceNetInfoForChannelRequest` model.

## modifyDBInstanceSpec

**Signature:** `modifyDBInstanceSpec(request: ModifyDBInstanceSpecRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB ### [](#)Billing details [Fees for specification changes](https://help.aliyun.com/document_detail/57178.html) ar.

**Parameters:** See `ModifyDBInstanceSpecRequest` model.

## modifyDBInstanceDescription

**Signature:** `modifyDBInstanceDescription(request: ModifyDBInstanceDescriptionRequest)`

You can call the ModifyDBInstanceDescription operation to modify the name of an instance..

**Parameters:** See `ModifyDBInstanceDescriptionRequest` model.

## modifyDBInstanceAutoUpgradeMinorVersion

**Signature:** `modifyDBInstanceAutoUpgradeMinorVersion(request: ModifyDBInstanceAutoUpgradeMinorVersionRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL ### [](#)References > Before you call this operation, read the following documentation and make sure that you fully understand the prerequi.

**Parameters:** See `ModifyDBInstanceAutoUpgradeMinorVersionRequest` model.

## modifyDBInstanceConnectionString

**Signature:** `modifyDBInstanceConnectionString(request: ModifyDBInstanceConnectionStringRequest)`

### Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB ### References > Before you call this operation, read the following documentation and make sure that you fully unders.

**Parameters:** See `ModifyDBInstanceConnectionStringRequest` model.

## modifyDBInstanceMaintainTime

**Signature:** `modifyDBInstanceMaintainTime(request: ModifyDBInstanceMaintainTimeRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB ### [](#)References > Before you call this operation, read the following documentation and make sure that you fu.

**Parameters:** See `ModifyDBInstanceMaintainTimeRequest` model.

## modifyDBInstanceMonitor

**Signature:** `modifyDBInstanceMonitor(request: ModifyDBInstanceMonitorRequest)`

### [](#)Supported database engines *   MySQL *   SQL Server ### [](#)Usage notes If you use the Every 5 Seconds monitoring frequency, you are charged additional fees. Before you call this operation, .

**Parameters:** See `ModifyDBInstanceMonitorRequest` model.

## modifyDBInstanceNetworkExpireTime

**Signature:** `modifyDBInstanceNetworkExpireTime(request: ModifyDBInstanceNetworkExpireTimeRequest)`

### [](#)Supported database engines *   MySQL *   SQL Server ### [](#)References *   [Configure the hybrid access solution for an ApsaraDB RDS for MySQL instance](https://help.aliyun.com/document_deta.

**Parameters:** See `ModifyDBInstanceNetworkExpireTimeRequest` model.

## modifyDBInstanceNetworkType

**Signature:** `modifyDBInstanceNetworkType(request: ModifyDBInstanceNetworkTypeRequest)`

### [](#)Supported database engines *   RDS MySQL *   RDS PostgreSQL *   RDS SQL Server ### [](#)References > : Before you call this operation, carefully read the following documentation. Make sure th.

**Parameters:** See `ModifyDBInstanceNetworkTypeRequest` model.

## modifyDBInstancePayType

**Signature:** `modifyDBInstancePayType(request: ModifyDBInstancePayTypeRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB ### [](#)References >  Fees of an instance are changed if the call is successful. Before you call this operation.

**Parameters:** See `ModifyDBInstancePayTypeRequest` model.

## modifyDBInstanceTDE

**Signature:** `modifyDBInstanceTDE(request: ModifyDBInstanceTDERequest)`

### Supported database engines *   MySQL *   PostgreSQL *   SQL Server ### References > Before you call this operation, read the following documentation and make sure that you fully understand the pre.

**Parameters:** See `ModifyDBInstanceTDERequest` model.

## modifyDBInstanceSSL

**Signature:** `modifyDBInstanceSSL(request: ModifyDBInstanceSSLRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server ### [](#)References > Before you call this operation, read the following documentation and make sure that you fully understa.

**Parameters:** See `ModifyDBInstanceSSLRequest` model.

## modifyDBInstanceHAConfig

**Signature:** `modifyDBInstanceHAConfig(request: ModifyDBInstanceHAConfigRequest)`

Changes the high availability (HA) and data replication mode of an instance..

**Parameters:** See `ModifyDBInstanceHAConfigRequest` model.

## modifyDBInstanceDeletionProtection

**Signature:** `modifyDBInstanceDeletionProtection(request: ModifyDBInstanceDeletionProtectionRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB ### [](#)References > : Before you call this operation, carefully read the following documentation. Make sure th.

**Parameters:** See `ModifyDBInstanceDeletionProtectionRequest` model.

## modifyDBInstanceEndpointAddress

**Signature:** `modifyDBInstanceEndpointAddress(request: ModifyDBInstanceEndpointAddressRequest)`

### [](#)Supported database engines MySQL ### [](#)Precautions *   You can modify the following information about the endpoint of an instance: the public and internal endpoints, the public and interna.

**Parameters:** See `ModifyDBInstanceEndpointAddressRequest` model.

## modifyDBInstanceEndpoint

**Signature:** `modifyDBInstanceEndpoint(request: ModifyDBInstanceEndpointRequest)`

### [](#)Supported database engine MySQL.

**Parameters:** See `ModifyDBInstanceEndpointRequest` model.

## modifyDBInstanceConfig

**Signature:** `modifyDBInstanceConfig(request: ModifyDBInstanceConfigRequest)`

### [](#)Supported database engines *   PostgreSQL *   SQL Server >  The configuration items that are supported are pgbouncer and clear_errorlog. For more information, see [PgBouncer of ApsaraDB RDS f.

**Parameters:** See `ModifyDBInstanceConfigRequest` model.

## modifyDBInstanceMetrics

**Signature:** `modifyDBInstanceMetrics(request: ModifyDBInstanceMetricsRequest)`

### [](#)Supported database engines *   PostgreSQL ### [](#)References > Before you call this operation, carefully read the following documentation. Make sure that you fully understand the prerequisit.

**Parameters:** See `ModifyDBInstanceMetricsRequest` model.

## restartDBInstance

**Signature:** `restartDBInstance(request: RestartDBInstanceRequest)`

### Supported database engines *   RDS MySQL *   RDS PostgreSQL *   RDS SQL Server *   RDS MariaDB ### References > : Before you call this operation, carefully read the following documentation. Make s.

**Parameters:** See `RestartDBInstanceRequest` model.

## startDBInstance

**Signature:** `startDBInstance(request: StartDBInstanceRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server ### [](#)References >  Before you call this operation, read the following topics and make sure that you fully understand the.

**Parameters:** See `StartDBInstanceRequest` model.

## stopDBInstance

**Signature:** `stopDBInstance(request: StopDBInstanceRequest)`

### Supported database engines *   MySQL *   PostgreSQL *   SQL Server ### References > Before you call this operation, read the following documentation and make sure that you fully understand the pre.

**Parameters:** See `StopDBInstanceRequest` model.

## switchDBInstanceHA

**Signature:** `switchDBInstanceHA(request: SwitchDBInstanceHARequest)`

### Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB ### References > Before you call this operation, read the following documentation and make sure that you fully unders.

**Parameters:** See `SwitchDBInstanceHARequest` model.

## switchDBInstanceNetType

**Signature:** `switchDBInstanceNetType(request: SwitchDBInstanceNetTypeRequest)`

### Supported database engines *   MySQL *   SQL Server ### Prerequisites *   The instance is connected by using its internal or public endpoint. *   The instance is in the Running state. *   The numb.

**Parameters:** See `SwitchDBInstanceNetTypeRequest` model.

## switchDBInstanceVpc

**Signature:** `switchDBInstanceVpc(request: SwitchDBInstanceVpcRequest)`

### Supported database engines *   MySQL *   PostgreSQL *   SQL Server ### References > Before you call this operation, read the following documentation and make sure that you fully understand the pre.

**Parameters:** See `SwitchDBInstanceVpcRequest` model.

## transformDBInstancePayType

**Signature:** `transformDBInstancePayType(request: TransformDBInstancePayTypeRequest)`

### Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB ### References > Fees are generated if the call is successful. Before you call this operation, you must read the foll.

**Parameters:** See `TransformDBInstancePayTypeRequest` model.

## renewInstance

**Signature:** `renewInstance(request: RenewInstanceRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB ### [](#)References >  Fees of an instance are changed if the call is successful. Before you call this operation.

**Parameters:** (2 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `autoPay` | string | No | Specifies whether to enable automatic payment during the renewal. Valid values: Example: `True` |
| `autoRenew` | string | No | Specifies whether to enable auto-renewal for the instance. Valid values: Example: `true` |
| `autoUseCoupon` | boolean | No | Specifies whether to use a coupon. Valid values: Example: `true` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `ETnLKlblzczshOTUbOCzxxxxxxxxxx` |
| `DBInstanceId` | string | Yes | The instance ID You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-uf6wjk5xxxxxxxxxx` |
| `period` | number | Yes | The duration of the subscription renewal. Unit: month. Valid values: Example: `12` |
| `promotionCode` | string | No | The coupon code. Example: `726702810223` |

## allocateInstancePublicConnection

**Signature:** `allocateInstancePublicConnection(request: AllocateInstancePublicConnectionRequest)`

### Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB ### References > Before you call this operation, read the following documentation and make sure that you fully unders.

**Parameters:** (3 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `babelfishPort` | string | No | The Tabular Data Stream (TDS) port of the instance for which Babelfish is enabled. Example: `1433` |
| `connectionStringPrefix` | string | Yes | The prefix of the public endpoint. A valid public endpoint is in the following format: `Prefix.Datab Example: `test1234` |
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-uf6wjk5*****` |
| `generalGroupName` | string | No | The name of the dedicated cluster to which the instance belongs. This parameter is available only wh Example: `rgc-bp1tkv8*****` |
| `PGBouncerPort` | string | No | The PgBouncer port. Example: `6432` |
| `port` | string | Yes | The public port of the instance. Valid values: **1000 to 5999**. Example: `3306` |

## releaseInstanceConnection

**Signature:** `releaseInstanceConnection(request: ReleaseInstanceConnectionRequest)`

### Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB ### References *   [Release the public endpoint of an ApsaraDB RDS for MySQL instance](https://help.aliyun.com/docume.

**Parameters:** (3 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `currentConnectionString` | string | Yes | The public endpoint of the instance. Example: `rm-uf6wjk5xxxx.mysql.rds.aliyuncs.com` |
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-uf6wjk5xxxxxxx` |
| `instanceNetworkType` | string | Yes | The network type of the instance. Valid values: Example: `0` |

## releaseInstancePublicConnection

**Signature:** `releaseInstancePublicConnection(request: ReleaseInstancePublicConnectionRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB ### [](#)References > Before you call this operation, read the following documentation and make sure that you fu.

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `currentConnectionString` | string | Yes | The public endpoint. You can call the DescribeDBInstanceNetInfo operation to query the public endpoi Example: `rm-uf6wjk5xxxx.mysql.rds.aliyuncs.com` |
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-uf6wjk5xxxxxxx` |

## describeDBInstancePerformance

**Signature:** `describeDBInstancePerformance(request: DescribeDBInstancePerformanceRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB.

**Parameters:** See `DescribeDBInstancePerformanceRequest` model.

## describeDBInstancePromoteActivity

**Signature:** `describeDBInstancePromoteActivity(request: DescribeDBInstancePromoteActivityRequest)`

describeDBInstancePromoteActivity operation.

**Parameters:** See `DescribeDBInstancePromoteActivityRequest` model.

## describeDBInstanceEncryptionKey

**Signature:** `describeDBInstanceEncryptionKey(request: DescribeDBInstanceEncryptionKeyRequest)`

You can call the DescribeDBInstanceEncryptionKey operation to check whether disk encryption is enabled for an instance. You can also query details about the keys that are used for disk encryption. Thi.

**Parameters:** See `DescribeDBInstanceEncryptionKeyRequest` model.

## describeDBInstanceDetail

**Signature:** `describeDBInstanceDetail(request: DescribeDBInstanceDetailRequest)`

This operation is phased out..

**Parameters:** See `DescribeDBInstanceDetailRequest` model.

## describeDBInstanceIpHostname

**Signature:** `describeDBInstanceIpHostname(request: DescribeDBInstanceIpHostnameRequest)`

### [](#)Supported database engines SQL Server ### [](#)Prerequisites *   The RDS instance runs RDS Basic Edition, RDS High-availability Edition, or RDS Cluster Edition. If your RDS instance runs RDS .

**Parameters:** See `DescribeDBInstanceIpHostnameRequest` model.

## describeDBInstanceConnectivity

**Signature:** `describeDBInstanceConnectivity(request: DescribeDBInstanceConnectivityRequest)`

获取实例链路诊断信息.

**Parameters:** See `DescribeDBInstanceConnectivityRequest` model.

## describeDBInstanceEndpoints

**Signature:** `describeDBInstanceEndpoints(request: DescribeDBInstanceEndpointsRequest)`

### [](#)Supported database engine MySQL.

**Parameters:** See `DescribeDBInstanceEndpointsRequest` model.

## describeDBInstanceMetrics

**Signature:** `describeDBInstanceMetrics(request: DescribeDBInstanceMetricsRequest)`

### [](#)Supported database engines *   PostgreSQL ### [](#)References > Before you call this operation, carefully read the following documentation. Make sure that you fully understand the prerequisit.

**Parameters:** See `DescribeDBInstanceMetricsRequest` model.

## describeDBInstanceMonitor

**Signature:** `describeDBInstanceMonitor(request: DescribeDBInstanceMonitorRequest)`

### [](#)Supported database engines *   MySQL *   SQL Server *   MariaDB.

**Parameters:** See `DescribeDBInstanceMonitorRequest` model.

## describeDBInstanceSSL

**Signature:** `describeDBInstanceSSL(request: DescribeDBInstanceSSLRequest)`

### [](#)Supported database engines *   RDS MySQL *   RDS PostgreSQL *   RDS SQL Server ### [](#)References *   [Use the SSL encryption feature for an ApsaraDB RDS for MySQL instance](https://help.ali.

**Parameters:** See `DescribeDBInstanceSSLRequest` model.

## describeDBInstanceTDE

**Signature:** `describeDBInstanceTDE(request: DescribeDBInstanceTDERequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server.

**Parameters:** See `DescribeDBInstanceTDERequest` model.

## describeDBInstanceHAConfig

**Signature:** `describeDBInstanceHAConfig(request: DescribeDBInstanceHAConfigRequest)`

### Supported database engines *   MySQL *   PostgreSQL *   SQL Server ### References > Before you call this operation, carefully read the following documentation. Make sure that you fully understand .

**Parameters:** See `DescribeDBInstanceHAConfigRequest` model.

## describeDBInstanceIPArrayList

**Signature:** `describeDBInstanceIPArrayList(request: DescribeDBInstanceIPArrayListRequest)`

### [](#)Supported database engines *   RDS MySQL *   RDS PostgreSQL *   RDS SQL Server *   RDS MariaDB.

**Parameters:** See `DescribeDBInstanceIPArrayListRequest` model.

## describeInstanceAutoRenewalAttribute

**Signature:** `describeInstanceAutoRenewalAttribute(request: DescribeInstanceAutoRenewalAttributeRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB.

**Parameters:** (1 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `ETnLKlblzczshOTUbOCzxxxxxxx` |
| `DBInstanceId` | string | No | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-bpxxxxxxx` |
| `pageNumber` | number | No | The page number. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Valid values: Example: `30` |
| `regionId` | string | Yes | The region ID. You can call the DescribeRegions operation to query the most recent region list. Example: `cn-hangzhou` |
| `proxyId` | string | No | This parameter is reserved. You do not need to specify this parameter. Example: `API` |

## modifyInstanceAutoRenewalAttribute

**Signature:** `modifyInstanceAutoRenewalAttribute(request: ModifyInstanceAutoRenewalAttributeRequest)`

### Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB ### References >Notice: Fees are generated if the call is successful. Before you call this operation, carefully read .

**Parameters:** (2 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `autoRenew` | string | No | Specifies whether to enable auto-renewal. Valid values: Example: `True` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `ETnLKlblzczshOTUbOCzxxxxxx` |
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-bpxxxxx` |
| `duration` | string | No | The number of months for auto-renewal. Valid values: **1 to 12**. Example: `2` |
| `regionId` | string | Yes | The region ID. You can call the DescribeRegions operation to query the most recent region list. Example: `cn-hangzhou` |

## describePrice

**Signature:** `describePrice(request: DescribePriceRequest)`

### Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB.

**Parameters:** (6 required, 16 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `classCode` | string | No | The instance type of the node. Example: `mysql.n2.small.xc` |
| `zoneId` | string | No | The zone ID of the node. Example: `cn-hangzhou-j` |
| `maxCapacity` | number | No | The maximum number of RDS Capacity Units (RCUs). Example: `8` |
| `minCapacity` | number | No | The minimum number of RCUs. Example: `0.5` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `ETnLKlblzczshOTUbOCz*****` |
| `commodityCode` | string | No | The commodity code of the instance. Valid values: Example: `rds` |
| `DBInstanceClass` | string | Yes | The instance type of the instance. For more information, see [Primary ApsaraDB RDS instance types](h Example: `rds.mysql.s1.small` |
| `DBInstanceId` | string | No | The ID of the instance for which you want to change the specifications or the instance that you want Example: `rm-*****` |
| `DBInstanceStorage` | number | Yes | The storage capacity of the instance. Unit: GB. You can increase the storage capacity at a step size Example: `20` |
| `DBInstanceStorageType` | string | No | The storage type of the new instance. Valid values: Example: `local_ssd` |
| `DBNode` | DescribePriceRequestDBNode[] | No | The information about the node. |
| `engine` | string | Yes | The database engine of the instance. Valid values: Example: `MySQL` |
| `engineVersion` | string | Yes | The database engine version of the instance. Valid values: Example: `5.5` |
| `instanceUsedType` | number | No | The role of the instance. Valid values: Example: `0` |
| `orderType` | string | No | The order type. Valid values: Example: `BUY` |
| `payType` | string | No | The billing method of the instance. Valid values: Example: `Prepaid` |
| `quantity` | number | Yes | The number of instances that you want to purchase. Valid values: **0 to 30**. Example: `10` |
| `regionId` | string | No | The region ID. You can call the DescribeRegions operation to query the most recent region list. Example: `cn-hangzhou` |
| `serverlessConfig` | DescribePriceRequestServerlessConfig | No | The settings of the serverless instance. |
| `timeType` | string | Yes | The billing cycle of the subscription instance. This parameter is required when **CommodityCode** is Example: `Year` |
| `usedTime` | number | No | The subscription duration of the instance. Example: `1` |
| `zoneId` | string | No | The zone ID of the primary instance. You can call the DescribeRegions operation to query the most re Example: `cn-hangzhou-b` |

## describeRenewalPrice

**Signature:** `describeRenewalPrice(request: DescribeRenewalPriceRequest)`

### Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB.

**Parameters:** (3 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `businessInfo` | string | No | The additional business information about the instance. Example: `121436975448952` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `ETnLKlblzczshOTUbOCzxxxxxxxxxx` |
| `DBInstanceClass` | string | No | The instance type of the instance. For more information, see [Primary instance types](https://help.a Example: `mysql.n2.medium.2c` |
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-uf6wjk5xxxxxx` |
| `orderType` | string | No | The type of order. Set the value to **BUY**. Example: `BUY` |
| `payType` | string | No | The billing method of the instance. Valid values: Example: `Postpaid` |
| `quantity` | number | No | The number of the instances. Default value: **1**. Example: `1` |
| `regionId` | string | No | The region ID. You can call the DescribeRegions operation to query the most recent region list. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The resource group ID. You can call the DescribeDBInstanceAttribute operation to query the resource  Example: `rg-acfmx****` |
| `timeType` | string | Yes | The renewal cycle of the instance. Valid values: Example: `Year` |
| `usedTime` | number | Yes | The subscription duration of the instance. Valid values: Example: `1` |

## describeLocalAvailableRecoveryTime

**Signature:** `describeLocalAvailableRecoveryTime(request: DescribeLocalAvailableRecoveryTimeRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   MariaDB.

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceId` | string | Yes | The instance ID. Example: `rm-uf6wjk5xxxxxxx` |
| `region` | string | No | The region ID. You can call the DescribeRegions operation to query the most recent region list. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The resource group ID. Example: `rg-acfmy*****` |

## cloneDBInstance

**Signature:** `cloneDBInstance(request: CloneDBInstanceRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB ### [](#)References > Before you call this operation, carefully read the following documentation. Make sure that.

**Parameters:** See `CloneDBInstanceRequest` model.

## createDBInstanceEndpoint

**Signature:** `createDBInstanceEndpoint(request: CreateDBInstanceEndpointRequest)`

### [](#)Supported database engines MySQL ### [](#)References > Before you call this operation, carefully read the following documentation. Make sure that you fully understand the prerequisites and im.

**Parameters:** See `CreateDBInstanceEndpointRequest` model.

## deleteDBInstanceEndpoint

**Signature:** `deleteDBInstanceEndpoint(request: DeleteDBInstanceEndpointRequest)`

### [](#)Supported database engines MySQL ### [](#)References > Before you call this operation, carefully read the following documentation. Make sure that you fully understand the prerequisites and im.

**Parameters:** See `DeleteDBInstanceEndpointRequest` model.

## createDBInstanceForRebuild

**Signature:** `createDBInstanceForRebuild(request: CreateDBInstanceForRebuildRequest)`

### Supported database engines *   RDS MySQL *   RDS PostgreSQL *   RDS SQL Server *   RDS MariaDB ### References > : Fees are generated if the call is successful. Before you call this operation, care.

**Parameters:** See `CreateDBInstanceForRebuildRequest` model.

## rebuildDBInstance

**Signature:** `rebuildDBInstance(request: RebuildDBInstanceRequest)`

Dedicated clusters allow you to manage a number of instances at a time. You can create multiple dedicated clusters in a single region. Each dedicated cluster consists of multiple hosts. You can create.

**Parameters:** See `RebuildDBInstanceRequest` model.

## receiveDBInstance

**Signature:** `receiveDBInstance(request: ReceiveDBInstanceRequest)`

The operation is phased out..

**Parameters:** See `ReceiveDBInstanceRequest` model.

## purgeDBInstanceLog

**Signature:** `purgeDBInstanceLog(request: PurgeDBInstanceLogRequest)`

### Supported database engines *   MySQL *   SQL Server ### Description The system automatically uploads log backup files to Object Storage Service (OSS) buckets. If the remaining storage of an instan.

**Parameters:** See `PurgeDBInstanceLogRequest` model.

## rdsCustomInit

**Signature:** `rdsCustomInit(request: RdsCustomInitRequest)`

创建服务关联角色和开租.

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `regionId` | string | Yes | This parameter is required. Example: `cn-hangzhou` |
| `serviceLinkedRole` | string | Yes | This parameter is required. Example: `AliyunServiceRoleForRds` |

## queryNotify

**Signature:** `queryNotify(request: QueryNotifyRequest)`

### Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB ### Feature description The notifications are highlighted at the top of the ApsaraDB RDS console. The notifications i.

**Parameters:** (3 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `from` | string | Yes | The beginning of the time range to query. Specify the time in the ISO 8601 standard in the *yyyy-MM- Example: `2022-05-02T08:38:37Z` |
| `pageNumber` | number | No | The page number. Pages start from page 1. Default value: 1.**** Example: `1` |
| `pageSize` | number | No | The number of entries per page. Valid values: Example: `30` |
| `to` | string | Yes | The end of the time range to query. The end time must be later than the start time. Specify the time Example: `2022-05-09T08:38:37Z` |
| `withConfirmed` | boolean | Yes | Specifies whether the query results contain confirmed notifications. Valid values: Example: `false` |

## queryRecommendByCode

**Signature:** `queryRecommendByCode(request: QueryRecommendByCodeRequest)`

rds机器人热点问题.

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code` | string | Yes | The code. Example: `rds_recommend` |
| `resourceGroupId` | string | No | The resource group ID. Example: `rg-acfmy****` |


## checkInstanceExist

**Signature:** `checkInstanceExist(request: CheckInstanceExistRequest)`

You can call the CheckInstanceExist operation to query whether an ApsaraDB RDS instance exists..

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceId` | string | Yes | - |


## checkServiceLinkedRole

**Signature:** `checkServiceLinkedRole(request: CheckServiceLinkedRoleRequest)`

### [](#)Supported database engines *   PostgreSQL.

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerId` | number | No | - |
| `regionId` | string | Yes | The region ID. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The resource group ID. Example: `rg-bp67acfmxazb4p****` |
| `serviceLinkedRole` | string | Yes | The SLR name. Example: `AliyunServiceRoleForRdsPgsqlOnEcs` |


## createServiceLinkedRole

**Signature:** `createServiceLinkedRole(request: CreateServiceLinkedRoleRequest)`

### Supported database engine PostgreSQL ### References > Before you call this operation, read the following documentation and make sure that you fully understand the prerequisites and impacts of this.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerId` | number | No | - |
| `regionId` | string | Yes | The region ID. You can call the DescribeRegions operation to query the most recent region list. Example: `cn-hangzhou` |
| `serviceLinkedRole` | string | Yes | The name of the service-linked role. Example: `AliyunServiceRoleForRdsPgsqlOnEcs` |


## checkRdsCustomInit

**Signature:** `checkRdsCustomInit(request: CheckRdsCustomInitRequest)`

查看是否已创建服务关联角色（SLR）和是否开租.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `regionId` | string | Yes | This parameter is required. Example: `cn-beijing` |
| `resourceGroupId` | string | No | - Example: `None` |
| `serviceLinkedRole` | string | Yes | This parameter is required. Example: `AliyunServiceRoleForRds` |


## createDBNodes

**Signature:** `createDBNodes(request: CreateDBNodesRequest)`

### Supported database engines MySQL ### References > Before you call this operation, carefully read the following documentation. Make sure that you fully understand the prerequisites and impacts for .


## deleteDBNodes

**Signature:** `deleteDBNodes(request: DeleteDBNodesRequest)`

### [](#)Supported database engine MySQL ### [](#)References >  Before you call this operation, read the following topics and make sure that you fully understand the prerequisites and impacts of this .


## modifyDBNode

**Signature:** `modifyDBNode(request: ModifyDBNodeRequest)`

### [](#)Supported database engine *   MySQL ### [](#)References [Change instance specifications](https://help.aliyun.com/document_detail/2627998.html) >  Fees of an instance are changed if the call i.


## createOrderForDeleteDBNodes

**Signature:** `createOrderForDeleteDBNodes(request: CreateOrderForDeleteDBNodesRequest)`

### [](#)Supported database engines RDS MySQL ### [](#)References >  Before you call this operation, read the following topics and make sure that you fully understand the prerequisites and impacts of .


## createTempDBInstance

**Signature:** `createTempDBInstance(request: CreateTempDBInstanceRequest)`

### [](#)Supported database engines Your RDS instance runs SQL Server 2008 R2 with local disks. ### [](#)References > Before you call this operation, carefully read the following documentation. Make s.


## destroyDBInstance

**Signature:** `destroyDBInstance(request: DestroyDBInstanceRequest)`

The DestroyDBInstance operation is phased out..


## describeDBInstancesByExpireTime

**Signature:** `describeDBInstancesByExpireTime(request: DescribeDBInstancesByExpireTimeRequest)`

### Supported database engines *   RDS MySQL *   RDS PostgreSQL *   RDS SQL Server *   RDS MariaDB.


## describeDBInstancesByPerformance

**Signature:** `describeDBInstancesByPerformance(request: DescribeDBInstancesByPerformanceRequest)`

This operation is phased out..


## describeDBInstanceReplication

**Signature:** `describeDBInstanceReplication(request: DescribeDBInstanceReplicationRequest)`

### [](#)Supported database engines MySQL ### [](#)References >  Before you call this operation, read the following topics and make sure that you fully understand the prerequisites and impacts of this.


## describeDBInstanceCLS

**Signature:** `describeDBInstanceCLS(request: DescribeDBInstanceCLSRequest)`

查询RDS实例的列加密（CLS）配置信息.


## modifyDBInstanceCLS

**Signature:** `modifyDBInstanceCLS(request: ModifyDBInstanceCLSRequest)`

设置RDS实例开启/修改/关闭列加密状态.


## describeDBInstanceProxyConfiguration

**Signature:** `describeDBInstanceProxyConfiguration(request: DescribeDBInstanceProxyConfigurationRequest)`

### [](#)Supported database engines *   MySQL *   SQL Server ### [](#)Feature description This operation is used to query the shared proxy settings of an instance that runs MySQL or the read/write spl.


## describeCurrentModifyOrder

**Signature:** `describeCurrentModifyOrder(request: DescribeCurrentModifyOrderRequest)`

查询实例最新变配订单.

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `ETnLKlblzczshOTUbOCzxxxxxxxxxx` |
| `dbInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-bp1u775467ggm7j9j` |
| `regionId` | string | Yes | The region ID of the instance. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The resource group ID. Example: `rg-acfmy*****` |


## describeAvailableMetrics

**Signature:** `describeAvailableMetrics(request: DescribeAvailableMetricsRequest)`

### [](#)Supported database engines *   PostgreSQL ### [](#)References > Before you call this operation, carefully read the following documentation. Make sure that you fully understand the prerequisit.

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceName` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `pgm-bp1s1j103lo6****` |
| `resourceGroupId` | string | No | The resource group ID. Example: `rg-acfmy*****` |


## describeClassDetails

**Signature:** `describeClassDetails(request: DescribeClassDetailsRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB.

**Parameters:** (5 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `classCode` | string | Yes | The code of the instance type. Example: `rds.mysql.s3.large` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `ETnLKlblzczshOTUbOCz*****` |
| `commodityCode` | string | Yes | The commodity code of the instance. Valid values: Example: `rds` |
| `engine` | string | Yes | The type of the database engine. Example: `MySQL` |
| `engineVersion` | string | Yes | The database engine version of the instance. Example: `5.6` |
| `regionId` | string | Yes | The region ID. You can call the DescribeRegions operation to query the most recent region list. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The resource group ID. You can call the DescribeDBInstanceAttribute operation to query the resource  Example: `rg-acfmy*****` |


## listClasses

**Signature:** `listClasses(request: ListClassesRequest)`

### Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB.

**Parameters:** (2 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `ETnLKlblzczshOTUbOCzxxxxxxx` |
| `commodityCode` | string | Yes | The commodity code of the instances. Example: `bards_intl` |
| `DBInstanceId` | string | No | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-uf6wjk5xxxxxxx` |
| `engine` | string | No | The database engine of the instance. Valid values: Example: `MySQL` |
| `orderType` | string | Yes | The type of order that you want to query. Valid values: Example: `BUY` |
| `regionId` | string | No | The region ID. You can call the DescribeRegions operation to query the most recent region list. Example: `cn-hangzhou` |


## describeCustinsResourceInfo

**Signature:** `describeCustinsResourceInfo(request: DescribeCustinsResourceInfoRequest)`

查询实例资源使用情况.

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceIds` | string | Yes | The instance ID. You can call the [DescribeDBInstances](https://help.aliyun.com/document_detail/2623 Example: `rm-wz9s06u4drmqj4aqv` |
| `resourceGroupId` | string | No | The resource group ID. Example: `rg-acfmy*****` |


## modifyCustinsResource

**Signature:** `modifyCustinsResource(request: ModifyCustinsResourceRequest)`

修改实例资源.

**Parameters:** (1 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `adjustDeadline` | string | No | The deadline for the modification. Example: `2022-12-31` |
| `DBInstanceId` | string | Yes | The instance ID. You can call the [DescribeDBInstances](https://help.aliyun.com/document_detail/2623 Example: `rm-j5ekvfeengm******` |
| `increaseRatio` | string | No | The increase rate in percentage. Example: `10` |
| `resourceType` | string | No | The resource type. Example: `Memory` |
| `restoreOriginalSpecification` | string | No | The original value. This parameter must be specified when the **ResourceType** parameter is set to * Example: `200` |
| `targetValue` | number | No | The target value. This parameter is available only if you set the ScalingRuleType parameter to Targe Example: `3000` |


## describeResourceDetails

**Signature:** `describeResourceDetails(request: DescribeResourceDetailsRequest)`

概览页资源详情.

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `ETnLKlblzczshOTUbOCzxxxxxxxxxx` |
| `DBInstanceId` | string | Yes | The instance ID. Example: `rm-bp1ul2y10grt91m68` |
| `regionId` | string | Yes | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/26243.html Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The resource group ID. Example: `rg-acfm3kyoa2wqhyy` |


## describeResourceUsage

**Signature:** `describeResourceUsage(request: DescribeResourceUsageRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB.

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-uf6wjk5xxxxxxx` |
| `resourceGroupId` | string | No | The resource group ID. Example: `rg-acfmy*****` |


## describeSupportOnlineResizeDisk

**Signature:** `describeSupportOnlineResizeDisk(request: DescribeSupportOnlineResizeDiskRequest)`

### Supported database engine SQL Server.

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-uf6wjk5xxxxxxx` |


## evaluateLocalExtendDisk

**Signature:** `evaluateLocalExtendDisk(request: EvaluateLocalExtendDiskRequest)`

评估紧急本地扩容磁盘解锁可使用的磁盘空间.

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceName` | string | Yes | The instance name. Example: `rm-m5e999iqm65******` |
| `regionId` | string | Yes | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/26243.html Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The resource group ID. Example: `rg-ac****` |
| `storage` | number | No | The new storage capacity. Unit: GB. Example: `1000` |


## getDBInstanceTopology

**Signature:** `getDBInstanceTopology(request: GetDBInstanceTopologyRequest)`

### Supported database engines RDS MySQL.


## describeInstanceKeywords

**Signature:** `describeInstanceKeywords(request: DescribeInstanceKeywordsRequest)`

### [](#)Supported database engines *   RDS MySQL *   RDS PostgreSQL *   RDS SQL Server *   RDS MariaDB.

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | Yes | The type of reserved keyword to query. Valid values: Example: `account` |


## describeQuickSaleConfig

**Signature:** `describeQuickSaleConfig(request: DescribeQuickSaleConfigRequest)`

查询RDS快捷售卖配置.

**Parameters:** (0 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `commodity` | string | No | The product code. Valid values: Example: `rds` |
| `engine` | string | No | The database engine of the instance. Valid values: Example: `MySQL` |
| `regionId` | string | No | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/26243.html Example: `cn-hangzhou` |


## createYouhuiForOrder

**Signature:** `createYouhuiForOrder(request: CreateYouhuiForOrderRequest)`

下单领券接口.

**Parameters:** (3 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `activityId` | number | Yes | The activity ID. Example: `1711510887******` |
| `promotionId` | number | Yes | The promotion ID. You can call the GetResourcePrice operation to query the promotion ID. Example: `2000001******` |
| `regionId` | string | Yes | The region ID. You can call the DescribeRegions operation to query the most recent region list. Example: `cn-hangzhou` |


## describeMarketingActivity

**Signature:** `describeMarketingActivity(request: DescribeMarketingActivityRequest)`

获取RDS营销项目中待升级实例信息.

**Parameters:** (3 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `aliUid` | number | Yes | The ID of the Alibaba Cloud account. Example: `20725049` |
| `bid` | string | No | *   China site: 26842 *   International site: 26888 Example: `26842` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `ETnLKlblzczshOTUbOCzxxxxxxx` |
| `regionId` | string | Yes | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/26243.html Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The resource group ID. Example: `rg-acfmy*****` |
| `upgradeCode` | string | Yes | The service name. Example: `series` |


## describeRdsResourceSettings

**Signature:** `describeRdsResourceSettings(request: DescribeRdsResourceSettingsRequest)`

describeRdsResourceSettings operation.

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerId` | number | No | - |
| `resourceNiche` | string | Yes | The location of the notification. Example: `noticeBar` |


## describeVSwitchList

**Signature:** `describeVSwitchList(request: DescribeVSwitchListRequest)`

查询交换机列表.


## describeVSwitches

**Signature:** `describeVSwitches(request: DescribeVSwitchesRequest)`

### Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB.


## describeRegionInfos

**Signature:** `describeRegionInfos(request: DescribeRegionInfosRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB.

**Parameters:** (0 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `ETnLKlblzczshOTUbOCz*****` |
| `regionId` | string | No | The region ID. Example: `cn-hangzhou` |


## confirmNotify

**Signature:** `confirmNotify(request: ConfirmNotifyRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server *   MariaDB ### [](#)Feature description After you call the [QueryNotify](https://help.aliyun.com/document_detail/610443.htm.

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `confirmor` | number | Yes | The ID of the Alibaba Cloud account that is used to confirm the notification. You can set this param Example: `0` |
| `notifyIdList` | number[] | Yes | The notification IDs. |


## activateMigrationTargetInstance

**Signature:** `activateMigrationTargetInstance(request: ActivateMigrationTargetInstanceRequest)`

### [](#)Supported database engines *   PostgreSQL ### [](#)References > : Before you call this operation, carefully read the following documentation. Make sure that you fully understand the prerequis.

**Parameters:** (1 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceName` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `pgm-bp102g323jd4****` |
| `forceSwitch` | string | No | Specifies whether to forcefully perform a switchover. Set the value to 1. The value 1 specifies a fo Example: `1` |
| `switchTime` | string | No | A reserved parameter. This parameter does not take effect. Example: `2022-02-25T06:57:41Z` |
| `switchTimeMode` | string | No | The time when you want to perform the switchover. Example: `0` |


## modifyDBInstanceDelayedReplicationTime

**Signature:** `modifyDBInstanceDelayedReplicationTime(request: ModifyDBInstanceDelayedReplicationTimeRequest)`

### [](#)Supported database engines *   MySQL ### [](#)References > Before you call this operation, carefully read the following documentation. Make sure that you fully understand the prerequisites an.


## modifyDBInstanceReplicationSwitch

**Signature:** `modifyDBInstanceReplicationSwitch(request: ModifyDBInstanceReplicationSwitchRequest)`

If you want to enable the native replication feature for an ApsaraDB RDS for MySQL instance, the following requirements must be met: *   The RDS instance runs MySQL 5.7. *   The RDS instance runs RDS .


## modifyDBInstanceVectorSupportStatus

**Signature:** `modifyDBInstanceVectorSupportStatus(request: ModifyDBInstanceVectorSupportStatusRequest)`

修改实例向量支持状态.


## modifyCollationTimeZone

**Signature:** `modifyCollationTimeZone(request: ModifyCollationTimeZoneRequest)`

### [](#)Supported database engines RDS SQL Server ### [](#)References >  Before you call this operation, read the following topics and make sure that you fully understand the prerequisites and impact.

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `collation` | string | No | The character set collation of the instance. By default, the system does not modify the character se Example: `Latin1_General_CI_AS` |
| `DBInstanceId` | string | Yes | The instance ID. Example: `rm-uf6wjk5xxxxxxx` |
| `timezone` | string | No | The time zone of the instance. By default, the system does not modify the time zone. Example: `China` |


## migrateConnectionToOtherZone

**Signature:** `migrateConnectionToOtherZone(request: MigrateConnectionToOtherZoneRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL *   SQL Server ### [](#)References > Before you call this operation, read the following documentation and make sure that you fully understa.

**Parameters:** (3 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `connectionString` | string | Yes | The endpoint of the instance. The endpoint is specified when you create the instance. Example: `rm-bp1oypo6ky19y****` |
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-bp1oypo6ky19y****` |
| `zoneId` | string | Yes | The ID of the zone. Example: `cn-hangzhou-i` |


## migrateDBInstance

**Signature:** `migrateDBInstance(request: MigrateDBInstanceRequest)`

Dedicated clusters allow you to manage a number of instances at a time. You can create multiple dedicated clusters in a single region. Each dedicated cluster consists of multiple hosts. You can create.


## migrateDBNodes

**Signature:** `migrateDBNodes(request: MigrateDBNodesRequest)`

Changes the zone of a node from an ApsaraDB RDS for MySQL instance that runs RDS Cluster Edition..


## migrateSecurityIPMode

**Signature:** `migrateSecurityIPMode(request: MigrateSecurityIPModeRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL ### [](#)References > Before you call this operation, carefully read the following documentation. Make sure that you fully understand the p.


## migrateToOtherZone

**Signature:** `migrateToOtherZone(request: MigrateToOtherZoneRequest)`

### [](#)Supported database engines *   RDS MySQL *   RDS PostgreSQL *   RDS SQL Server ### [](#)References > : Before you call this operation, carefully read the following documentation. Make sure th.

**Parameters:** (2 required, 12 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | string | No | The RDS edition of the instance. Valid values: Example: `HighAvailability` |
| `DBInstanceClass` | string | No | The new instance type of the instance. You can change the instance type of the instance. You cannot  Example: `mysql.x4.xlarge.2` |
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-uf6wjk5xxxxxxxxxx` |
| `DBInstanceStorage` | number | No | The new storage capacity of the instance. If you set **IsModifySpec** to **true**, you must specify  Example: `500` |
| `DBInstanceStorageType` | string | No | The storage type of the instance. Valid values: Example: `local_ssd` |
| `effectiveTime` | string | No | The time when you want the change to take effect. Valid values: Example: `Immediate` |
| `ioAccelerationEnabled` | string | No | A reserved parameter. Example: `0` |
| `isModifySpec` | string | No | Specifies whether to change the specifications of the instance during the cross-zone migration. Vali Example: `true` |
| `switchTime` | string | No | The migration time. Specify the time in the ISO 8601 standard in the *yyyy-MM-dd*T*HH:mm:ss*Z format Example: `2021-12-14T15:15:15Z` |
| `VPCId` | string | No | The ID of the virtual private cloud (VPC). Do not change the VPC of the instance when you migrate th Example: `vpc-xxxxxxx` |
| `vSwitchId` | string | No | The vSwitch ID. Example: `vsw-uf6adz52c2pxxxxxxx` |
| `zoneId` | string | Yes | The ID of the destination zone. You can call the DescribeRegions operation to query the most recent  Example: `cn-hangzhou-b` |
| `zoneIdSlave1` | string | No | The secondary zone 1 of the instance. Example: `cn-hangzhou-c` |
| `zoneIdSlave2` | string | No | The secondary zone 2 of the instance. Example: `cn-hangzhou-d` |


## modifyComputeBurstConfig

**Signature:** `modifyComputeBurstConfig(request: ModifyComputeBurstConfigRequest)`

### [](#)Supported database engine RDS PostgreSQL ### [](#)References [Assured serverless](https://help.aliyun.com/document_detail/2928780.html).

**Parameters:** (2 required, 12 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `burstStatus` | string | No | This parameter is set to **disabled** if the assured serverless feature is disabled. Example: `disabled` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of requests and prevent repeated requests fr Example: `ETnLKlblzczshOTUbOCziJZNwH****` |
| `cpuEnlargeThreshold` | string | No | The CPU utilization threshold for **scale-out**. Valid values: 60 to 90. Unit: %. Example: `80` |
| `cpuShrinkThreshold` | string | No | The CPU utilization threshold for **scale-in**. Valid values: 30 to 55. Unit: %. Example: `50` |
| `crontabJobId` | string | No | The reserved parameter. This parameter is not supported. Example: `None` |
| `DBInstanceId` | string | Yes | The instance ID. Example: `pgm-2ze63v2p3o3k****` |
| `memoryEnlargeThreshold` | string | No | The memory usage threshold for **scale-out**. Valid values: 60 to 90. Unit: %. Example: `80` |
| `memoryShrinkThreshold` | string | No | The memory usage threshold for **scale-in**. Valid values: 30 to 55. Unit: %. Example: `50` |
| `resourceGroupId` | string | No | The resource group ID. Example: `rg-acfmy****` |
| `scaleMaxCpus` | string | No | The maximum number of CPU cores for elastic scaling. The maximum value cannot exceed twice the initi Example: `2` |
| `scaleMaxMemory` | string | No | The maximum memory for elastic scaling. The value cannot exceed twice the instance\\"s initial memor Example: `4` |
| `switchTime` | string | Yes | The time when the specified entry takes effect. The time follows the ISO 8601 standard in the `yyyy- Example: `2025-05-06T09:24:00Z` |
| `switchTimeMode` | string | No | The effective policy. Valid values: Example: `Immediate` |
| `taskId` | string | No | The reserved parameter. This parameter is not supported. Example: `None` |


## describeComputeBurstConfig

**Signature:** `describeComputeBurstConfig(request: DescribeComputeBurstConfigRequest)`

### [](#)Supported database engine RDS PostgreSQL ### [](#)References [Assured serverless](https://help.aliyun.com/document_detail/2928780.html).

**Parameters:** (1 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of requests and prevent repeated requests fr Example: `ETnLKlblzczshOTUbOCzxxxxxxxxxx` |
| `DBInstanceId` | string | Yes | The instance ID. Example: `pgm-2ze63v2p3o3k****` |
| `regionId` | Buffer | No | The ID of the region in which the instance resides. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The resource group ID. Example: `rg-acfmy*****` |


## modifyDasInstanceConfig

**Signature:** `modifyDasInstanceConfig(request: ModifyDasInstanceConfigRequest)`

### [](#)Supported database engines *   MySQL *   PostgreSQL ### [](#)References > Before you call this operation, carefully read the following documentation. Make sure that you fully understand the p.

**Parameters:** (2 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `ETnLKlblzczshOTUbOCz*****` |
| `DBInstanceId` | string | Yes | The instance ID. You can call the DescribeDBInstances operation to query the instance ID. Example: `rm-uf6wjk5*****` |
| `storageAutoScale` | string | Yes | Specifies whether to enable automatic storage expansion. Valid values: Example: `Enable` |
| `storageThreshold` | number | No | The threshold in percentage based on which an automatic storage expansion is triggered. If the avail Example: `50` |
| `storageUpperBound` | number | No | The maximum storage capacity that is allowed for an automatic storage expansion. The value of this p Example: `1000` |

