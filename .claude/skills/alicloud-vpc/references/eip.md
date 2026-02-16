# Elastic IP (EIP)

EIP allocation, bindng, bandwidth, monitoring, and public IP address pools.

## allocateEipAddress

**Signature:** `allocateEipAddress(request: AllocateEipAddressRequest)`

Before you call this operation, make sure that you are familiar with the billing methods and pricing of EIPs. For more information, see [Billing overview](https://help.aliyun.com/document_detail/12203.

**Parameters:** (1 required, 19 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | - |
| `activityId` | number | No | The promotion code. This parameter is not required. Example: `123456` |
| `autoPay` | boolean | No | Specifies whether to enable automatic payment. Valid values: Example: `false` |
| `bandwidth` | string | No | The maximum bandwidth of the EIP. Unit: Mbit/s. Example: `5` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `0c593ea1-3bea-11e9-b96b-88e9fe637760` |
| `description` | string | No | The description of the EIP. Example: `test` |
| `ISP` | string | No | The line type. Valid values: Example: `BGP` |
| `instanceChargeType` | string | No | The billing method of the EIP. Valid values: Example: `PostPaid` |
| `instanceId` | string | No | The EIP ID. Example: `eip-25877c70gddh****` |
| `internetChargeType` | string | No | The metering method of the EIP. Valid values: Example: `PayByTraffic` |
| `ipAddress` | string | No | The IP address of the EIP that you want to request. Example: `192.0.XX.XX` |
| `name` | string | No | The EIP name. Example: `EIP1` |
| `netmode` | string | No | The network type. Default value: **public**. Example: `public` |
| `period` | number | No | The subscription duration of the EIP. Example: `1` |
| `pricingCycle` | string | No | The billing cycle of the subscription EIP. Valid values: Example: `Month` |
| `publicIpAddressPoolId` | string | No | The ID of the IP address pool. Example: `pippool-2vc0kxcedhquybdsz****` |
| `regionId` | string | Yes | The ID of the region to which the EIP belongs. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group. Example: `rg-acfmxazffggds****` |
| `securityProtectionTypes` | string[] | No | The editions of Anti-DDoS. Example: `AntiDDoS_Enhanced` |
| `zone` | string | No | The zone of the EIP. Example: `cn-hangzhou-a` |

## allocateEipAddressPro

**Signature:** `allocateEipAddressPro(request: AllocateEipAddressProRequest)`

Requests a specified elastic IP address (EIP)..

**Parameters:** (4 required, 12 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | - |
| `autoPay` | boolean | Yes | Specifies whether to enable automatic payment. Default value: true. Valid values: Example: `true` |
| `bandwidth` | string | No | The maximum bandwidth of the specified EIP. Unit: Mbit/s. Example: `5` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `0c593ea1-3bea-11e9-b96b-88e9fe6****` |
| `ISP` | string | No | The line type. Valid values: Example: `BGP` |
| `instanceChargeType` | string | No | The billing method of the EIP. Valid values: Example: `PostPaid` |
| `instanceId` | string | No | The EIP ID. Example: `eip-25877c70gddh****` |
| `internetChargeType` | string | No | The metering method of the EIP. Valid values: Example: `PayByBandwidth` |
| `ipAddress` | string | No | The IP address of the EIP. Example: `192.0.XX.XX` |
| `netmode` | string | No | The network type. By default, this value is set to **public**, which specifies the public network ty Example: `public` |
| `period` | number | Yes | The subscription duration. Example: `1` |
| `pricingCycle` | string | Yes | The billing cycle of the subscription EIP. Valid values: Example: `Month` |
| `publicIpAddressPoolId` | string | No | The ID of the IP address pool. Example: `pippool-2vc0kxcedhquybdsz****` |
| `regionId` | string | Yes | The ID of the region to which the EIP belongs. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which the EIP belongs. Example: `rg-resourcegroup****` |
| `securityProtectionTypes` | string[] | No | The editions of Anti-DDoS. |

## allocateEipSegmentAddress

**Signature:** `allocateEipSegmentAddress(request: AllocateEipSegmentAddressRequest)`

allocateEipSegmentAddress operation.

**Parameters:** (2 required, 7 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bandwidth` | string | No | The maximum bandwidth of the contiguous EIP group. Unit: Mbit/s. Example: `5` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `02fb3da4-130e-11e9-8e44-001****` |
| `eipMask` | string | Yes | The subnet mask of the contiguous EIP group. Valid values: Example: `28` |
| `internetChargeType` | string | No | The metering method of contiguous EIPs. Valid values: Example: `PayByBandwidth` |
| `isp` | string | No | The line type. Valid values: Example: `BGP` |
| `netmode` | string | No | The network type. Set the value to **public**, which specifies the public network type. Example: `public` |
| `regionId` | string | Yes | The ID of the region in which the contiguous EIP group resides. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The resource group ID. Example: `rg-bp67acfmxazb4ph****` |
| `zone` | string | No | The zone of the contiguous EIP group. Example: `cn-hangzhou-a` |

## releaseEipAddress

**Signature:** `releaseEipAddress(request: ReleaseEipAddressRequest)`

Before you call this operation, take note of the following items: *   Before you release an EIP, make sure that the EIP meets the following requirements: *   You can release only an EIP that is in the.

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `allocationId` | string | Yes | The ID of the EIP that you want to release. Example: `eip-2zeerraiwb7uj6i0d****` |
| `regionId` | string | No | The ID of the region to which the EIP belongs. You can call the [DescribeRegions](https://help.aliyu Example: `cn-hangzhou` |

## releaseEipSegmentAddress

**Signature:** `releaseEipSegmentAddress(request: ReleaseEipSegmentAddressRequest)`

After you call the **ReleaseEipSegmentAddress** operation, all EIPs in the specified group are released. *   **ReleaseEipSegmentAddress** is an asynchronous operation. After a request is sent, the sys.

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `02fb3da4-130e-11e9-8e44-001sdfg` |
| `regionId` | string | Yes | The region ID of the contiguous EIPs. You can call the [DescribeRegions](https://help.aliyun.com/doc Example: `cn-hangzhou` |
| `segmentInstanceId` | string | Yes | The ID of the contiguous EIP group to be released. Example: `eipsg-2zett8ba055tbsxme****` |

## associateEipAddress

**Signature:** `associateEipAddress(request: AssociateEipAddressRequest)`

You can associate an EIP with an Elastic Compute Service (ECS) instance, a Classic Load Balancer (CLB) instance, a secondary elastic network interface (ENI), a NAT gateway, or a high-availability virt.

**Parameters:** (5 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `allocationId` | string | Yes | The ID of the EIP that you want to associate with an instance. Example: `eip-2zeerraiwb7ujsxdc****` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `0c593ea1-3bea-11e9-b96b-88e9fe63****` |
| `instanceId` | string | Yes | The ID of the instance with which you want to associate the EIP. Example: `i-2zebb08phyczzawe****` |
| `instanceRegionId` | string | Yes | The ID of the region in which the instance with which you want to associate the EIP resides. Example: `cn-hangzhou` |
| `instanceType` | string | No | The type of the instance with which you want to associate the EIP. Valid values: Example: `EcsInstance` |
| `mode` | string | Yes | The association mode. Valid values: Example: `NAT` |
| `privateIpAddress` | string | No | The IP address in the CIDR block of the vSwitch. Example: `192.168.XX.XX` |
| `regionId` | string | No | The ID of the region to which the EIP belongs. Example: `cn-hangzhou` |
| `vpcId` | string | Yes | The ID of the VPC in which an IPv4 gateway is created. The VPC and the EIP must be in the same regio Example: `vpc-257gqcdfvx6n****` |

## associateEipAddressBatch

**Signature:** `associateEipAddressBatch(request: AssociateEipAddressBatchRequest)`

You can call the **AssociateEipAddressBatch** operation to associate EIPs with an instance in the same region. The instance must be a NAT gateway or a secondary elastic network interface (ENI). For mo.

**Parameters:** (5 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bindedInstanceId` | string | Yes | The ID of the instance with which you want to associate the EIPs. Example: `ngw-hp3akk9irtd69jad****` |
| `bindedInstanceType` | string | Yes | The type of the instance with which you want to associate the EIPs. Valid values: Example: `Nat` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `02fb3da4-130e-11e9-8e44-0016e04115b` |
| `instanceIds` | string[] | Yes | The EIPs to be associated with the instance. |
| `mode` | string | Yes | The association mode. Set the value to **MULTI_BINDED**, which specifies the Multi-EIP-to-ENI mode. Example: `MULTI_BINDED` |
| `regionId` | string | Yes | The ID of the region to which the EIPs belong. You can call the [DescribeRegions](https://help.aliyu Example: `cn-hangzhou` |

## unassociateEipAddress

**Signature:** `unassociateEipAddress(request: UnassociateEipAddressRequest)`

**UnassociateEipAddress** is an asynchronous operation. After a request is sent, the system returns a request ID and runs the task in the background. You can call the [DescribeEipAddresses](https://he.

**Parameters:** (1 required, 6 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `allocationId` | string | Yes | The ID of the EIP that you want to disassociate. Example: `eip-2zeerraiwb7uj6i0d****` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `02fb3da4-130e-11****` |
| `force` | boolean | No | Specifies whether to disassociate the EIP from a NAT gateway if a DNAT or SNAT entry is added to the Example: `false` |
| `instanceId` | string | No | The ID of the instance from which you want to disassociate the EIP. Example: `i-hp3akk9irtd69jad****` |
| `instanceType` | string | No | The type of instance from which you want to disassociate the EIP. Valid values: Example: `EcsInstance` |
| `privateIpAddress` | string | No | The private IP address of the ECS instance or the secondary ENI from which you want to disassociate  Example: `192.XX.XX.2` |
| `regionId` | string | No | The ID of the region to which the EIP belongs. You can call the [DescribeRegions](https://help.aliyu Example: `cn-hangzhou` |

## describeEipAddresses

**Signature:** `describeEipAddresses(request: DescribeEipAddressesRequest)`

You can call this operation to query information about EIPs in a region, including maximum bandwidth, billing methods, and associated instances..

**Parameters:** (1 required, 23 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The filter key used to query resources. Set the value to **CreationStartTime**, which specifies the  Example: `CreationStartTime` |
| `value` | string | No | The filter value used to query resources. Specify the time in the ISO 8601 standard in the `YYYY-MM- Example: `2023-01-01T01:00Z` |
| `key` | string | No | The key of the tag. You can specify up to 20 tag keys. The tag key cannot be an empty string. Example: `FinanceDept` |
| `value` | string | No | The value of the tag. You can specify up to 20 tag values. The tag value can be an empty string. Example: `FinanceJoshua` |
| `allocationId` | string | No | The ID of the EIP that you want to query. Example: `eip-2zeerraiwb7ujxscd****` |
| `associatedInstanceId` | string | No | The ID of the instance associated with the EIP. Example: `i-2zebb08phyccdvf****` |
| `associatedInstanceType` | string | No | The type of the cloud resource with which you want to associate the EIP. Valid values: Example: `EcsInstance` |
| `chargeType` | string | No | The billing method of the EIP. Valid values: Example: `PostPaid` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Example: `false` |
| `eipAddress` | string | No | The EIP that you want to query. Example: `47.75.XX.XX` |
| `eipName` | string | No | The name of the EIP. Example: `EIP-01` |
| `ISP` | string | No | The line type. Valid values: Example: `BGP` |
| `includeReservationData` | boolean | No | Specifies whether to return information about pending orders. Valid values: Example: `false` |
| `lockReason` | string | No | The reason why the EIP is locked. Valid values: Example: `financial` |
| `pageNumber` | number | No | The page number. Default value: **1**. Example: `10` |
| `pageSize` | number | No | The number of entries per page. Valid values: 1 to **100**. Default value: **10**. Example: `10` |
| `publicIpAddressPoolId` | string | No | The IP address pool to which the EIP that you want to query belongs. Example: `pippool-2vc0kxcedhquybdsz****` |
| `regionId` | string | Yes | The region ID of the EIP. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which the EIP belongs. Example: `rg-acfmxazb4pcdvf****` |
| `securityProtectionEnabled` | boolean | No | Specifies whether to activate Anti-DDoS Pro/Premium. Valid values: Example: `false` |
| `segmentInstanceId` | string | No | The ID of the contiguous EIP group. Example: `eipsg-t4nr90yik5oy38xdy****` |
| `serviceManaged` | boolean | No | Indicates whether the instance is managed. Valid values: Example: `false` |
| `status` | string | No | The state of the EIP. Valid values: Example: `Available` |
| `tag` | DescribeEipAddressesRequestTag[] | No | - |

## describeEipGatewayInfo

**Signature:** `describeEipGatewayInfo(request: DescribeEipGatewayInfoRequest)`

You can query only EIPs that are associated with secondary elastic network interfaces (ENIs) in multi-EIP-to-ENI mode..

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the secondary ENI that is associated with the EIP. Example: `eni-bp1d66qjxb3qoin3****` |
| `regionId` | string | Yes | The region to which the EIP that you want to query belongs. You can call the [DescribeRegions](https Example: `cn-zhangjiakou` |

## describeEipMonitorData

**Signature:** `describeEipMonitorData(request: DescribeEipMonitorDataRequest)`

To improve user experience in querying monitoring data, we recommend that you call the DescribeMetricList API operation provided by CloudMonitor to query EIP monitoring data. For more information, see.

**Parameters:** (3 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `allocationId` | string | Yes | The ID of the EIP. Example: `eip-2zeerraiwb7uj6idcfv****` |
| `endTime` | string | Yes | The end of the time range to query. The time must be in UTC. Specify the time in the ISO 8601 standa Example: `2020-01-05T03:05:10Z` |
| `period` | number | No | The duration of each monitoring data entry. Unit: seconds. Valid values: **60** (default), **300**,  Example: `60` |
| `regionId` | string | No | The ID of the region to which the EIP belongs. You can call the [DescribeRegions](https://help.aliyu Example: `cn-hangzhou` |
| `startTime` | string | Yes | The beginning of the time range to query. The time must be in UTC. Specify the time in the ISO 8601  Example: `2020-01-05T01:05:05Z` |

## describeEipSegment

**Signature:** `describeEipSegment(request: DescribeEipSegmentRequest)`

Queries contiguous elastic IP address (EIP) groups..

**Parameters:** (1 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `02fb3da4-130e-11e9-8e44-001sdfg` |
| `pageNumber` | number | No | The page number. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Maximum value: **50**. Default value: **10**. Example: `10` |
| `regionId` | string | Yes | The ID of the region to which the contiguous EIP group belongs. You can call the [DescribeRegions](h Example: `cn-hangzhou` |
| `segmentInstanceId` | string | No | The ID of the contiguous EIP group that you want to query. Example: `eipsg-2zett8ba055tbsxme****` |

## describeHighDefinitionMonitorLogAttribute

**Signature:** `describeHighDefinitionMonitorLogAttribute(request: DescribeHighDefinitionMonitorLogAttributeRequest)`

Queries configurations about the fine-grained monitoring feature of an elastic IP address (EIP)..

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance whose fine-grained monitoring configurations you want to query. Example: `eip-wz9fi6qboho9fwgx7****` |
| `instanceType` | string | No | The type of the instance. Set the value to **EIP**. Example: `EIP` |
| `regionId` | string | Yes | The region ID of the instance. Example: `cn-hangzhou` |

## modifyEipAddressAttribute

**Signature:** `modifyEipAddressAttribute(request: ModifyEipAddressAttributeRequest)`

Modifies the name, description, and maximum bandwidth of an elastic IP address (EIP)..

**Parameters:** (1 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `allocationId` | string | Yes | The ID of the pay-as-you-go EIP. Example: `eip-2zeerraiwb7uj6i0d****` |
| `bandwidth` | string | No | The new maximum bandwidth of the EIP. Valid values: Example: `100` |
| `description` | string | No | The new description of the EIP. Example: `abc` |
| `name` | string | No | The new name of the EIP. Example: `Test123` |
| `regionId` | string | No | The region ID of the EIP. Example: `cn-hangzhou` |

## addCommonBandwidthPackageIp

**Signature:** `addCommonBandwidthPackageIp(request: AddCommonBandwidthPackageIpRequest)`

Before you call this operation, take note of the following items: *   When you call this operation to associate an EIP with an Internet Shared Bandwidth instance, make sure that the EIP meets the foll.

**Parameters:** (3 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bandwidthPackageId` | string | Yes | The ID of the Internet Shared Bandwidth instance. Example: `cbwp-2ze2ic1xd2qeqasdf****` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `0c593ea1-3bea-11e9-b96b-88e9fe637760` |
| `ipInstanceId` | string | Yes | The EIP ID. Example: `eip-2zeerraiwb7uqwed****` |
| `ipType` | string | No | The type of IP address. Set the value to **EIP** to associate EIPs with the Internet Shared Bandwidt Example: `EIP` |
| `regionId` | string | Yes | The region ID of the Internet Shared Bandwidth instance. Example: `cn-hangzhou` |

## addCommonBandwidthPackageIps

**Signature:** `addCommonBandwidthPackageIps(request: AddCommonBandwidthPackageIpsRequest)`

When you call this operation to associate EIPs with an Internet Shared Bandwidth instance, make sure that the EIPs meet the following requirements: *   The EIPs use the pay-as-you-go billing method. *.

**Parameters:** (3 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bandwidthPackageId` | string | Yes | The ID of the Internet Shared Bandwidth instance. Example: `cbwp-2ze2ic1xd2qeqasdf****` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `ipInstanceIds` | string[] | Yes | The list of EIPs that you want to associate with the Internet Shared Bandwidth instance. |
| `ipType` | string | No | The type of the IP address. Set the value to **EIP** to associate EIPs with the EIP bandwidth plan. Example: `EIP` |
| `regionId` | string | Yes | The region ID of the Internet Shared Bandwidth instance. Example: `cn-shanghai` |

## removeCommonBandwidthPackageIp

**Signature:** `removeCommonBandwidthPackageIp(request: RemoveCommonBandwidthPackageIpRequest)`

Disassociates an EIP from an Internet Shared Bandwidth instance..

**Parameters:** (3 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bandwidthPackageId` | string | Yes | The ID of the Internet Shared Bandwidth instance. Example: `cbwp-2ze2ic1xd2qeqk145****` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `ipInstanceId` | string | Yes | The EIP ID. Example: `eip-2zeerraiwb7uj6i0d****` |
| `regionId` | string | Yes | The region ID of the Internet Shared Bandwidth instance. Example: `cn-hangzhou` |

## addGlobalAccelerationInstanceIp

**Signature:** `addGlobalAccelerationInstanceIp(request: AddGlobalAccelerationInstanceIpRequest)`

Associates an elastic IP address (EIP) with a shared-bandwidth Global Accelerator (GA) instance..

**Parameters:** (3 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `globalAccelerationInstanceId` | string | Yes | The ID of the shared-bandwidth GA instance. Example: `ga-Ldefrgbttnyyf****` |
| `ipInstanceId` | string | Yes | The EIP ID. You can call the [DescribeEipAddresses](https://help.aliyun.com/document_detail/36018.ht Example: `eip-rw434rwfdeaf****` |
| `regionId` | string | Yes | The region of the shared-bandwidth GA instance. Example: `cn-hangzhou` |

## removeGlobalAccelerationInstanceIp

**Signature:** `removeGlobalAccelerationInstanceIp(request: RemoveGlobalAccelerationInstanceIpRequest)`

@param request - RemoveGlobalAccelerationInstanceIpRequest.

**Parameters:** (3 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `globalAccelerationInstanceId` | string | Yes | The ID of the shared-bandwidth instance. Example: `ga-m5ex47zwya1sejyni****` |
| `ipInstanceId` | string | Yes | The ID of the EIP. Example: `eip-bp13e9i2qst4g6jzi****` |
| `regionId` | string | Yes | The ID of the region where the shared-bandwidth instance is located. Example: `cn-hangzhou` |

## unassociateGlobalAccelerationInstance

**Signature:** `unassociateGlobalAccelerationInstance(request: UnassociateGlobalAccelerationInstanceRequest)`

Disassociates a Global Accelerator (GA) instance from a backend server..

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `globalAccelerationInstanceId` | string | Yes | The ID of the GA instance. Example: `ga-1sxeedefrr33****` |
| `instanceType` | string | No | The backend server type. Valid values: Example: `RemoteEcsInstance` |
| `regionId` | string | Yes | The region ID of the GA instance. Example: `cn-hangzhou` |

## createPublicIpAddressPool

**Signature:** `createPublicIpAddressPool(request: CreatePublicIpAddressPoolRequest)`

By default, the IP address pool feature is unavailable. You can apply for the privilege to use the **IP address pool feature** in the Quota Center console. For more information, see the "Request a quo.

**Parameters:** (1 required, 12 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The tag key of the resource. You can specify up to 20 tag keys. The tag key cannot be an empty strin Example: `FinanceDept` |
| `value` | string | No | The tag value of the resource. You can specify up to 20 tag values. The tag value can be an empty st Example: `FinanceJoshua` |
| `bizType` | string | No | The service type of the IP address pool. Valid values: Example: `Default` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `02fb3da4-130e-11****` |
| `description` | string | No | The description of the IP address pool. Example: `AddressPoolDescription` |
| `dryRun` | boolean | No | Specifies whether to precheck only this request. Valid values: Example: `false` |
| `isp` | string | No | The line type. Valid values: Example: `BGP` |
| `name` | string | No | The name of the IP address pool. Example: `AddressPoolName` |
| `regionId` | string | Yes | The ID of the region where you want to create the IP address pool. Example: `cn-chengdu` |
| `resourceGroupId` | string | No | The ID of the resource group to which the IP address pool belongs. Example: `rg-acfmxazb4pcdvf****` |
| `securityProtectionTypes` | string[] | No | - |
| `tag` | CreatePublicIpAddressPoolRequestTag[] | No | - |
| `zones` | string[] | No | - |

## deletePublicIpAddressPool

**Signature:** `deletePublicIpAddressPool(request: DeletePublicIpAddressPoolRequest)`

Before you call this operation, take note of the following items: *   Before you delete an IP address pool, make sure that no IP address in the pool is being used. *   **DeletePublicIpAddressPool** is.

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `0c593ea1-3bea-11e9-b96b-88e9fe60000` |
| `dryRun` | boolean | No | Specifies whether to perform a dry run, without performing the actual request. Valid values: Example: `false` |
| `publicIpAddressPoolId` | string | Yes | The ID of the IP address pool. Example: `pippool-6wetvn6fumkgycssx****` |
| `regionId` | string | Yes | The ID of the region where you want to create the IP address pool. Example: `cn-chengdu` |

## addPublicIpAddressPoolCidrBlock

**Signature:** `addPublicIpAddressPoolCidrBlock(request: AddPublicIpAddressPoolCidrBlockRequest)`

Before you call this operation, take note of the following limits: *   The CIDR block and the IP address pool must belong to the same region. *   The CIDR block and the IP address pool must use the sa.

**Parameters:** (2 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cidrBlock` | string | No | The CIDR block. Example: `47.0.XX.XX/24` |
| `cidrMask` | number | No | The subnet mask of the CIDR block. After you enter the subnet mask, the system automatically allocat Example: `24` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `02fb3da4-130e-11****` |
| `dryRun` | boolean | No | Specifies whether to perform a dry run, without performing the actual request. Valid values: Example: `false` |
| `publicIpAddressPoolId` | string | Yes | The ID of the IP address pool. Example: `pippool-6wetvn6fumkgycssx****` |
| `regionId` | string | Yes | The region ID of the IP address pool to which you want to add the CIDR block. Example: `cn-chengdu` |

## deletePublicIpAddressPoolCidrBlock

**Signature:** `deletePublicIpAddressPoolCidrBlock(request: DeletePublicIpAddressPoolCidrBlockRequest)`

Before you call this operation, take note of the following items: *   Before you delete a CIDR block, make sure that it is not being used. *   **DeletePublicIpAddressPoolCidrBlock** is an asynchronous.

**Parameters:** (3 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cidrBlock` | string | Yes | The CIDR block. Example: `47.0.XX.XX/24` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `dryRun` | boolean | No | Specifies whether to perform a dry run, without performing the actual request. Valid values: Example: `false` |
| `publicIpAddressPoolId` | string | Yes | The ID of the IP address pool. Example: `pippool-6wetvn6fumkgycssx****` |
| `regionId` | string | Yes | The region ID of the IP address pool from which you want to delete a CIDR block. Example: `cn-chengdu` |

## describePublicIpAddress

**Signature:** `describePublicIpAddress(request: DescribePublicIpAddressRequest)`

You cannot query the range of public IP addresses of a classic network by calling the **DescribePublicIpAddress** operation..

**Parameters:** (1 required, 3 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ipVersion` | string | No | The IP version. Valid values: Example: `ipv4` |
| `pageNumber` | number | No | The page number. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Example: `100` |
| `regionId` | string | Yes | The region that you want to query. You can call the [DescribeRegions](https://help.aliyun.com/docume Example: `cn-hangzhou` |

## listPublicIpAddressPoolCidrBlocks

**Signature:** `listPublicIpAddressPoolCidrBlocks(request: ListPublicIpAddressPoolCidrBlocksRequest)`

查询IP地址池中的IP地址网段信息.

**Parameters:** (2 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cidrBlock` | string | No | The CIDR blocks. Example: `47.0.XX.XX/24` |
| `dryRun` | boolean | No | Specifies whether to perform a dry run. Valid values: Example: `false` |
| `maxResults` | number | No | The maximum number of entries to return. Valid values: **10** to **100**. Default value: **10**. Example: `10` |
| `nextToken` | string | No | The token that is used for the next query. Valid values: Example: `FFmyTO70tTpLG6I3FmYAXGKPd****` |
| `publicIpAddressPoolId` | string | Yes | The ID of the IP address pool. Example: `pippool-6wetvn6fumkgycssx****` |
| `regionId` | string | Yes | The region ID of the CIDR blocks. Example: `cn-chengdu` |

## listPublicIpAddressPools

**Signature:** `listPublicIpAddressPools(request: ListPublicIpAddressPoolsRequest)`

Queries available IP address pools..

**Parameters:** (1 required, 12 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The tag key to add to the resource. You can specify up to 20 tag keys. The tag key cannot be an empt Example: `FinanceDept` |
| `value` | string | No | The tag value to add to the resource. You can specify up to 20 tag values. The tag value can be an e Example: `FinanceJoshua` |
| `dryRun` | boolean | No | Specifies whether to perform a dry run, without performing the actual request. Valid values: Example: `false` |
| `isp` | string | No | The line type. Valid values: Example: `BGP` |
| `maxResults` | number | No | The maximum number of entries to return. Valid values: **10** to **100**. Default value: **10**. Example: `10` |
| `name` | string | No | The name of the IP address pool. Example: `AddressPoolName` |
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. Example: `FFmyTO70tTpLG6I3FmYAXGKPd****` |
| `publicIpAddressPoolIds` | string[] | No | The IDs of the IP address pool. |
| `regionId` | string | Yes | The ID of the region in which the IP address pool that you want to query resides. Example: `cn-chengdu` |
| `resourceGroupId` | string | No | The ID of the resource group to which the IP address pool belongs. Example: `rg-acfmxazb4pcdvf****` |
| `securityProtectionEnabled` | boolean | No | Specifies whether to enable Anti-DDoS Pro/Premium. Valid values: Example: `true` |
| `status` | string | No | The status of the IP address pool. Valid values: Example: `Created` |
| `tags` | ListPublicIpAddressPoolsRequestTags[] | No | - |

## updatePublicIpAddressPoolAttribute

**Signature:** `updatePublicIpAddressPoolAttribute(request: UpdatePublicIpAddressPoolAttributeRequest)`

You cannot repeatedly call the **UpdatePublicIpAddressPoolAttribute** operation to modify the attributes of an IP address pool within the specified period of time..

**Parameters:** (2 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `description` | string | No | The description of the IP address pool. Example: `AddressPoolDescription` |
| `dryRun` | boolean | No | Specifies whether to perform a dry run, without performing the actual request. Valid values: Example: `false` |
| `name` | string | No | The name of the IP address pool. Example: `AddressPoolName` |
| `publicIpAddressPoolId` | string | Yes | The ID of the IP address pool. Example: `pippool-6wetvn6fumkgycssx****` |
| `regionId` | string | Yes | The region ID of the IP address pool that you want to modify. Example: `cn-chengdu` |

## createCommonBandwidthPackage

**Signature:** `createCommonBandwidthPackage(request: CreateCommonBandwidthPackageRequest)`

Creates an Internet Shared Bandwidth instance..

**Parameters:** (3 required, 9 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | - |
| `bandwidth` | number | Yes | The maximum bandwidth of the Internet Shared Bandwidth instance. Unit: Mbit/s. Example: `1000` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `02fb3da4-130e-11e9-8e44-001****` |
| `description` | string | No | The description of the Internet Shared Bandwidth instance. Example: `abc` |
| `ISP` | string | No | The line type. Valid values: Example: `BGP` |
| `internetChargeType` | string | No | - |
| `name` | string | No | The name of the Internet Shared Bandwidth instance. Example: `test123` |
| `ratio` | number | No | The percentage of the minimum bandwidth commitment. Set the parameter to **20**. Example: `20` |
| `regionId` | string | Yes | The region ID of the Internet Shared Bandwidth instance. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group. Example: `rg-acfmxazdjdhd****` |
| `securityProtectionTypes` | string[] | No | - Example: `AntiDDoS_Enhanced` |
| `zone` | string | Yes | The zone of the Internet Shared Bandwidth instance. This parameter is required if you create an Inte Example: `ap-southeast-1-lzdvn-cb` |

## deleteCommonBandwidthPackage

**Signature:** `deleteCommonBandwidthPackage(request: DeleteCommonBandwidthPackageRequest)`

You cannot repeatedly call the **DeleteCommonBandwidthPackage** operation to delete an Internet Shared Bandwidth instance within the specified period of time..

**Parameters:** (2 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bandwidthPackageId` | string | Yes | The ID of the Internet Shared Bandwidth instance. Example: `cbwp-2ze2ic1xd2qeqk145pn4u` |
| `force` | string | No | Specifies whether to forcefully delete the Internet Shared Bandwidth instance. Valid values: Example: `false` |
| `regionId` | string | Yes | The ID of the region where the Internet Shared Bandwidth instance is created. Example: `cn-hangzhou` |

## describeCommonBandwidthPackages

**Signature:** `describeCommonBandwidthPackages(request: DescribeCommonBandwidthPackagesRequest)`

Queries a list of Internet Shared Bandwidth instances in a region..

**Parameters:** (1 required, 11 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The tag key to add to the Internet Shared Bandwidth instance. You can specify up to 20 tag keys. The Example: `KeyTest` |
| `value` | string | No | The tag value to add to the Internet Shared Bandwidth instance. You can specify up to 20 tag values. Example: `ValueTest` |
| `bandwidthPackageId` | string | No | The ID of the Internet Shared Bandwidth instance. Example: `cbwp-2ze2ic1xd2qeqk145****` |
| `dryRun` | boolean | No | Specifies whether to perform a dry run, without performing the actual request. Valid values: Example: `false` |
| `includeReservationData` | boolean | No | Specifies whether to return the information about pending orders. Valid values: Example: `false` |
| `name` | string | No | The name of the Internet Shared Bandwidth instance. Example: `test123` |
| `pageNumber` | number | No | The page number. Default value: **1**. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Valid values: **1 to 50**. Default value: **10**. Example: `10` |
| `regionId` | string | Yes | The ID of the region where the Internet Shared Bandwidth instance resides. Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group. Example: `rg-acfmxazb4ph****` |
| `securityProtectionEnabled` | boolean | No | Specifies whether to enable Anti-DDoS Pro/Premium. Valid values: Example: `false` |
| `tag` | DescribeCommonBandwidthPackagesRequestTag[] | No | - |

## modifyCommonBandwidthPackageAttribute

**Signature:** `modifyCommonBandwidthPackageAttribute(request: ModifyCommonBandwidthPackageAttributeRequest)`

Modifies the name and description of an EIP bandwidth plan..

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bandwidthPackageId` | string | Yes | The ID of the EIP bandwidth plan. Example: `cbwp-2ze2ic1xd2qeqk145****` |
| `description` | string | No | The description of the EIP bandwidth plan. The description must be 2 to 256 characters in length. It Example: `test` |
| `name` | string | No | The name of the EIP bandwidth plan. The name must be 2 to 128 characters in length and can contain l Example: `test123` |
| `regionId` | string | Yes | The ID of the region where the EIP bandwidth plan is created. Example: `cn-hangzhou` |

## modifyCommonBandwidthPackageSpec

**Signature:** `modifyCommonBandwidthPackageSpec(request: ModifyCommonBandwidthPackageSpecRequest)`

Before you call this operation, take note of the following items: *   **ModifyCommonBandwidthPackageSpec** is an asynchronous operation. After a request is sent, the system returns a request ID and ru.

**Parameters:** (3 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bandwidth` | string | Yes | The maximum bandwidth of the Internet Shared Bandwidth instance. Unit: Mbit/s. Example: `1000` |
| `bandwidthPackageId` | string | Yes | The ID of the Internet Shared Bandwidth instance. Example: `cbwp-2ze2ic1xd2qeqk145****` |
| `regionId` | string | Yes | The region ID of the Internet Shared Bandwidth instance. Example: `cn-hangzhou` |

## describe95Traffic

**Signature:** `describe95Traffic(request: Describe95TrafficRequest)`

Queries traffic data of a pay-by-enhanced-95th-percentile Internet Shared Bandwidth instance..

**Parameters:** See `Describe95TrafficRequest` model.

## createGlobalAccelerationInstance

**Signature:** `createGlobalAccelerationInstance(request: CreateGlobalAccelerationInstanceRequest)`

createGlobalAccelerationInstance operation.

**Parameters:** (3 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bandwidth` | string | Yes | The maximum bandwidth of the GA instance. Set the value to **10**. Unit: Mbit/s. Example: `10` |
| `bandwidthType` | string | No | The bandwidth type. Valid values: Example: `Exclusive` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `02fb3da4-130e-11e9-8e44-0016e04115b` |
| `description` | string | No | The description of the GA instance. Example: `My` |
| `name` | string | No | The name of the GA instance. Example: `GA-1` |
| `regionId` | string | Yes | The region ID of the GA instance. Example: `cn-hangzhou` |
| `serviceLocation` | string | Yes | The acceleration area. Valid values: Example: `china-mainland` |

## deleteGlobalAccelerationInstance

**Signature:** `deleteGlobalAccelerationInstance(request: DeleteGlobalAccelerationInstanceRequest)`

When you call this operation, take note of the following items: *   You can delete only pay-as-you-go instances. *   Before you can delete a dedicated instance, disassociate the backend server from th.

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `globalAccelerationInstanceId` | string | Yes | The ID of the GA instance. Example: `ga-asdfsl22s****` |
| `regionId` | string | Yes | The region ID of the GA instance. Example: `cn-hangzhou` |

## describeGlobalAccelerationInstances

**Signature:** `describeGlobalAccelerationInstances(request: DescribeGlobalAccelerationInstancesRequest)`

Queries Global Accelerator (GA) instances..

**Parameters:** (1 required, 10 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bandwidthType` | string | No | The bandwidth type of the GA instance. Valid values: Example: `Exclusive` |
| `globalAccelerationInstanceId` | string | No | The ID of the GA instance. Example: `ga-234sljmxaz****` |
| `includeReservationData` | boolean | No | Specifies whether to return information about pending orders. Valid values: Example: `false` |
| `ipAddress` | string | No | The public IP address of the GA instance. Example: `12.xx.xx.78` |
| `name` | string | No | The name of the GA instance. Example: `GA-1` |
| `pageNumber` | number | No | The number of the page to return. Default value: **1**. Example: `10` |
| `pageSize` | number | No | The number of entries to return on each page. Maximum value: **100**. Default value: **10**. Example: `10` |
| `regionId` | string | Yes | The region ID of the GA instance. You can call the [DescribeRegions](https://help.aliyun.com/documen Example: `cn-hangzhou` |
| `serverId` | string | No | The ID of the backend service instance. Example: `i-sxjblddejj9x****` |
| `serviceLocation` | string | No | The region of the backend service. Valid values: Example: `china-mainland` |
| `status` | string | No | The status of the GA instance. Valid values: Example: `Available` |

## modifyGlobalAccelerationInstanceAttributes

**Signature:** `modifyGlobalAccelerationInstanceAttributes(request: ModifyGlobalAccelerationInstanceAttributesRequest)`

Modifies the name and description of a Global Accelerator (GA) instance..

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `description` | string | No | The description of the GA instance. Example: `My` |
| `globalAccelerationInstanceId` | string | Yes | The ID of the GA instance. Example: `ga-14fdsf3****` |
| `name` | string | No | The name of the GA instance. Example: `GA-1` |
| `regionId` | string | Yes | The region ID of the GA instance. Example: `cn-hangzhou` |

## modifyGlobalAccelerationInstanceSpec

**Signature:** `modifyGlobalAccelerationInstanceSpec(request: ModifyGlobalAccelerationInstanceSpecRequest)`

## Usage notes You cannot call this operation to modify the maximum bandwidth of a subscription GA instance..

**Parameters:** (3 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bandwidth` | string | Yes | The maximum bandwidth of the GA instance. Unit: Mbit/s. Set the value to **10**. Example: `10` |
| `globalAccelerationInstanceId` | string | Yes | The ID of the GA instance. Example: `ga-32s33s****` |
| `regionId` | string | Yes | The region ID of the GA instance. Example: `cn-hangzhou` |

## describeServerRelatedGlobalAccelerationInstances

**Signature:** `describeServerRelatedGlobalAccelerationInstances(request: DescribeServerRelatedGlobalAccelerationInstancesRequest)`

> You can call this operation to query only dedicated-bandwidth GA instances..

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ownerAccount` | string | No | - |
| `regionId` | string | Yes | The region ID of the GA instance. Example: `cn-hangzhou` |
| `serverId` | string | Yes | The ID of the backend service instance. Example: `i-12s3sdf****` |
| `serverType` | string | No | The type of the backend service instance. Valid values: Example: `EcsInstance` |


## cancelCommonBandwidthPackageIpBandwidth

**Signature:** `cancelCommonBandwidthPackageIpBandwidth(request: CancelCommonBandwidthPackageIpBandwidthRequest)`

Before you call this operation, take note of the following items: *   After this operation is performed, the maximum bandwidth of the EIP equals that of the Internet Shared Bandwidth instance. *   You.

**Parameters:** (3 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bandwidthPackageId` | string | Yes | The ID of the Internet Shared Bandwidth instance. Example: `cbwp-bp13d0m4e2qv8xxxxxxxx` |
| `eipId` | string | Yes | The ID of the EIP that is associated with the Internet Shared Bandwidth instance. Example: `eip-2zewysoansu0sxxxxxxxx` |
| `regionId` | string | Yes | The region ID of the Internet Shared Bandwidth instance. You can call the [DescribeRegions](https:// Example: `cn-hangzhou` |


## modifyCommonBandwidthPackageIpBandwidth

**Signature:** `modifyCommonBandwidthPackageIpBandwidth(request: ModifyCommonBandwidthPackageIpBandwidthRequest)`

You can call the **ModifyCommonBandwidthPackageIpBandwidth** operation to set the maximum bandwidth of an EIP that is associated with an Internet Shared Bandwidth instance. This prevents an EIP from e.

**Parameters:** (4 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bandwidth` | string | Yes | The maximum bandwidth for the EIP. This value cannot be larger than the maximum bandwidth of the Int Example: `500` |
| `bandwidthPackageId` | string | Yes | The ID of the Internet Shared Bandwidth instance. Example: `cbwp-2zep6hw5d6y8exscd****` |
| `eipId` | string | Yes | The ID of the EIP that is associated with the Internet Shared Bandwidth instance. Example: `eip-2zewysoansu0svfbg****` |
| `regionId` | string | Yes | The region ID of the Internet Shared Bandwidth instance. You can call the [DescribeRegions](https:// Example: `cn-hangzhou` |


## modifyEipForwardMode

**Signature:** `modifyEipForwardMode(request: ModifyEipForwardModeRequest)`

Modifies the EIP forwarding mode..

**Parameters:** (3 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `02fb3da4-130e-11e9-8e44-0016e04115b` |
| `instanceId` | string | Yes | The ID of the EIP whose attributes you want to modify. Example: `eip-j5ebhbw3br92fy****` |
| `mode` | string | Yes | The association mode. Valid values: Example: `BINDED` |
| `regionId` | string | Yes | The ID of the region to which the EIP belongs. You can call the DescribeRegions operation to query t Example: `cn-hangzhou` |


## setHighDefinitionMonitorLogStatus

**Signature:** `setHighDefinitionMonitorLogStatus(request: SetHighDefinitionMonitorLogStatusRequest)`

You cannot repeatedly call **SetHighDefinitionMonitorLogStatus** within a specific period of time..

**Parameters:** (5 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The ID of the instance for which you want to configure fine-grained monitoring. Example: `eip-wz9fi6qboho9fwgx7****` |
| `instanceType` | string | No | The instance type. Set the value to **EIP**. Example: `EIP` |
| `logProject` | string | Yes | The name of the Simple Log Service (SLS) project. Example: `hdmonitor-cn-shenzhen` |
| `logStore` | string | Yes | The name of the Logstore. Example: `hdmonitor` |
| `regionId` | string | Yes | The region ID of the instance. Example: `cn-hangzhou` |
| `status` | string | Yes | The status of fine-grained monitoring. Valid values: Example: `ON` |


## transformEipSegmentToPublicIpAddressPool

**Signature:** `transformEipSegmentToPublicIpAddressPool(request: TransformEipSegmentToPublicIpAddressPoolRequest)`

Migrate a contiguous EIP group to an IP address pool..

**Parameters:** (2 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `02fb3da4-130e-11****` |
| `description` | string | No | The description of the IP address pool. Example: `AddressPoolDescription` |
| `instanceId` | string | Yes | The ID of the contiguous EIP group to be migrated. Example: `eipsg-2zett8ba055tbsxme****` |
| `name` | string | No | The name of the IP address pool. Example: `AddressPoolName` |
| `regionId` | string | Yes | The ID of the region to which the contiguous EIP group belongs. You can call the [DescribeRegions](h Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which the address pool belongs. Example: `rg-acfmxazb4pcdvf****` |


## openPublicIpAddressPoolService

**Signature:** `openPublicIpAddressPoolService(request: OpenPublicIpAddressPoolServiceRequest)`

Enables the IP address pool feature..

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655442455` |
| `regionId` | string | Yes | The ID of the region. Call [DescribeRegion](https://www.alibabacloud.com/help/en/vpc/developer-refer Example: `cn-hangzhou` |


## getPublicIpAddressPoolServiceStatus

**Signature:** `getPublicIpAddressPoolServiceStatus(request: GetPublicIpAddressPoolServiceStatusRequest)`

Queries whether the IP address pool feature is enabled..

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655442455` |
| `regionId` | string | Yes | The region ID of the IP address pool. Example: `cn-hangzhou` |

