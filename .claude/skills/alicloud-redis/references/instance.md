# Instance Management

Instance CRUD, lifecycle, specification changes, restart, network, and status queries.

## createInstance

**Signature:** `createInstance(request: CreateInstanceRequest)`

Before you call this operation, make sure that you understand the billing methods and [pricing](https://help.aliyun.com/document_detail/54532.html) of Tair (Redis OSS-compatible). You can call this op.

**Parameters:** (3 required, 43 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `autoRenewPeriod` | string | Yes | The subscription duration that is supported by auto-renewal. Unit: month. Valid values: **1**, **2** Example: `3` |
| `dedicatedHostGroupId` | string | Yes | The ID of the dedicated cluster. This parameter is required if you create an instance in a dedicated Example: `dhg-uv4fnk6r7zff****` |
| `regionId` | string | Yes | The ID of the region where you want to create the instance. You can call the [DescribeRegions](https Example: `cn-hangzhou` |
| `key` | string | No | The keys of the tags that are added to the instance. Example: `testkey` |
| `value` | string | No | The values of the tags that are added to the instance. Example: `testvalue` |
| `appendonly` | string | No | Specifies whether to enable append-only file (AOF) persistence for the instance. Valid values: Example: `yes` |
| `autoRenew` | string | No | Specifies whether to enable auto-renewal for the instance. Valid values: Example: `true` |
| `autoUseCoupon` | string | No | Specifies whether to use a coupon. Valid values: Example: `false` |
| `backupId` | string | No | If your instance is a cloud-native cluster instance, we recommend that you use [DescribeClusterBacku Example: `111111111` |
| `businessInfo` | string | No | The ID of the promotional event or business information. Example: `000000000` |
| `capacity` | number | No | The storage capacity of the instance. Unit: MB. Example: `16384` |
| `chargeType` | string | No | The billing method of the instance. Valid values: Example: `PostPaid` |
| `clusterBackupId` | string | No | This parameter is supported for specific new cluster instances. You can query the backup set ID by u Example: `cb-hyxdof5x9kqbtust` |
| `connectionStringPrefix` | string | No | The operation that you want to perform. Set the value to **AllocateInstancePublicConnection**. Example: `r-bp1zxszhcgatnx****` |
| `couponNo` | string | No | The coupon code. Default value: `default`. Example: `youhuiquan_promotion_option_id_for_blank` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Example: `false` |
| `engineVersion` | string | No | The engine version. Valid values for **classic instances**: Example: `4.0` |
| `globalInstance` | boolean | No | Specifies whether to use the new instance as the first child instance of a distributed instance. Val Example: `false` |
| ... | ... | ... | *28 more optional parameters* |

## createInstances

**Signature:** `createInstances(request: CreateInstancesRequest)`

Before you call this operation, make sure that you understand the billing methods and [pricing](https://help.aliyun.com/document_detail/54532.html) of Tair (Redis OSS-compatible). >  You can call this.

**Parameters:** (1 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `autoPay` | boolean | No | Specifies whether to enable automatic payment. Valid values: Example: `true` |
| `autoRenew` | string | No | Specifies whether to enable auto-renewal for the instance. Default value: false. Valid values: Example: `false` |
| `businessInfo` | string | No | The additional business information about the instance. Example: `000000000` |
| `couponNo` | string | No | The coupon code. Default value: `youhuiquan_promotion_option_id_for_blank`. Example: `youhuiquan_promotion_option_id_for_blank` |
| `engineVersion` | string | No | The database engine version of the instance. Valid values: **4.0** and **5.0**. Example: `5.0` |
| `instances` | string | Yes | The JSON-formatted configurations of the instance. For more information, see the "Additional descrip Example: `[{` |
| `rebuildInstance` | boolean | No | Specifies whether to restore the source instance from the recycle bin. Valid values: Example: `false` |
| `resourceGroupId` | string | No | The ID of the resource group to which to assign the instance. Example: `rg-resourcegroupid1` |
| `token` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `ETnLKlblzczshOTUbOCz****` |

## deleteInstance

**Signature:** `deleteInstance(request: DeleteInstanceRequest)`

For more information about how to perform the corresponding operation in the console, see [Release an instance](https://help.aliyun.com/document_detail/43882.html). Before you call this operation, mak.

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `globalInstanceId` | string | No | The ID of the distributed instance to which the instance belongs. This parameter is applicable to on Example: `gr-bp14rkqrhac****` |
| `instanceId` | string | Yes | The ID of the instance that you want to release. Example: `r-bp1zxszhcgatnx****` |

## describeInstances

**Signature:** `describeInstances(request: DescribeInstancesRequest)`

Queries the information about one or more Tair (Redis OSS-compatible) instances..

**Parameters:** (0 required, 23 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The tag key. A tag is a key-value pair. Example: `Storage` |
| `value` | string | No | The tag value. Example: `Local` |
| `architectureType` | string | No | The architecture of the instance. Valid values: Example: `standard` |
| `chargeType` | string | No | The billing method of the instance. Valid values: Example: `PostPaid` |
| `editionType` | string | No | The edition of the instance. Valid values: Example: `Enterprise` |
| `engineVersion` | string | No | The database engine version of the instance. Valid values: **2.8**, **4.0**, **5.0**, **6.0**, and * Example: `4.0` |
| `expired` | string | No | Specifies whether the instance has expired. Valid values: Example: `false` |
| `globalInstance` | boolean | No | Specifies whether to return the child instances of distributed instances. Valid values: Example: `true` |
| `instanceClass` | string | No | The instance type of the instance. For more information, see [Instance types](https://help.aliyun.co Example: `redis.master.small.default` |
| `instanceIds` | string | No | The IDs of the instances that you want to query. Example: `r-bp1zxszhcgatnx****` |
| `instanceStatus` | string | No | The state of the instance. Valid values: Example: `Normal` |
| `instanceType` | string | No | The database engine. Valid values: Example: `Redis` |
| `networkType` | string | No | The network type. Valid values: Example: `CLASSIC` |
| `pageNumber` | number | No | The page number. Pages start from page **1**. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Maximum value: **50**. Default value: **30**. Example: `10` |
| `privateIp` | string | No | The private IP address of the instance. Example: `172.16.49.***` |
| `regionId` | string | No | The region ID of the instance. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which the instance belongs. Example: `rg-acfmyiu4ekp****` |
| `searchKey` | string | No | The keyword used for fuzzy search. The keyword can be based on an instance name or an instance ID. Example: `apitest` |
| `tag` | DescribeInstancesRequestTag[] | No | - |
| `vSwitchId` | string | No | The ID of the vSwitch. Example: `vsw-bp1e7clcw529l773d****` |
| `vpcId` | string | No | The ID of the VPC. Example: `vpc-bp1nme44gek34slfc****` |
| `zoneId` | string | No | The zone ID of the instance. Example: `cn-hongkong-b` |

## describeInstancesOverview

**Signature:** `describeInstancesOverview(request: DescribeInstancesOverviewRequest)`

If you do not specify the InstanceIds parameter when you call this operation, the overview information of all instances is returned. > This operation returns non-paged results..

**Parameters:** (0 required, 16 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `architectureType` | string | No | The architecture of the instance. Valid values: Example: `standard` |
| `chargeType` | string | No | The billing method of the instance. Valid values: Example: `PostPaid` |
| `editionType` | string | No | The edition of the instance. Valid values: Example: `Enterprise` |
| `engineVersion` | string | No | The engine version of the instance. Valid values: **2.8**, **4.0**, **5.0**, **6.0**, and **7.0**. Example: `4.0` |
| `instanceClass` | string | No | The instance type of the instance. For more information, see [Instance types](https://help.aliyun.co Example: `redis.master.small.default` |
| `instanceIds` | string | No | The IDs of instances. Example: `r-bp1zxszhcgatnx****` |
| `instanceStatus` | string | No | The state of the instance. Valid values: Example: `Normal` |
| `instanceType` | string | No | The category of the instance. Valid values: Example: `Redis` |
| `networkType` | string | No | The network type of the instance. Valid values: Example: `CLASSIC` |
| `privateIp` | string | No | The private IP address of the instance. Example: `172.16.49.***` |
| `regionId` | string | No | The ID of the region in which the instances you want to query reside. You can call the [DescribeRegi Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which the instances you want to query belong. Example: `rg-acfmyiu4ekp****` |
| `searchKey` | string | No | The keyword used for fuzzy search. The keyword can be based on an instance ID or an instance descrip Example: `apitest` |
| `vSwitchId` | string | No | The ID of the vSwitch. Example: `vsw-bp1e7clcw529l773d****` |
| `vpcId` | string | No | The ID of the VPC. Example: `vpc-bp1nme44gek34slfc****` |
| `zoneId` | string | No | The zone ID of the instance. Example: `cn-hangzhou-b` |

## describeInstanceAttribute

**Signature:** `describeInstanceAttribute(request: DescribeInstanceAttributeRequest)`

Queries the attribute of Tair (Redis OSS-compatible) instances..

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `r-bp1zxszhcgatnx****` |

## describeAvailableResource

**Signature:** `describeAvailableResource(request: DescribeAvailableResourceRequest)`

Queries the types of Tair (Redis OSS-compatible) instances that can be created in a specified zone..

**Parameters:** (1 required, 10 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The display language of the response. Valid values: Example: `zh-CN` |
| `engine` | string | No | The database engine of the instance. Valid values: Example: `Redis` |
| `instanceChargeType` | string | No | The billing method. Valid values: Example: `PrePaid` |
| `instanceId` | string | No | The ID of the instance. Example: `r-bp1zxszhcgatnx****` |
| `instanceScene` | string | No | The edition of the instance. Valid values: Example: `professional` |
| `nodeId` | string | No | The ID of the data node for which you want to query available resources that can be created. You can Example: `r-bp1zxszhcgatnx****-db-0` |
| `orderType` | string | No | The order type. Valid values: Example: `BUY` |
| `productType` | string | No | The instance type. Default value: Local. Valid values: Example: `Local` |
| `regionId` | string | Yes | The region ID of the instance. You can call the [DescribeRegions](https://help.aliyun.com/document_d Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which the instance belongs. You can call the [ListResourceGroups](ht Example: `rg-acfmyiu4e******` |
| `zoneId` | string | No | The zone ID of the instance. You can call the [DescribeZones](https://help.aliyun.com/document_detai Example: `cn-hangzhou-h` |

## describeRegions

**Signature:** `describeRegions(request: DescribeRegionsRequest)`

Queries the regions in which ApsaraDB for Redis instances can be created..

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The display language of the **LocalName** parameter value. Valid values: Example: `zh-CN` |

## describeZones

**Signature:** `describeZones(request: DescribeZonesRequest)`

Queries the zones available for Tair (Redis OSS-compatible)..

**Parameters:** (0 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `acceptLanguage` | string | No | The display language of the zone names to return. Valid values: Example: `en-US` |
| `regionId` | string | No | The region ID. Example: `cn-huhehaote` |

## describePrice

**Signature:** `describePrice(request: DescribePriceRequest)`

Queries the fees that you must pay when you create, upgrade, or renew a Tair (Redis OSS-compatible) instance..

**Parameters:** (2 required, 15 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `businessInfo` | string | No | The extended information such as the promotional event ID and business information. Example: `000000000000` |
| `capacity` | number | No | The storage capacity of the instance. Unit: MB. This parameter is used only to query Redis Open-Sour Example: `1024` |
| `chargeType` | string | No | The billing method. Valid values: Example: `PostPaid` |
| `couponNo` | string | No | The coupon code. Default value: youhuiquan_promotion_option_id_for_blank. This value indicates that  Example: `youhuiquan_promotion_option_id_for_blank` |
| `engineVersion` | string | No | The engine version of the instance. Valid values: **2.8**, **4.0**, and **5.0**. Example: `5.0` |
| `forceUpgrade` | boolean | No | Specifies whether to forcefully change the configurations of the instance. Valid values: Example: `true` |
| `instanceClass` | string | No | The instance type.**** **To view the instance type, perform the following steps:** Example: `redis.master.small.default` |
| `instanceId` | string | Yes | The instance ID. Example: `r-bp1zxszhcgatnx****` |
| `instances` | string | No | If you want to query cloud-native read/write splitting instances, Tair ESSD-based instances, or inst Example: `Instances=[{"RegionId":` |
| `nodeType` | string | No | The node type. Valid values: Example: `MASTER_SLAVE` |
| `orderParamOut` | string | No | Specifies whether to return parameters related to the order. Valid values: Example: `true` |
| `orderType` | string | Yes | The order type. Valid values: Example: `BUY` |
| `period` | number | No | The subscription duration. Unit: month. Valid values: **1**, 2, 3, 4, 5, 6, 7, 8, **9**, **12**, **2 Example: `3` |
| `quantity` | number | No | The number of instances that you want to purchase. Valid values: **1** to **30**. Default value: **1 Example: `1` |
| `regionId` | string | No | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/473763.htm Example: `cn-hangzhou` |
| `shardCount` | number | No | The number of data shards in the cloud-native cluster instance. Example: `2` |
| `zoneId` | string | No | The zone ID. You can call the [DescribeZones](https://help.aliyun.com/document_detail/473764.html) o Example: `cn-hangzhou-e` |

## describeHistoryMonitorValues

**Signature:** `describeHistoryMonitorValues(request: DescribeHistoryMonitorValuesRequest)`

You can also query the performance monitoring data of an instance in the Tair console. For more information, see [Metrics](https://help.aliyun.com/document_detail/43887.html)..

**Parameters:** (4 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `endTime` | string | Yes | The end of the time range to query. The end time must be later than the start time. Specify the time Example: `2022-11-06T00:30:00Z` |
| `instanceId` | string | Yes | The ID of the instance. Example: `r-bp1zxszhcgatnx****` |
| `intervalForHistory` | string | Yes | This parameter is deprecated. Set the value to `01m`. Example: `01m` |
| `monitorKeys` | string | No | The monitoring metrics. Separate the metrics with commas (,). Take CpuUsage as an example: Example: `memoryUsage` |
| `nodeId` | string | No | The ID of the node in the instance. You can set this parameter to query the data of a specified node Example: `r-bp1zxszhcgatnx****-db-0#1679****` |
| `nodeRole` | string | No | If you want to query the metrics of the read replicas in a cloud-native read/write splitting instanc Example: `READONLY` |
| `startTime` | string | Yes | The beginning of the time range to query. Specify the time in the *yyyy-MM-dd*T*HH:mm:ss*Z format. T Example: `2022-11-06T00:00:00Z` |

## modifyInstanceAttribute

**Signature:** `modifyInstanceAttribute(request: ModifyInstanceAttributeRequest)`

You can also modify the information of an instance in the Tair (Redis OSS-compatible) console. For more information, see [Change or reset the password](https://help.aliyun.com/document_detail/43874.ht.

**Parameters:** (1 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `r-bp1zxszhcgatnx****` |
| `instanceName` | string | No | The new name of the instance. The name must be 2 to 80 characters in length. The name must start wit Example: `newinstancename` |
| `instanceReleaseProtection` | boolean | No | [Specifies whether to enable release protection for the instance.](https://help.aliyun.com/document_ Example: `true` |
| `newPassword` | string | No | The new password for the default account. The default account is named after the instance ID. Exampl Example: `uW8+nsrp` |

## modifyInstanceSpec

**Signature:** `modifyInstanceSpec(request: ModifyInstanceSpecRequest)`

>  For more information about the procedure, impacts, limits, and fees of this operation, see [Change the configurations of an instance](https://help.aliyun.com/document_detail/26353.html)..

**Parameters:** (4 required, 17 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `autoPay` | boolean | No | Specifies whether to enable automatic payment. Valid values: Example: `true` |
| `businessInfo` | string | No | The ID of the promotional event or the business information. Example: `000000001` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `ETnLKlblzczshOTUbOCz****` |
| `couponNo` | string | No | The coupon code. Default value: `youhuiquan_promotion_option_id_for_blank`. Example: `youhuiquan_promotion_option_id_for_blank` |
| `effectiveTime` | string | No | The time when you want the configurations to be changed. Valid values: Example: `Immediately` |
| `forceTrans` | boolean | No | Specifies whether to enable forced transmission during a configuration change. Valid values: Example: `false` |
| `forceUpgrade` | boolean | No | Specifies whether to forcibly change the configurations. Valid values: Example: `true` |
| `instanceClass` | string | No | The new instance type. You can call the [DescribeAvailableResource](https://help.aliyun.com/document Example: `redis.master.small.default` |
| `instanceId` | string | Yes | The instance ID. You can call the [DescribeInstances](https://help.aliyun.com/document_detail/473778 Example: `r-bp1zxszhcgatnx****` |
| `majorVersion` | string | No | The major version of the classic instance that you want to upgrade. Valid values: **2.8**, **4.0**,  Example: `5.0` |
| `nodeType` | string | No | The type of the node. Valid values: Example: `MASTER_SLAVE` |
| `orderType` | string | Yes | The change type. This parameter is required when you change the configurations of a subscription ins Example: `DOWNGRADE` |
| `readOnlyCount` | number | No | The number of read replicas in the primary zone. Valid values: 0 to 5. This parameter applies only t Example: `5` |
| `regionId` | string | No | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/473763.htm Example: `cn-hangzhou` |
| `replicaCount` | number | No | The number of replica nodes in the primary zone. This parameter is applicable only to cloud-native m Example: `1` |
| `shardCount` | number | No | The number of shards. This parameter is applicable only to cloud-native cluster instances. Example: `8` |
| `slaveReadOnlyCount` | number | No | The number of read replicas in the secondary zone when you create a read/write splitting instance th Example: `2` |
| `slaveReplicaCount` | number | No | The number of replica nodes in the secondary zone when you create a cloud-native multi-replica clust Example: `1` |
| `sourceBiz` | string | No | The source of the operation. This parameter is used only for internal maintenance. You do not need t Example: `SDK` |
| `storage` | number | Yes | The storage capacity of the ESSD/SSD-based instance. The valid values vary based on the instance typ Example: `60` |
| `storageType` | string | Yes | The storage type. Valid values: **essd_pl1**, **essd_pl2**, and **essd_pl3**. Example: `essd_pl1` |

## modifyInstanceMajorVersion

**Signature:** `modifyInstanceMajorVersion(request: ModifyInstanceMajorVersionRequest)`

For more information about the precautions and impacts of the upgrade, see [Upgrade the major version](https://help.aliyun.com/document_detail/101764.html)..

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `effectiveTime` | string | No | The time when you want to upgrade the major version. Valid values: Example: `Immediately` |
| `instanceId` | string | Yes | The ID of the instance. Example: `r-bp1zxszhcgatnx****` |
| `majorVersion` | string | Yes | The major version to which you want to upgrade the instance. Valid values: **4.0** and **5.0**. Example: `5.0` |

## modifyInstanceMinorVersion

**Signature:** `modifyInstanceMinorVersion(request: ModifyInstanceMinorVersionRequest)`

The procedure to update the minor version of an instance varies based on types of Tair (Redis OSS-compatible) instances. For more information, see [Upgrade the minor version](https://help.aliyun.com/d.

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `effectiveTime` | string | No | The time when you want to update the minor version. Valid values: Example: `Immediately` |
| `instanceId` | string | Yes | The ID of the instance. Example: `r-bp1zxszhcgatnx****` |
| `minorversion` | string | No | The minor version to which you want to update. Default value: **latest_version**. Example: `latest_version` |

## modifyDBInstanceAutoUpgrade

**Signature:** `modifyDBInstanceAutoUpgrade(request: ModifyDBInstanceAutoUpgradeRequest)`

Modifies the setting related to the automatic update of minor versions for an instance..

**Parameters:** See `ModifyDBInstanceAutoUpgradeRequest` model.

## modifyInstanceMaintainTime

**Signature:** `modifyInstanceMaintainTime(request: ModifyInstanceMaintainTimeRequest)`

You can also modify the maintenance window of an instance in the Tair (Redis OSS-compatible) console. For more information, see [Set a maintenance window](https://help.aliyun.com/document_detail/55252.

**Parameters:** (3 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `r-bp1zxszhcgatnx****` |
| `maintainEndTime` | string | Yes | The end time of the maintenance window. The time is in the *HH:mm*Z format. The time is displayed in Example: `04:00Z` |
| `maintainStartTime` | string | Yes | The start time of the maintenance window. The time is in the *HH:mm*Z format. The time is displayed  Example: `03:00Z` |

## modifyInstanceConfig

**Signature:** `modifyInstanceConfig(request: ModifyInstanceConfigRequest)`

Modifies the parameter settings of a Tair (Redis OSS-compatible) instance..

**Parameters:** (1 required, 7 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `config` | string | No | 需修改的实例参数，格式为JSON，修改后的值会覆盖原来的值。例如您只希望修改**maxmemory-policy**参数为**noeviction**，您可以传入`{"maxmemory-policy Example: `{"maxmemory-policy":"volatile-lru","zset-max-ziplist-entries":128,"zset-max-ziplist-value":64,"hash-max-ziplist-entries":512,"set-max-intset-entries":512}` |
| `instanceId` | string | Yes | 实例ID。 Example: `r-bp1zxszhcgatnx****` |
| `paramNoLooseSentinelEnabled` | string | No | 哨兵兼容模式，适用于非集群实例。取值说明： * **no**（默认）：未开启 * **yes**：开启 > 更多信息请参见[Sentinel兼容模式](https://help.aliyun.com/ Example: `yes` |
| `paramNoLooseSentinelPasswordFreeAccess` | string | No | 开启哨兵模式时，是否允许免密执行Sentinel相关命令，取值说明： * **no**（默认）：关闭。 * **yes**：开启。开启后，可以在任意连接上免密执行Sentinel命令以及使用SENTI Example: `****` |
| `paramNoLooseSentinelPasswordFreeCommands` | string | No | 启用哨兵模式及ParamNoLooseSentinelPasswordFreeAccess参数后，可通过本参数添加额外的免密命令列表（默认为空）。 > * 设置后可在任意连接上无需密码执行对应命令，请 Example: `****` |
| `paramReplMode` | string | No | 同步模式： * **async**（默认）：异步 * **semisync**：半同步 Example: `async` |
| `paramSemisyncReplTimeout` | string | No | 半同步模式的降级阈值。仅半同步支持配置该参数，单位为ms，取值范围为10~60000，默认为500。 > * 当同步延迟超出该阈值时，同步模式会自动转为异步，当同步延迟消除后，同步模式会自动转换为半同 Example: `500` |
| `paramSentinelCompatEnable` | string | No | 哨兵兼容模式，适用于集群架构代理连接模式或读写分离架构的实例，取值说明： * **0**（默认）：未开启 * **1**：开启 > 更多信息请参见[Sentinel兼容模式](https://help Example: `1` |

## modifyInstanceBandwidth

**Signature:** `modifyInstanceBandwidth(request: ModifyInstanceBandwidthRequest)`

Before you call this operation, make sure that you understand the billing methods and pricing of instance bandwidth. Tair (Redis OSS-compatible) charges fees per hour based on the amount and usage dur.

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. You can call the [DescribeInstances](https://help.aliyun.com/document_detail Example: `r-bp1zxszhcgatnx****` |
| `targetIntranetBandwidth` | string | Yes | The total expected bandwidth of the instance. Example: `260` |

## modifyIntranetAttribute

**Signature:** `modifyIntranetAttribute(request: ModifyIntranetAttributeRequest)`

>  *   This operation is applicable only to an instance that is deployed in a dedicated cluster. To adjust the bandwidth of a standard instance, call the [EnableAdditionalBandwidth](https://help.aliyu.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bandWidth` | number | No | The amount of bandwidth that you want to add. Unit: Mbit/s. The value must be an integer greater tha Example: `10` |
| `instanceId` | string | Yes | The ID of the instance. Example: `r-bp1zxszhcgatnx****` |
| `nodeId` | string | Yes | The ID of the data node. You can call the [DescribeClusterMemberInfo](https://help.aliyun.com/docume Example: `r-bp1zxszhcgatnx****-db-0` |

## modifyInstanceVpcAuthMode

**Signature:** `modifyInstanceVpcAuthMode(request: ModifyInstanceVpcAuthModeRequest)`

When the password-free access feature is enabled, Elastic Compute Service (ECS) instances in the same virtual private cloud (VPC) can connect to the Tair instance without a password. You can also use .

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `r-bp1zxszhcgatnx****` |
| `vpcAuthMode` | string | Yes | Specifies whether to disable password-free access. Valid values: Example: `Close` |

## modifyDBInstanceConnectionString

**Signature:** `modifyDBInstanceConnectionString(request: ModifyDBInstanceConnectionStringRequest)`

You can also modify the endpoint or port number of an instance in the Tair (Redis OSS-compatible) console. For more information, see [Change the endpoint or port number of an instance](https://help.al.

**Parameters:** See `ModifyDBInstanceConnectionStringRequest` model.

## modifyDBInstanceMonitor

**Signature:** `modifyDBInstanceMonitor(request: ModifyDBInstanceMonitorRequest)`

Modifies the monitoring granularity of a Tair (Redis OSS-compatible) instance..

**Parameters:** See `ModifyDBInstanceMonitorRequest` model.

## restartInstance

**Signature:** `restartInstance(request: RestartInstanceRequest)`

Restarts a running ApsaraDB for Redis instance..

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `effectiveTime` | string | No | The time when you want to restart the instance. Default value: Immediately. Valid values: Example: `Immediately` |
| `instanceId` | string | Yes | The ID of the instance. Example: `r-bp1zxszhcgatnx****` |
| `upgradeMinorVersion` | boolean | No | Specifies whether to update to the latest minor version when the instance is restarted. Valid values Example: `true` |

## flushInstance

**Signature:** `flushInstance(request: FlushInstanceRequest)`

Clears the data of a Tair (Redis OSS-compatible) instance. The cleared data cannot be restored..

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the request. Example: `r-bp1zxszhcgatnx****` |

## switchInstanceHA

**Signature:** `switchInstanceHA(request: SwitchInstanceHARequest)`

> For more information about nearby access to applications that are deployed across zones, see [Switch node roles](https://help.aliyun.com/document_detail/164222.html). The instance must be a Redis Op.

**Parameters:** See `SwitchInstanceHARequest` model.

## switchInstanceProxy

**Signature:** `switchInstanceProxy(request: SwitchInstanceProxyRequest)`

For more information about the proxy mode, see [Features of proxy servers](https://help.aliyun.com/document_detail/142959.html). Before you call this operation, make sure that the following requiremen.

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. You can call the [DescribeInstances](https://help.aliyun.com/document_detail Example: `r-bp1zxszhcgatnx****` |

## switchInstanceZoneFailOver

**Signature:** `switchInstanceZoneFailOver(request: SwitchInstanceZoneFailOverRequest)`

Switches an instance from the current zone to the specified zone in the event of a fault..

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The instance ID. Example: `r-bp1zxszhcgatnx****` |
| `siteFaultTime` | string | No | The duration for which the fault lasts. Unit: minutes. Example: `5` |
| `targetZoneId` | string | No | The ID of the destination zone. Example: `cn-hangzhou-j` |

## switchNetwork

**Signature:** `switchNetwork(request: SwitchNetworkRequest)`

Changes the VPC or vSwitch of a Tair (Redis OSS-compatible) instance. If the instance is deployed in the classic network, the network type of the instance is changed from the classic network to VPC..

**Parameters:** (1 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `classicExpiredDays` | string | No | The retention period of the classic network endpoint. Valid values: **14**, **30**, **60**, and **12 Example: `30` |
| `instanceId` | string | Yes | The ID of the instance. You can call the [DescribeInstances](https://help.aliyun.com/document_detail Example: `r-bp1zxszhcgatnx****` |
| `retainClassic` | string | No | Specifies whether to retain the original classic network endpoint after you switch the instance from Example: `True` |
| `targetNetworkType` | string | No | The network type to which you want to switch. If you want to switch to VPC network, Set the value to Example: `VPC` |
| `vSwitchId` | string | No | The ID of the vSwitch that belongs to the VPC to which you want to switch. You can call the [Describ Example: `vsw-bp1e7clcw529l773d****` |
| `vpcId` | string | No | The ID of the VPC to which you want to switch. You can call the [DescribeVpcs](https://help.aliyun.c Example: `vpc-bp1nme44gek34slfc****` |

## enableAdditionalBandwidth

**Signature:** `enableAdditionalBandwidth(request: EnableAdditionalBandwidthRequest)`

If you enable the bandwidth auto scaling feature and call this operation at the same time, bandwidth auto scaling takes precedence. During bandwidth scale-back, the instance is scaled back to the defa.

**Parameters:** (1 required, 9 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `autoPay` | boolean | No | Specifies whether to enable automatic payment. Default value: true. Valid values: Example: `true` |
| `autoRenew` | boolean | No | Specifies whether to enable auto-renewal. Valid values: Example: `false` |
| `autoRenewPeriod` | number | No | The auto-renewal cycle based on which Tair (Redis OSS-compatible) automatically renews the purchased Example: `1` |
| `bandwidth` | string | No | The amount of extra bandwidth that you want to purchase. Unit: Mbit/s. The value must be an integer  Example: `20` |
| `chargeType` | string | No | The billing method of the bandwidth instance. Default value: PostPaid. Valid values: Example: `PostPaid` |
| `couponNo` | string | No | The coupon ID. Example: `youhuiquan_promotion_option_id_for_blank` |
| `instanceId` | string | Yes | The ID of the instance. You can call the [DescribeInstances](https://help.aliyun.com/document_detail Example: `r-bp1zxszhcgatnx****` |
| `nodeId` | string | No | The ID of the data shard for which you want to purchase a specific amount of bandwidth. You can call Example: `r-bp1zxszhcgatnx****-db-0` |
| `orderTimeLength` | string | No | The validity period of the bandwidth that you purchase. Unit: day. Valid values: **1**, **2**, **3** Example: `30` |
| `sourceBiz` | string | No | The source of the operation. This parameter is used only for internal maintenance. You do not need t Example: `SDK` |

## renewAdditionalBandwidth

**Signature:** `renewAdditionalBandwidth(request: RenewAdditionalBandwidthRequest)`

You can adjust the bandwidth of an instance in the Tair (Redis OSS-compatible) console. For more information, see [Adjust the bandwidth of an instance](https://help.aliyun.com/document_detail/102588.h.

**Parameters:** (2 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `autoPay` | boolean | No | Specifies whether to enable automatic payment. Default value: true. Valid values: Example: `true` |
| `couponNo` | string | No | The ID of the coupon. Example: `youhuiquan_promotion_option_id_for_blank` |
| `instanceId` | string | Yes | The ID of the instance. You can call the [DescribeInstances](https://help.aliyun.com/document_detail Example: `r-bp1zxszhcgatnx****` |
| `orderTimeLength` | string | Yes | The validity period of the bandwidth that you purchase. Unit: days. Valid values: **1**, **2**, **3* Example: `30` |
| `sourceBiz` | string | No | The source of the operation. This parameter is used only for internal maintenance. You do not need t Example: `SDK` |

## renewInstance

**Signature:** `renewInstance(request: RenewInstanceRequest)`

This operation is applicable only to subscription instances..

**Parameters:** (2 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `autoPay` | boolean | No | Specifies whether to enable automatic payment. Default value: true. Valid values: Example: `true` |
| `autoRenew` | boolean | No | Specifies whether to enable auto-renewal for the instance. Valid values: Example: `false` |
| `businessInfo` | string | No | The ID of the promotional event or business information. Example: `000000000` |
| `capacity` | string | No | The storage capacity of the instance. Unit: MB. When you renew the instance, you can specify this pa Example: `1024` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `TF-ModifyInstanceSpec-1686645570-7dac7257-4a14-4811-939c-51a282f` |
| `couponNo` | string | No | The coupon code. Default value: `youhuiquan_promotion_option_id_for_blank`. Example: `youhuiquan_promotion_option_id_for_blank` |
| `fromApp` | string | No | The source of the request. The default value is **OpenAPI** and cannot be changed. Example: `OpenAPI` |
| `instanceClass` | string | No | The instance type code. For more information, see [Instance specifications overview](https://help.al Example: `redis.master.small.default` |
| `instanceId` | string | Yes | The ID of the instance. Example: `r-bp1zxszhcgatnx****` |
| `period` | number | Yes | The renewal period. Valid values: **1**, 2, 3, 4, 5, 6, 7, 8, **9**, **12**, **24**, and **36**. Uni Example: `6` |

## modifyInstanceAutoRenewalAttribute

**Signature:** `modifyInstanceAutoRenewalAttribute(request: ModifyInstanceAutoRenewalAttributeRequest)`

> Auto-renewal is triggered seven days before the expiration date of the instance..

**Parameters:** (1 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `autoRenew` | string | No | Specifies whether to enable auto-renewal. Valid values: Example: `true` |
| `DBInstanceId` | string | Yes | The ID of the instance. Separate multiple instance IDs with commas (,). Example: `r-bp1zxszhcgatnx****` |
| `duration` | string | No | The auto-renewal period. Valid values: **1** to **12**. Unit: months. When the instance is about to  Example: `3` |
| `product` | string | No | The service. Set the value to kvstore. Example: `kvstore` |

## describeInstanceAutoRenewalAttribute

**Signature:** `describeInstanceAutoRenewalAttribute(request: DescribeInstanceAutoRenewalAttributeRequest)`

Queries whether auto-renewal is enabled for a Tair (Redis OSS-compatible) instance..

**Parameters:** (1 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `ETnLKlblzczshOTUbOCz****` |
| `DBInstanceId` | string | No | The ID of the instance. Example: `r-bp1zxszhcgatnx****` |
| `pageNumber` | number | No | The number of the page to return. The value must be an integer greater than **0**. Default value: ** Example: `1` |
| `pageSize` | number | No | The number of entries to return on each page. Valid values: **30**, **50**, and **100**. Example: `30` |
| `regionId` | string | Yes | The region ID of the instance. Example: `cn-hangzhou` |

## transformInstanceChargeType

**Signature:** `transformInstanceChargeType(request: TransformInstanceChargeTypeRequest)`

Before you call this operation, make sure that you understand relevant precautions and billing rules. For more information, see the following topics: *   [Change the billing method to subscription](ht.

**Parameters:** (3 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `autoPay` | boolean | No | Specifies whether to enable automatic payment. Default value: true. Valid values: Example: `true` |
| `autoRenew` | string | No | Specifies whether to enable auto-renewal for the instance. Valid values: Example: `false` |
| `autoRenewPeriod` | number | Yes | The subscription duration that is supported by auto-renewal. Unit: month. Valid values: **1**, **2** Example: `1` |
| `chargeType` | string | Yes | The new billing method. Valid values: Example: `PrePaid` |
| `instanceId` | string | Yes | The ID of the instance. You can call the [DescribeInstances](~~DescribeInstances~~) operation to que Example: `r-bp1zxszhcgatnx****` |
| `period` | number | No | The subscription duration. Unit: months. Valid values: **1**, 2, 3, 4, 5, 6, 7, 8, **9**, **12**, ** Example: `1` |

## transformToPrePaid

**Signature:** `transformToPrePaid(request: TransformToPrePaidRequest)`

For more information about how to change the billing method in the Tair (Redis OSS-compatible) console, see [Switch to subscription](https://help.aliyun.com/document_detail/54542.html). >  You cannot .

**Parameters:** (3 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `autoPay` | boolean | No | Specifies whether to enable auto-renewal. Default value: false. Valid values: Example: `true` |
| `autoRenew` | string | No | Specifies whether to enable auto-renewal for the instance. Valid values: Example: `false` |
| `autoRenewPeriod` | number | Yes | The subscription duration that is supported by auto-renewal. Unit: month. Valid values: **1**, **2** Example: `3` |
| `instanceId` | string | Yes | The ID of the instance. You can call the [DescribeInstances](~~DescribeInstances~~) operation to que Example: `r-bp1zxszhcgatnx****` |
| `period` | number | Yes | The subscription duration of the instance. Unit: months. Valid values: **1** to **9**, **12**, **24* Example: `12` |

## transformToEcs

**Signature:** `transformToEcs(request: TransformToEcsRequest)`

Converts an instance use local disks to a cloud-native instance..

**Parameters:** (4 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `autoRenew` | string | No | Specifies whether to enable the auto-renewal feature. Valid values: Example: `false` |
| `autoRenewPeriod` | number | Yes | The subscription duration that is supported by auto-renewal. Unit: month. Valid values: **1**, **2** Example: `1` |
| `chargeType` | string | No | The new billing method. Valid values: Example: `PostPaid` |
| `dryRun` | boolean | No | Specifies whether to perform a precheck before the system creates the instance. Valid values: Example: `true` |
| `effectiveTime` | string | No | The time when a database switchover is performed after data is migrated. Valid values: Example: `Immediately` |
| `engineVersion` | string | Yes | The database engine version of the instance. Valid values: **5.0**, **6.0**, and **7.0**. Example: `5.0` |
| `instanceClass` | string | Yes | The instance specification of the cloud-native instance. For more information, see [Overview](https: Example: `tair.rdb.1g` |
| `instanceId` | string | Yes | The ID of the instance that you want to convert. Example: `r-bp1zxszhcgatnx****` |
| `period` | number | No | The subscription duration of the instance. Unit: months. Valid values: **1**, 2, 3, 4, 5, 6, 7, 8, * Example: `1` |
| `shardCount` | number | No | The number of data shards in the cloud-native cluster instance. Example: `2` |

## lockDBInstanceWrite

**Signature:** `lockDBInstanceWrite(request: LockDBInstanceWriteRequest)`

Places a write lock on an instance. After the instance is locked, it supports only read operations..

**Parameters:** See `LockDBInstanceWriteRequest` model.

## unlockDBInstanceWrite

**Signature:** `unlockDBInstanceWrite(request: UnlockDBInstanceWriteRequest)`

Removes the write lock from an instance. After the instance is unlocked, it supports both read and write operations..

**Parameters:** See `UnlockDBInstanceWriteRequest` model.

## allocateDirectConnection

**Signature:** `allocateDirectConnection(request: AllocateDirectConnectionRequest)`

Clients can bypass proxy nodes and use private endpoints to connect to cluster instances. This is similar to the connection to native Redis clusters. The direct connection mode can reduce communicatio.

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `connectionString` | string | No | The prefix of the private endpoint. The prefix must start with a lowercase letter and can contain lo Example: `redisdirect123` |
| `instanceId` | string | Yes | The ID of the instance. Example: `r-bp1zxszhcgatnx****` |
| `port` | string | No | The port number of the instance. Valid values: **1024** to **65535**. Default value: **6379**. Example: `6379` |

## releaseDirectConnection

**Signature:** `releaseDirectConnection(request: ReleaseDirectConnectionRequest)`

In direct connection mode, clients can bypass proxy nodes and use private endpoints to connect to ApsaraDB for Redis instances. This is similar to the connection to a native Redis cluster. The direct .

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `r-bp1zxszhcgatnx****` |

## allocateInstancePublicConnection

**Signature:** `allocateInstancePublicConnection(request: AllocateInstancePublicConnectionRequest)`

You can also apply for public endpoints in the ApsaraDB for Redis console. For more information, see [Use a public endpoint to connect to an ApsaraDB for Redis instance](https://help.aliyun.com/docume.

**Parameters:** (3 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `connectionStringPrefix` | string | Yes | The prefix of the public endpoint. The prefix must start with a lowercase letter and can contain low Example: `r-bp1zxszhcgatnx****` |
| `instanceId` | string | Yes | The ID of the instance. Example: `r-bp1zxszhcgatnx****` |
| `port` | string | Yes | The service port number of the instance. Valid values: **1024** to **65535**. Example: `6379` |

## releaseInstancePublicConnection

**Signature:** `releaseInstancePublicConnection(request: ReleaseInstancePublicConnectionRequest)`

You can also release the public endpoint for an instance in the Tair (Redis OSS-compatible) console. For more information, see [Release public endpoints](https://help.aliyun.com/document_detail/125424.

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `currentConnectionString` | string | Yes | The public endpoint to be released. Example: `r-bp1zxszhcgatnx****.redis.rds.aliyuncs.com` |
| `instanceId` | string | Yes | The ID of the instance. Example: `r-bp1zxszhcgatnx****` |

## describeDBInstanceNetInfo

**Signature:** `describeDBInstanceNetInfo(request: DescribeDBInstanceNetInfoRequest)`

Queries the network information of an ApsaraDB for Redis instance..

**Parameters:** See `DescribeDBInstanceNetInfoRequest` model.

## modifyInstanceNetExpireTime

**Signature:** `modifyInstanceNetExpireTime(request: ModifyInstanceNetExpireTimeRequest)`

You can also perform this operation in the Tair (Redis OSS-compatible) console. For more information, see [Change the expiration time for the endpoint of the classic network](https://help.aliyun.com/d.

**Parameters:** (3 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `classicExpiredDays` | number | Yes | The extension period to retain the classic network endpoint of the instance. Unit: days. Valid value Example: `14` |
| `connectionString` | string | Yes | The endpoint of the classic network. Example: `r-bp1zxszhcgatnx****.redis.rds.aliyuncs.com` |
| `instanceId` | string | Yes | The ID of the instance. Example: `r-bp1zxszhcgatnx****` |

## describeDBNodeDirectVipInfo

**Signature:** `describeDBNodeDirectVipInfo(request: DescribeDBNodeDirectVipInfoRequest)`

> Only instances that use cloud disks support this operation..

**Parameters:** See `DescribeDBNodeDirectVipInfoRequest` model.

## rebootProxy

**Signature:** `rebootProxy(request: RebootProxyRequest)`

This operation supports only instances that use the read/write splitting architecture or the cluster architecture in proxy mode. For more information, see [Restart or rebuild proxy nodes](https://help.

**Parameters:** (1 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The instance ID. Example: `r-bp1ymwrhvq79zj****` |
| `proxyList` | string | No | The IDs of the proxy nodes that you want to restart or rebuild. Separate multiple IDs with commas (, Example: `90310144,90310144` |
| `proxyNodeList` | string | No | The IDs of the hosts on which the proxy nodes are deployed. Separate multiple IDs with commas (,). Example: `36912280,36912282` |
| `rebootMode` | string | No | The type of operation that you want to perform. Valid values: Example: `reboot` |

## upgradeProxy

**Signature:** `upgradeProxy(request: UpgradeProxyRequest)`

The procedure and impacts for updating the minor version of an instance varies based on the instance architecture. For more information, see [Update the minor version of an instance](https://help.aliy.

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The instance ID. Example: `r-bp1vgja77wl7pb****` |
| `proxyInstanceIds` | string | No | The IDs of the proxy nodes that you want to update. Separate multiple IDs with commas (,). This para Example: `r-bp1vgja77wl7pb****-proxy-0` |
| `switchTimeMode` | number | No | The time to execute the specification change. Valid values: Example: `Immediately` |

## describeClusterBackupList

**Signature:** `describeClusterBackupList(request: DescribeClusterBackupListRequest)`

This operation is applicable only to cloud-native instances..

**Parameters:** (4 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clusterBackupId` | string | No | The backup set ID. Example: `cb-hyxdof5x9kqbtust` |
| `endTime` | string | Yes | The end of the time range to query. Specify the time in the ISO 8601 standard in the *yyyy-MM-dd*T*H Example: `2021-05-13T00:00:00Z` |
| `instanceId` | string | Yes | The instance ID. Example: `r-t4nj72oug5r5646qog` |
| `noShardBackup` | string | No | Specifies whether to show backup set information for shards in the instance. Example: `True` |
| `pageNumber` | number | No | The page number. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Example: `30` |
| `regionId` | string | Yes | The region ID of the instance. You can call the [DescribeRegions](https://help.aliyun.com/document_d Example: `cn-zhangjiakou` |
| `startTime` | string | Yes | The beginning of the time range to query. Specify the time in the ISO 8601 standard in the *yyyy-MM- Example: `2018-12-03T07:01Z` |

## describeClusterMemberInfo

**Signature:** `describeClusterMemberInfo(request: DescribeClusterMemberInfoRequest)`

> This API operation is applicable only to Tair (Redis OSS-compatible) instances that use [cloud disks](https://help.aliyun.com/document_detail/188068.html) and the [cluster architecture](https://help.

**Parameters:** (1 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the Tair (Redis OSS-compatible) instance. You can call the [DescribeInstances](https://hel Example: `r-bp1zxszhcgatnx****` |
| `pageNumber` | number | No | The page number. Example: `1` |
| `pageSize` | number | No | The number of entries to return on each page. Valid values: **30**, **50**, and **100**. Default val Example: `30` |

## addShardingNode

**Signature:** `addShardingNode(request: AddShardingNodeRequest)`

This operation is available only for cluster instances that use cloud disks..

**Parameters:** (1 required, 7 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `autoPay` | boolean | No | Specifies whether to enable auto-renewal. Valid values: Example: `false` |
| `businessInfo` | string | No | The business information. This is an additional parameter. Example: `000000000` |
| `couponNo` | string | No | The ID of the coupon. Example: `youhuiquan_promotion_option_id_for_blank` |
| `forceTrans` | boolean | No | Specifies whether to enable forced transmission during a configuration change. Valid values: Example: `false` |
| `instanceId` | string | Yes | The ID of the instance. Example: `r-bp1zxszhcgatnx****` |
| `shardCount` | number | No | The number of data shards that you want to add. Default value: **1**. Example: `2` |
| `sourceBiz` | string | No | The source of the operation. This parameter is used only for internal maintenance. You do not need t Example: `SDK` |
| `vSwitchId` | string | No | The vSwitch ID. You can specify a different vSwitch within the same virtual private cloud (VPC). In  Example: `vsw-bp1e7clcw529l773d****` |

## deleteShardingNode

**Signature:** `deleteShardingNode(request: DeleteShardingNodeRequest)`

You can also remove data shards from an instance in the Tair (Redis OSS-compatible) console. For more information, see [Adjust the number of shards for an instance with cloud disks](https://help.aliyu.

**Parameters:** (1 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `effectiveTime` | string | No | The time when you want to delete the proxy nodes for instance in the proxy mode. Valid values: Example: `Immediately` |
| `forceTrans` | boolean | No | Specifies whether to enable forced transmission during a configuration change. Valid values: Example: `false` |
| `instanceId` | string | Yes | The ID of the instance. Example: `r-bp1zxszhcgatnx****` |
| `shardCount` | number | No | The number of data shards that you want to remove. Shard removal starts from the end of the shard li Example: `1` |

## removeSubInstance

**Signature:** `removeSubInstance(request: RemoveSubInstanceRequest)`

The operation that you want to perform. Set the value to **RemoveSubInstance**..

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | Instance ID. Example: `r-bp1zxszhcgatnx****` |

## syncDtsStatus

**Signature:** `syncDtsStatus(request: SyncDtsStatusRequest)`

Disables configuration changes for a Tair (Redis OSS-compatible) instance before you use Data Transmission Service (DTS) to migrate or synchronize data of the instance. This prevents migration and syn.

**Parameters:** (1 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `r-bp1zxszhcgatnx****` |
| `regionId` | string | No | The region ID of the instance. Example: `cn-hangzhou` |
| `status` | string | No | Disables configuration changes for the instance. Valid values: Example: `0` |
| `taskId` | string | No | The ID of the DTS instance. You can view the ID in the [DTS console](https://dts.console.aliyun.com/ Example: `dtss0611o8vv90****` |

## describeActiveOperationTask

**Signature:** `describeActiveOperationTask(request: DescribeActiveOperationTaskRequest)`

After you have called this API operation and queried the information about a specific O&M task, you can also call the [ModifyActiveOperationTask](https://help.aliyun.com/document_detail/473864.html) o.

**Parameters:** (2 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `isHistory` | number | No | Specifies whether to return the historical tasks. Default value: 0. Valid values: Example: `1` |
| `pageNumber` | number | No | The number of the page to return. The value must be an integer that is greater than **0**. Default v Example: `1` |
| `pageSize` | number | No | The number of entries to return on each page. Specify a value greater than **10**. Default value: ** Example: `30` |
| `region` | string | Yes | The region ID of the O&M task. You can call the [DescribeRegions](https://help.aliyun.com/document_d Example: `all` |
| `taskType` | string | Yes | The type of the O\\&M task. Valid values: Example: `all` |

## modifyActiveOperationTask

**Signature:** `modifyActiveOperationTask(request: ModifyActiveOperationTaskRequest)`

You can receive notifications for Tair (Redis OSS-compatible) events such as instance migration and version upgrade by text message, phone call, email, internal message, or by using the console. You c.

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ids` | string | Yes | The ID of the O\\&M task. Separate multiple IDs with commas (,). Example: `11111,22222` |
| `switchTime` | string | Yes | The scheduled switchover time to be specified. Specify the time in the ISO 8601 standard in the *yyy Example: `2019-10-17T18:50:00Z` |

## modifyActiveOperationTasks

**Signature:** `modifyActiveOperationTasks(request: ModifyActiveOperationTasksRequest)`

Modifies the switching time of scheduled O\\\\\\&M events for an instance..

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ids` | string | Yes | The IDs of the O\\&M events. Separate multiple event IDs with commas (,). Example: `1111721,1111718` |
| `immediateStart` | number | No | Specifies whether to immediately start scheduling. Valid values: Example: `0` |
| `switchTime` | string | Yes | The scheduled switching time. Specify the time in the ISO 8601 standard in the yyyy-MM-ddTHH:mm:ssZ  Example: `2019-10-17T18:50:00Z` |

## modifyActiveOperationMaintainConfig

**Signature:** `modifyActiveOperationMaintainConfig(request: ModifyActiveOperationMaintainConfigRequest)`

ModifyActiveOperationMaintainConf.

**Parameters:** (0 required, 5 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cycleTime` | string | No | The interval between two O\\&M tasks. Example: `1,2,3,4,5` |
| `cycleType` | string | No | The unit of the billing cycle. Valid values: Example: `Week` |
| `maintainEndTime` | string | No | The end time of the O\\&M window. The time follows the ISO 8601 standard in the HH:mm:ssZ format. Th Example: `20:00:00Z` |
| `maintainStartTime` | string | No | The start time of the O\\&M window. The time follows the ISO 8601 standard in the *HH:mm:ss* Z forma Example: `16:00:00Z` |
| `status` | number | No | Specifies whether the configurations take effect. Valid values: Example: `2` |

## modifyTaskInfo

**Signature:** `modifyTaskInfo(request: ModifyTaskInfoRequest)`

Modifies the task information, such as the task execution time..

**Parameters:** (3 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `actionParams` | string | Yes | The JSON-formatted parameters related to the action. Set this parameter to `{"recoverMode": "xxx", " Example: `{\\"recoverMode\\":\\"immediate\\"}` |
| `regionId` | string | Yes | The ID of the region where the instance is deployed. Example: `cn-hangzhou` |
| `stepName` | string | No | The name of the current step. Example: `exec_task` |
| `taskAction` | string | No | The action name. Set the value to **modifySwitchTime**. The value specifies that you want to change  Example: `modifySwitchTime` |
| `taskId` | string | Yes | The task ID. Separate multiple task IDs with commas (,). You can specify up to 30 task IDs. Example: `t-0mq3kfhn8i1nlt****` |

## modifyEventInfo

**Signature:** `modifyEventInfo(request: ModifyEventInfoRequest)`

事件中心修改事件信息.

**Parameters:** (3 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `actionParams` | string | Yes | The JSON-formatted parameters related to the action. Set this parameter to `{"recoverMode": "xxx", " Example: `{"recoverTime":"2023-04-17T14:02:35Z","recoverMode":"timePoint"}` |
| `eventAction` | string | No | The event handling action. Valid values: Example: `archive` |
| `eventId` | string | Yes | The event IDs. Separate multiple event IDs with commas (,). You can specify up to 20 event IDs. Example: `5422964` |
| `regionId` | string | Yes | The region ID. Example: `cn-hangzhou` |

## describeHistoryTasks

**Signature:** `describeHistoryTasks(request: DescribeHistoryTasksRequest)`

Queries a list of tasks in the task center..

**Parameters:** (2 required, 10 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fromExecTime` | number | No | The minimum execution duration of a task. This parameter is used to filter tasks whose execution dur Example: `0` |
| `fromStartTime` | string | Yes | The beginning of the time range to query. Specify the time in the ISO 8601 standard in the yyyy-MM-d Example: `2022-01-02T11:31:03Z` |
| `instanceId` | string | No | The instance ID. This parameter is empty by default, which indicates that you can specify an unlimit Example: `r-uf62br2491p5l****` |
| `instanceType` | string | No | Set the value to Instance. Example: `Instance` |
| `pageNumber` | number | No | The page number. Pages start from page 1. Default value: 1. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Valid values: 10 to 100. Default value: 10. Example: `10` |
| `regionId` | string | No | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/473763.htm Example: `cn-beijing` |
| `status` | string | No | The task status. Valid values: Example: `Scheduled` |
| `taskId` | string | No | The task ID. This parameter is empty by default, which indicates that you can specify an unlimited n Example: `t-83br18hloy3faf****` |
| `taskType` | string | No | The task type. This parameter is empty by default, which indicates that you can specify an unlimited Example: `ModifyInsSpec` |
| `toExecTime` | number | No | The maximum execution duration of a task. This parameter is used to filter tasks whose execution dur Example: `0` |
| `toStartTime` | string | Yes | The end of the time range to query. Specify the time in the ISO 8601 standard in the yyyy-MM-ddTHH:m Example: `2022-03-02T11:31:03Z` |


## createTairInstance

**Signature:** `createTairInstance(request: CreateTairInstanceRequest)`

For information about instance selection, see [Instructions for selecting an appropriate Tair (Redis OSS-compatible) instance](https://help.aliyun.com/document_detail/223808.html). Before you call thi.

**Parameters:** (9 required, 34 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `autoRenewPeriod` | string | Yes | The subscription duration that is supported by auto-renewal. Unit: month. Valid values: **1**, **2** Example: `3` |
| `instanceClass` | string | Yes | The instance series. For more information, see the following topics: Example: `tair.scm.standard.4m.32d` |
| `instanceType` | string | Yes | The instance series. Valid values: Example: `tair_scm` |
| `period` | number | Yes | The subscription duration. Valid values: **1**, 2, 3, 4, 5, 6, 7, 8, **9**, **12**, **24**,**36**, a Example: `1` |
| `regionId` | string | Yes | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/473763.htm Example: `cn-hangzhou` |
| `storage` | number | Yes | The storage capacity of the ESSD/SSD-based instance. The valid values vary based on the instance typ Example: `60` |
| `storageType` | string | Yes | The storage type. Valid values: **essd_pl1**, **essd_pl2**, and **essd_pl3**. Example: `essd_pl1` |
| `vSwitchId` | string | Yes | The ID of the vSwitch that belongs to the VPC. You can call the [DescribeVpcs](https://help.aliyun.c Example: `vsw-bp1e7clcw529l773d****` |
| `vpcId` | string | Yes | The ID of the VPC. You can call the [DescribeVpcs](https://help.aliyun.com/document_detail/35739.htm Example: `vpc-bp1nme44gek34slfc****` |
| `key` | string | No | The tag key. A tag is a key-value pair. Example: `key1_test` |
| `value` | string | No | The value of the tag. Example: `value1_test` |
| `autoPay` | boolean | No | Specifies whether to enable automatic payment. Set the value to **true**. Example: `true` |
| `autoRenew` | string | No | Specifies whether to enable auto-renewal for the instance. Valid values: Example: `true` |
| `autoUseCoupon` | string | No | Specifies whether to use a coupon. Valid values: Example: `true` |
| `backupId` | string | No | You can set the BackupId parameter to the backup set ID of the source instance. The system uses the  Example: `11111111` |
| `businessInfo` | string | No | The ID of the promotional event or the business information. Example: `000000000` |
| `chargeType` | string | No | The billing method of the instance. Valid values: Example: `PrePaid` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. You can use the client to ge Example: `ETnLKlblzczshOTUbOCz****` |
| `clusterBackupId` | string | No | This parameter is supported for specific new cluster instances. You can query the backup set ID by c Example: `cb-hyxdof5x9kqb****` |
| `connectionStringPrefix` | string | No | The prefix of the endpoint. The prefix must be 8 to 40 characters in length and can contain lowercas Example: `r-bp1zxszhcgatnx****` |
| `couponNo` | string | No | The coupon code. Example: `youhuiquan_promotion_option_id_for_blank` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Example: `false` |
| `engineVersion` | string | No | The database engine version. Default value: **1.0**. The parameter value varies based on the Tair in Example: `1.0` |
| `globalInstanceId` | string | No | Specifies whether to use the created instance as a child instance of a distributed instance. Example: `gr-bp14rkqrhac****` |
| ... | ... | ... | *19 more optional parameters* |


## createTCInstance

**Signature:** `createTCInstance(request: CreateTCInstanceRequest)`

创建TairCustom实例.


## destroyInstance

**Signature:** `destroyInstance(request: DestroyInstanceRequest)`

Before you call this operation, instances must be available in the recycle bin. For more information, see [Instance recycle bin](https://help.aliyun.com/document_detail/86114.html). > Calling this ope.

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance in the recycle bin. Example: `r-8vb2rhccnvd82f****` |


## describeDbInstanceConnectivity

**Signature:** `describeDbInstanceConnectivity(request: DescribeDbInstanceConnectivityRequest)`

Checks the connectivity between the client IP address and the instance..

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceId` | string | Yes | The ID of the instance. Example: `r-bp1r36hdqlrgt1****` |
| `srcIp` | string | Yes | The IP address of the client. Example: `124.207.240.***` |


## describeIntranetAttribute

**Signature:** `describeIntranetAttribute(request: DescribeIntranetAttributeRequest)`

You can call the [EnableAdditionalBandwidth](https://help.aliyun.com/document_detail/473771.html) operation to increase the internal bandwidth of an instance..

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `r-bp1zxszhcgatnx****` |
| `resourceGroupId` | string | No | The ID of the resource group. Example: `rg-acfmyiu4ekp****` |


## describeLogicInstanceTopology

**Signature:** `describeLogicInstanceTopology(request: DescribeLogicInstanceTopologyRequest)`

This parameter is supported only for cluster and read/write splitting instances..

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. Example: `r-bp1zxszhcgatnx****` |


## describeRoleZoneInfo

**Signature:** `describeRoleZoneInfo(request: DescribeRoleZoneInfoRequest)`

Queries the role, type, minor version, and zone of each node in a Tair (Redis OSS-compatible) instance..

**Parameters:** (1 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance. You can call the [DescribeInstances](https://help.aliyun.com/document_detail Example: `r-t4nlenc2p04uvb****` |
| `pageNumber` | number | No | The page number. The value must be an integer that is greater than **0** and less than or equal to t Example: `1` |
| `pageSize` | number | No | The number of entries per page. Valid values: **10**, **20**, and **50**. Default value: **10**. Example: `10` |
| `queryType` | number | No | The type of the node to query. Default value: 1. Valid values: Example: `0` |


## flushExpireKeys

**Signature:** `flushExpireKeys(request: FlushExpireKeysRequest)`

For more information about how to clear the expired keys in the Tair (Redis OSS-compatible) console, see [Clear data](https://help.aliyun.com/document_detail/43881.html). >  Expired keys cannot be rec.

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `effectiveTime` | string | No | The time when you want to delete the expired keys. Default value: Immediately. Valid values: Example: `Immediately` |
| `instanceId` | string | Yes | The ID of the instance. Example: `r-bp1zxszhcgatnx****` |


## flushInstanceForDB

**Signature:** `flushInstanceForDB(request: FlushInstanceForDBRequest)`

Each Tair (Redis OSS-compatible) instance can contain up to 256 databases named from DB0 to DB255. Each database does not have a separate memory usage limit. The memory capacity that a database can us.


## masterNodeShutDownFailOver

**Signature:** `masterNodeShutDownFailOver(request: MasterNodeShutDownFailOverRequest)`

Simulates database node failures..

**Parameters:** (0 required, 7 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | string | No | The resource category. Set the value to instance. Example: `instance` |
| `DBFaultMode` | string | No | *   Specify: This mode allows you to specify a database node to use. *   Random: In this mode, a ran Example: `Random` |
| `DBNodes` | string | No | The IDs of the database nodes. Example: `r-rdsdavinx01003-db-0,r-rdsdavinx01003-db-1` |
| `failMode` | string | No | *   **Hard**: stimulates a hardware failure that cannot be recovered. In this case, a high-availabil Example: `Safe` |
| `instanceId` | string | No | The instance ID. You can call the [DescribeInstances](https://help.aliyun.com/document_detail/473778 Example: `r-bp1zxszhcgatnx****` |
| `proxyFaultMode` | string | No | *   Specify: This mode allows you to specify a proxy node to use. *   Random: In this mode, a random Example: `Specify` |
| `proxyInstanceIds` | string | No | The IDs of the proxy nodes. Example: `6981,6982` |


## migrateToOtherZone

**Signature:** `migrateToOtherZone(request: MigrateToOtherZoneRequest)`

Before you call this operation, you must release the public endpoint (if any) of the instance. For more information, see [Migrate an instance across zones](https://help.aliyun.com/document_detail/1062.

**Parameters:** (2 required, 7 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `DBInstanceId` | string | Yes | The ID of the Tair (Redis OSS-compatible) instance. Example: `r-bp1zxszhcgatnx****` |
| `effectiveTime` | string | No | The time when the database is switched after the instance is migrated. Valid values: Example: `Immediately` |
| `readOnlyCount` | number | No | The number of read replicas in the primary zone. Example: `1` |
| `replicaCount` | number | No | The number of replica nodes in the primary zone. Example: `1` |
| `secondaryZoneId` | string | No | The ID of the secondary zone to which you want to migrate the instance. You can call the [DescribeZo Example: `cn-hangzhou-h` |
| `slaveReadOnlyCount` | number | No | The number of read replicas in the secondary zone. Example: `1` |
| `slaveReplicaCount` | number | No | The number of replica nodes in the secondary zone. Example: `1` |
| `vSwitchId` | string | No | The ID of the vSwitch. Example: `vsw-bp1e7clcw529l773d****` |
| `zoneId` | string | Yes | The ID of the destination primary zone. You can call the [DescribeZones](https://help.aliyun.com/doc Example: `cn-hangzhou-g` |


## describeServiceLinkedRoleExists

**Signature:** `describeServiceLinkedRoleExists(request: DescribeServiceLinkedRoleExistsRequest)`

You can call this operation to query whether the service-lined role AliyunServiceRoleForKvstore is created for Tair (Redis OSS-compatible). For more information, see [Service-linked role of Tair (Redi.

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `engine` | string | No | The database engine of the instance. Only Redis is supported. Example: `Redis` |
| `regionId` | string | Yes | The ID of the region where the instance resides. Example: `cn-hangzhou` |


## initializeKvstorePermission

**Signature:** `initializeKvstorePermission(request: InitializeKvstorePermissionRequest)`

The log management feature of Tair (Redis OSS-compatible) requires the resources of [Simple Log Service](https://help.aliyun.com/document_detail/48869.html). To use the log management feature, you can.

**Parameters:** (0 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerAccount` | string | No | - |
| `regionId` | string | No | The ID of the region. Example: `cn-hangzhou` |


## cancelActiveOperationTasks

**Signature:** `cancelActiveOperationTasks(request: CancelActiveOperationTasksRequest)`

O\\&M events cannot be canceled in the following scenarios: *   The allowCancel parameter is set to 0. *   The current time is later than the start time of the O\\&M event. *   The state value of the .

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ids` | string | Yes | The IDs of O\\&M events that you want to cancel at a time. Separate multiple IDs with commas (,). Example: `1508850,1508310,1507849,1506274,1505811` |


## describeActiveOperationTasks

**Signature:** `describeActiveOperationTasks(request: DescribeActiveOperationTasksRequest)`

Queries the O\\\\\\\\\\\\&M event details of an instance..

**Parameters:** (0 required, 11 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `allowCancel` | number | No | The filter condition that is used to return events based on the settings of event cancellation. Defa Example: `1` |
| `allowChange` | number | No | The filter condition that is used to return events based on the settings of the switching time. Defa Example: `-1` |
| `changeLevel` | string | No | The type of task configuration change. Valid values: Example: `all` |
| `dbType` | string | No | The database type. Valid values: **redis** Example: `redis` |
| `insName` | string | No | The name of the instance. You can leave this parameter empty. If you configure this parameter, you c Example: `r-wz96fzmpvpr2qnqnlb` |
| `pageNumber` | number | No | The page number. Pages start from page 1. Default value: 1. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Default value: 25. Maximum value: 100. Example: `25` |
| `productId` | string | No | The name of the service. Valid values: RDS, POLARDB, MongoDB, and Redis. For Redis instances, set th Example: `Redis` |
| `region` | string | No | The region ID of the O&M task. You can call the [DescribeRegions](https://help.aliyun.com/document_d Example: `cn-shanghai` |
| `status` | number | No | The status of an O\\&M event. This parameter is used to filter returned tasks. Valid values: Example: `3` |
| `taskType` | string | No | The type of the O\\&M event. If this parameter is not specified, all types of O\\&M events are queri Example: `all` |


## describeActiveOperationTaskCount

**Signature:** `describeActiveOperationTaskCount(request: DescribeActiveOperationTaskCountRequest)`

Queries the number of O\\\\\\&M tasks on a Tair (Redis OSS-compatible) instance..

**Parameters:** (0 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerAccount` | string | No | - |
| `regionId` | string | No | The region ID. Example: `cn-beijing` |


## describeActiveOperationMaintenanceConfig

**Signature:** `describeActiveOperationMaintenanceConfig(request: DescribeActiveOperationMaintenanceConfigRequest)`

Queries the O\\\\\\&M task configurations of an instance..

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerAccount` | string | No | - |


## describeHistoryEvents

**Signature:** `describeHistoryEvents(request: DescribeHistoryEventsRequest)`

DescribeHistoryEvents.

**Parameters:** (0 required, 15 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `archiveStatus` | string | No | The status of the event. Valid values: Example: `Archived` |
| `eventCategory` | string | No | The system event category. Valid values: Example: `Exception` |
| `eventId` | string | No | The event ID. Example: `5345398` |
| `eventLevel` | string | No | The level of the event. Valid values: Example: `INFO` |
| `eventStatus` | string | No | The status of the event. Valid values: Example: `Scheduled` |
| `eventType` | string | No | The system event type. This parameter takes effect only when InstanceEventType.N is not specified. V Example: `SystemFailure.Reboot` |
| `fromStartTime` | string | No | The beginning of the time range to query. Specify the time in the ISO 8601 standard in the yyyy-MM-d Example: `2022-01-02T11:31:03Z` |
| `instanceId` | string | No | The instance ID. Example: `r-bp1zxszhcgatnx****` |
| `pageNumber` | number | No | The page number. Pages start from page 1. Default value: 1. Example: `1` |
| `pageSize` | number | No | The number of records to return on each page. Default value: 10. Example: `10` |
| `regionId` | string | No | The region ID of the instance. You can call the [DescribeRegions](https://help.aliyun.com/document_d Example: `cn-beijing` |
| `resourceGroupId` | string | No | The resource group ID. Example: `rg-acfnuslkubs****` |
| `resourceType` | string | No | The type of the resource. Valid values: Example: `Instance` |
| `taskId` | string | No | The task IDs. Example: `578678678` |
| `toStartTime` | string | No | The end of the time range to query. Specify the time in the ISO 8601 standard in the yyyy-MM-ddTHH:m Example: `2022-02-02T11:31:03Z` |


## describeHistoryEventsStat

**Signature:** `describeHistoryEventsStat(request: DescribeHistoryEventsStatRequest)`

Queries the statistics of historical events..

**Parameters:** (1 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `archiveStatus` | string | No | The status of the events that you want to query. Valid values: Example: `Archived` |
| `fromStartTime` | string | No | The beginning of the time range to query. Only tasks that have a start time later than or equal to t Example: `2022-01-02T11:31:03Z` |
| `regionId` | string | Yes | The region ID. Example: `cn-beijing` |
| `toStartTime` | string | No | The end of the time range to query. Only tasks that have a start time earlier than or equal to the t Example: `2022-02-02T11:31:03Z` |


## describeHistoryTasksStat

**Signature:** `describeHistoryTasksStat(request: DescribeHistoryTasksStatRequest)`

Queries the task statistics in the task center..

**Parameters:** (3 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fromExecTime` | number | No | The minimum execution duration of a task. This parameter is used to filter tasks whose execution dur Example: `0` |
| `fromStartTime` | string | Yes | The beginning of the time range to query. The time must be in UTC and formatted as *yyyy-MM-dd*t*hh: Example: `2022-01-02T11:31:03Z` |
| `instanceId` | string | No | The instance ID. Example: `r-bp1zxszhcgatnx****` |
| `regionId` | string | Yes | The region ID of the pending event. You can call the DescribeRegions operation to query the most rec Example: `cn-beijing` |
| `status` | string | No | The task status. Valid values: Example: `Scheduled` |
| `taskId` | string | No | The task IDs. You can specify this parameter to query specific tasks. This parameter is empty by def Example: `t-0mq1yyhm3ffl2bxxxx` |
| `taskType` | string | No | The type of the task. Example: `all` |
| `toExecTime` | number | No | Maximum task execution time. This parameter is used to filter tasks whose execution duration is shor Example: `0` |
| `toStartTime` | string | Yes | The end of the time range to query. The time must be in UTC and formatted as *yyyy-MM-dd*t*hh:mm*Z. Example: `2022-02-02T11:31:03Z` |


## describeDedicatedClusterInstanceList

**Signature:** `describeDedicatedClusterInstanceList(request: DescribeDedicatedClusterInstanceListRequest)`

> If you want to query the information about Tair (Redis OSS-compatible) instances that are not deployed in a dedicated cluster, call the [DescribeInstanceAttribute](https://help.aliyun.com/document_d.

**Parameters:** (1 required, 10 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clusterId` | string | No | The ID of the dedicated cluster. You can view the dedicated cluster ID on the Dedicated Clusters pag Example: `dhg-5f2v98840ioq****` |
| `dedicatedHostName` | string | No | The ID of the host in the dedicated cluster. You can call the [DescribeDedicatedHosts](https://help. Example: `ch-t4n664a9mal4c****` |
| `engine` | string | No | The database engine of the instance. Set the value to **Redis**. Example: `Redis` |
| `engineVersion` | string | No | The database engine version of the instance. Set the value to **5.0**. Example: `5.0` |
| `instanceId` | string | No | The ID of the instance. Example: `r-bp1zxszhcgatnx****` |
| `instanceNetType` | string | No | The network type of the instance. Valid values: Example: `2` |
| `instanceStatus` | number | No | The state of the instance. Valid values: Example: `1` |
| `pageNumber` | number | No | The number of the page to return. The value must be an integer that is greater than **0**. Default v Example: `1` |
| `pageSize` | number | No | The number of entries to return on each page. Valid values: **30**, **50**, and **100**. Default val Example: `30` |
| `regionId` | string | Yes | The region ID of the instance. You can call the [DescribeRegions](https://help.aliyun.com/document_d Example: `cn-hangzhou` |
| `zoneId` | string | No | The zone ID of the instance. You can call the [DescribeZones](https://help.aliyun.com/document_detai Example: `cn-hangzhou-e` |

