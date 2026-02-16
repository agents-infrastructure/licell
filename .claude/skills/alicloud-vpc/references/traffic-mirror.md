# Traffic Mirror

Traffic mirroring for network packet capture and inspection.

## createTrafficMirrorFilter

**Signature:** `createTrafficMirrorFilter(request: CreateTrafficMirrorFilterRequest)`

*CreateTrafficMirrorFilter** is an asynchronous operation. After a request is sent, the system returns a request ID and runs the task in the background. You can call the [ListTrafficMirrorFilters](htt.

**Parameters:** (1 required, 26 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `regionId` | string | Yes | The ID of the region to which the mirrored traffic belongs. Example: `cn-hongkong` |
| `action` | string | No | The collection policy of the outbound rule. Valid values: Example: `accept` |
| `destinationCidrBlock` | string | No | The destination CIDR block of the outbound traffic. Example: `10.0.0.0/24` |
| `destinationPortRange` | string | No | The destination port range of the outbound traffic. Valid values for a port: **1** to **65535**. Sep Example: `22/40` |
| `ipVersion` | string | No | The IP version of the instance. The following value may be returned: Example: `IPv4` |
| `priority` | number | No | The priority of the outbound rule. A smaller value indicates a higher priority. The maximum value of Example: `1` |
| `protocol` | string | No | The type of the protocol that is used by the outbound traffic that you want to mirror. Valid values: Example: `TCP` |
| `sourceCidrBlock` | string | No | The source CIDR block of the outbound traffic. Example: `10.0.0.0/24` |
| `sourcePortRange` | string | No | The source port range of the outbound traffic. Valid values: **1** to **65535**. Separate the first  Example: `22/40` |
| `action` | string | No | The collection policy of the inbound rule. Valid values: Example: `accept` |
| `destinationCidrBlock` | string | No | The destination CIDR block of the inbound traffic. Example: `10.0.0.0/24` |
| `destinationPortRange` | string | No | The destination port range of the inbound traffic. Valid value: **1** to **65535**. Separate the fir Example: `80/120` |
| `ipVersion` | string | No | The IP version of the instance. The following value may be returned: Example: `IPv4` |
| `priority` | number | No | The priority of the inbound rule. A smaller value indicates a higher priority. The maximum value of  Example: `1` |
| `protocol` | string | No | The type of the protocol is used by the inbound traffic that you want to mirror. Valid values: Example: `TCP` |
| `sourceCidrBlock` | string | No | The source CIDR block of the inbound traffic. Example: `10.0.0.0/24` |
| ... | ... | ... | *11 more optional parameters* |

## deleteTrafficMirrorFilter

**Signature:** `deleteTrafficMirrorFilter(request: DeleteTrafficMirrorFilterRequest)`

The **DeleteTrafficMirrorFilter** operation is asynchronous. After you send the request, the system returns a request ID. However, the operation is still being performed in the system background. You .

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `0c593ea1-3bea-11e9-b96b-88e9fe63****` |
| `dryRun` | boolean | No | Specifies whether to check the request without performing the operation. Valid values: Example: `false` |
| `regionId` | string | Yes | The ID of the region to which the mirrored traffic belongs. You can call the [DescribeRegions](https Example: `cn-hongkong` |
| `trafficMirrorFilterId` | string | Yes | The ID of the filter. Example: `tmf-j6cmls82xnc86vtpe****` |

## createTrafficMirrorFilterRules

**Signature:** `createTrafficMirrorFilterRules(request: CreateTrafficMirrorFilterRulesRequest)`

**CreateTrafficMirrorFilterRules** is an asynchronous operation. After a request is sent, the system returns a request ID and runs the task in the background. You can call [ListTrafficMirrorFilters](h.

**Parameters:** (2 required, 20 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | No | The collection policy of the outbound rule. Valid values: Example: `accept` |
| `destinationCidrBlock` | string | No | The destination CIDR block of the outbound traffic. Example: `10.0.0.0/24` |
| `destinationPortRange` | string | No | The destination port range of the outbound traffic. Valid value: **1** to **65535**. Separate the fi Example: `22/40` |
| `ipVersion` | string | No | The IP version of the instance. Valid values: Example: `IPv4` |
| `priority` | number | No | The priority of the outbound rule. A smaller value indicates a higher priority. The maximum value of Example: `1` |
| `protocol` | string | No | The protocol that is used by the outbound traffic to be mirrored. Valid values: Example: `TCP` |
| `sourceCidrBlock` | string | No | The source CIDR block of the outbound traffic. Example: `10.0.0.0/24` |
| `sourcePortRange` | string | No | The source port range of the outbound traffic. Valid value: **1** to **65535**. Separate the first a Example: `22/40` |
| `action` | string | No | The policy of the inbound rule. Valid values: Example: `accept` |
| `destinationCidrBlock` | string | No | The destination CIDR block of the inbound traffic. Example: `10.0.0.0/24` |
| `destinationPortRange` | string | No | The destination port range of the inbound traffic. Valid value: **1** to **65535**. Separate the fir Example: `80/120` |
| `ipVersion` | string | No | The IP version of the instance. The following value may be returned: Example: `IPv4` |
| `priority` | number | No | The priority of the inbound rule. A smaller value indicates a higher priority. The maximum value of  Example: `1` |
| `protocol` | string | No | The protocol that is used by the inbound traffic to be mirrored. Valid values: Example: `TCP` |
| `sourceCidrBlock` | string | No | The source CIDR block of the inbound traffic. Example: `10.0.0.0/24` |
| `sourcePortRange` | string | No | The source port range of the inbound traffic. Valid value: **1** to **65535**. Separate the first an Example: `80/120` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `dryRun` | boolean | No | Specifies whether to check the request without performing the operation. Valid values: Example: `false` |
| `egressRules` | CreateTrafficMirrorFilterRulesRequestEgressRules[] | No | - |
| `ingressRules` | CreateTrafficMirrorFilterRulesRequestIngressRules[] | No | - |
| `regionId` | string | Yes | The ID of the region to which the mirrored traffic belongs. Example: `cn-hongkong` |
| `trafficMirrorFilterId` | string | Yes | The ID of the filter. Example: `tmf-j6cmls82xnc86vtpe****` |

## deleteTrafficMirrorFilterRules

**Signature:** `deleteTrafficMirrorFilterRules(request: DeleteTrafficMirrorFilterRulesRequest)`

**DeleteTrafficMirrorFilterRules** is an asynchronous operation. After a request is sent, the system returns a request ID and runs the task in the background. You can call [ListTrafficMirrorFilters](h.

**Parameters:** (3 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `0c593ea1-3bea-11e9-b96b-88e9fe63****` |
| `dryRun` | boolean | No | Specifies whether to check the request without performing the operation. Valid values: Example: `false` |
| `regionId` | string | Yes | The ID of the region to which the mirrored traffic belongs. You can call the [DescribeRegions](https Example: `cn-hongkong` |
| `trafficMirrorFilterId` | string | Yes | The ID of the filter. Example: `tmf-j6cmls82xnc86vtpe****` |
| `trafficMirrorFilterRuleIds` | string[] | Yes | The ID of the inbound or outbound rule. Example: `tmr-j6cbmubn323k7jlq3****` |

## createTrafficMirrorSession

**Signature:** `createTrafficMirrorSession(request: CreateTrafficMirrorSessionRequest)`

*CreateTrafficMirrorSession** is an asynchronous operation. After a request is sent, the system returns a request ID and runs the task in the background. You can call [ListTrafficMirrorSessions](https.

**Parameters:** (6 required, 11 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The tag key. You can specify at most 20 tag keys. The tag key cannot be an empty string. Example: `FinanceDept` |
| `value` | string | No | The tag value. You can specify at most 20 tag values. The tag value can be an empty string. Example: `FinanceJoshua` |
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `0c593ea1-3bea-11e9-b96b-88e9fe63****` |
| `dryRun` | boolean | No | Specifies whether to perform a dry run. Valid values: Example: `false` |
| `enabled` | boolean | No | Specifies whether to enable the traffic mirror session. Valid values: Example: `false` |
| `packetLength` | number | No | The maximum transmission unit. Example: `1500` |
| `priority` | number | Yes | The priority of the traffic mirror session. Valid values: **1** to **32766**. Example: `1` |
| `regionId` | string | Yes | The ID of the region to which the traffic mirror session belongs. You can call the [DescribeRegions] Example: `cn-hongkong` |
| `resourceGroupId` | string | No | The ID of the resource group to which the mirrored traffic belongs. Example: `rg-bp67acfmxazb4ph****` |
| `tag` | CreateTrafficMirrorSessionRequestTag[] | No | - |
| `trafficMirrorFilterId` | string | Yes | The ID of the filter. Example: `tmf-j6cmls82xnc86vtpe****` |
| `trafficMirrorSessionDescription` | string | No | The description of the traffic mirror session. Example: `This` |
| `trafficMirrorSessionName` | string | No | The name of the traffic mirror session. Example: `test` |
| `trafficMirrorSourceIds` | string[] | Yes | The ID of the traffic mirror source. You can specify only an elastic network interface (ENI) as the  Example: `eni-j6c2fp57q8rr47rp****` |
| `trafficMirrorTargetId` | string | Yes | The ID of the traffic mirror destination. You can specify only an elastic network interface (ENI) or Example: `eni-j6c8znm5l1yt4sox****` |
| `trafficMirrorTargetType` | string | Yes | The type of the traffic mirror destination. Valid values: Example: `NetworkInterface` |
| `virtualNetworkId` | number | No | The VXLAN network identifier (VNI). Valid values: **0** to **16777215**. Example: `1` |

## deleteTrafficMirrorSession

**Signature:** `deleteTrafficMirrorSession(request: DeleteTrafficMirrorSessionRequest)`

**DeleteTrafficMirrorSession** is an asynchronous operation. After you send the request, the system returns a request ID and runs the task in the background. You can call the [ListTrafficMirrorSession.

**Parameters:** (2 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `0c593ea1-3bea-11e9-b96b-88e9fe63****` |
| `dryRun` | boolean | No | Specifies whether to to perform a dry run. Valid values: Example: `false` |
| `regionId` | string | Yes | The ID of the region to which the traffic mirror session belongs. You can call the [DescribeRegions] Example: `cn-hongkong` |
| `trafficMirrorSessionId` | string | Yes | The ID of the traffic mirror session. Example: `tms-j6cla50buc44ap8tu****` |

## addSourcesToTrafficMirrorSession

**Signature:** `addSourcesToTrafficMirrorSession(request: AddSourcesToTrafficMirrorSessionRequest)`

**AddSourcesToTrafficMirrorSession** is an asynchronous operation. After a request is sent, the system returns a request ID and runs the task in the background. You can call the [ListTrafficMirrorSess.

**Parameters:** (3 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `0c593ea1-3bea-11e9-b96b-88e9fe63****` |
| `dryRun` | boolean | No | Specifies whether to perform only a dry run, without performing the actual request. Valid values: Example: `false` |
| `regionId` | string | Yes | The ID of the region to which the traffic mirror session belongs. Example: `cn-hongkong` |
| `trafficMirrorSessionId` | string | Yes | The ID of the traffic mirror session. Example: `tms-j6cla50buc44ap8tu****` |
| `trafficMirrorSourceIds` | string[] | Yes | The ID of the traffic mirror source. You can specify only an elastic network interface (ENI) as the  Example: `eni-j6ccmrl8z3xkvxgw****` |

## removeSourcesFromTrafficMirrorSession

**Signature:** `removeSourcesFromTrafficMirrorSession(request: RemoveSourcesFromTrafficMirrorSessionRequest)`

**RemoveSourcesFromTrafficMirrorSession** is an asynchronous operation. After a request is sent, the system returns a request ID and runs the task in the background. You can call the [ListTrafficMirro.

**Parameters:** (3 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `0c593ea1-3bea-11e9-b96b-88e9fe63****` |
| `dryRun` | boolean | No | Specifies whether to check the request without performing the operation. Valid values: Example: `false` |
| `regionId` | string | Yes | The ID of the region to which the traffic mirror session belongs. You can call the [DescribeRegions] Example: `cn-hongkong` |
| `trafficMirrorSessionId` | string | Yes | The ID of the traffic mirror session from which you want to delete a traffic mirror source. Example: `tms-j6cla50buc44ap8tu****` |
| `trafficMirrorSourceIds` | string[] | Yes | The ID of the traffic mirror source to be deleted. Maximum value of N: 10. Example: `eni-j6c8znm5l1yt4sox****` |

## listTrafficMirrorSessions

**Signature:** `listTrafficMirrorSessions(request: ListTrafficMirrorSessionsRequest)`

Queries the details of a traffic mirror session..

**Parameters:** (1 required, 14 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The tag key. You can specify at most 20 tag keys. The tag key cannot be an empty string. Example: `FinanceDept` |
| `value` | string | No | The tag value. You can specify at most 20 tag values. The tag value can be an empty string. Example: `FinanceJoshua` |
| `enabled` | boolean | No | Specifies whether to enable the traffic mirror session. Valid values: Example: `false` |
| `maxResults` | number | No | The maximum number of entries to return. Valid values: **1** to **100**. Default value: **10**. Example: `10` |
| `nextToken` | string | No | The token that is used for the next query. Valid values: Example: `FFmyTO70tTpLG6I3FmYAXGKPd****` |
| `priority` | number | No | The priority of the traffic mirror session. Valid values: **1** to **32766**. Example: `1` |
| `regionId` | string | Yes | The ID of the region to which the traffic mirror session belongs. You can call the [DescribeRegions] Example: `cn-hongkong` |
| `resourceGroupId` | string | No | The ID of the resource group to which the mirrored traffic belongs. Example: `rg-bp67acfmxazb4ph****` |
| `tags` | ListTrafficMirrorSessionsRequestTags[] | No | - |
| `trafficMirrorFilterId` | string | No | The ID of the traffic mirror filter. Example: `tmf-j6cmls82xnc86vtpe****` |
| `trafficMirrorSessionIds` | string[] | No | The IDs of the traffic mirror session. The maximum value of N is 100, which indicates that you can q Example: `tms-j6cla50buc44ap8tu****` |
| `trafficMirrorSessionName` | string | No | The name of the traffic mirror session. Example: `abc` |
| `trafficMirrorSourceId` | string | No | The ID of the traffic mirror source. You can specify only an elastic network interface (ENI) as the  Example: `eni-j6c8znm5l1yt4sox*****` |
| `trafficMirrorTargetId` | string | No | The ID of the traffic mirror destination. You can specify only an ENI or a Server Load Balancer (SLB Example: `eni-j6c2fp57q8rr47rp****` |
| `virtualNetworkId` | number | No | The VXLAN network identifier (VNI) that is used to distinguish different mirrored traffic. Valid val Example: `10` |


## getTrafficMirrorServiceStatus

**Signature:** `getTrafficMirrorServiceStatus(request: GetTrafficMirrorServiceStatusRequest)`

Queries the status of the traffic mirror feature..

**Parameters:** (0 required, 2 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `123e4567-e89b-12d3-a456-426655440000` |
| `regionId` | string | No | The ID of the region to which the mirrored traffic belongs. Example: `cn-hangzhou` |


## listTrafficMirrorFilters

**Signature:** `listTrafficMirrorFilters(request: ListTrafficMirrorFiltersRequest)`

Queries filters for traffic mirror..

**Parameters:** (1 required, 8 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The tag key. You can specify at most 20 tag keys. The tag key cannot be an empty string. Example: `FinanceDept` |
| `value` | string | No | The tag value. You can specify at most 20 tag values. The tag value can be an empty string. Example: `FinanceJoshua` |
| `maxResults` | number | No | The maximum number of entries to return. Example: `10` |
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. Valid value Example: `FFmyTO70tTpLG6I3FmYAXGKPd****` |
| `regionId` | string | Yes | The ID of the region to which the mirrored traffic belongs. Example: `cn-hongkong` |
| `resourceGroupId` | string | No | The ID of the resource group to which the mirrored traffic belongs. Example: `rg-bp67acfmxazb4ph****` |
| `tags` | ListTrafficMirrorFiltersRequestTags[] | No | - |
| `trafficMirrorFilterIds` | string[] | No | The ID of the traffic mirror filter. The maximum value of **N** is **100**, which specifies that you Example: `tmf-j6cmls82xnc86vtpe****` |
| `trafficMirrorFilterName` | string | No | The name of the filter. Example: `abc` |


## updateTrafficMirrorFilterAttribute

**Signature:** `updateTrafficMirrorFilterAttribute(request: UpdateTrafficMirrorFilterAttributeRequest)`

You cannot repeatedly call the **UpdateTrafficMirrorFilterAttribute** operation to modify the configuration of a filter for traffic mirror within the specified period of time..

**Parameters:** (2 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `0c593ea1-3bea-11e9-b96b-88e9fe637760` |
| `dryRun` | boolean | No | Specifies whether to check the request without performing the operation. Valid values: Example: `false` |
| `regionId` | string | Yes | The ID of the region to which the mirrored traffic belongs. Example: `cn-hongkong` |
| `trafficMirrorFilterDescription` | string | No | The description of the filter. Example: `This` |
| `trafficMirrorFilterId` | string | Yes | The ID of the filter. Example: `tmf-j6cmls82xnc86vtpe****` |
| `trafficMirrorFilterName` | string | No | The name of the filter. Example: `test` |


## updateTrafficMirrorFilterRuleAttribute

**Signature:** `updateTrafficMirrorFilterRuleAttribute(request: UpdateTrafficMirrorFilterRuleAttributeRequest)`

The **UpdateTrafficMirrorFilterRuleAttribute** operation is asynchronous. After you send the request, the system returns a request ID. However, the operation is still being performed in the system bac.

**Parameters:** (2 required, 9 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `0c593ea1-3bea-11e9-b96b-88e9fe637760` |
| `destinationCidrBlock` | string | No | The new destination CIDR block of the inbound or outbound traffic. Example: `10.0.0.0/24` |
| `destinationPortRange` | string | No | The new destination port range of the inbound or outbound traffic. Example: `-1/-1` |
| `dryRun` | boolean | No | Specifies whether to check the request without performing the operation. Valid values: Example: `false` |
| `priority` | number | No | The new priority of the inbound or outbound rule. A smaller value indicates a higher priority. Example: `1` |
| `protocol` | string | No | The new protocol that is used by the traffic to be mirrored by the inbound or outbound rule. Valid v Example: `ICMP` |
| `regionId` | string | Yes | The ID of the region to which the mirrored traffic belongs. Example: `cn-hongkong` |
| `ruleAction` | string | No | The new action of the inbound or outbound rule. Valid values: Example: `accept` |
| `sourceCidrBlock` | string | No | The new source CIDR block of the inbound or outbound traffic. Example: `0.0.0.0/0` |
| `sourcePortRange` | string | No | The new source port range of the inbound or outbound traffic. Example: `22/40` |
| `trafficMirrorFilterRuleId` | string | Yes | The ID of the inbound or outbound rule. Example: `tmr-j6c89rzmtd3hhdugq****` |


## updateTrafficMirrorSessionAttribute

**Signature:** `updateTrafficMirrorSessionAttribute(request: UpdateTrafficMirrorSessionAttributeRequest)`

## Usage notes *   **UpdateTrafficMirrorSessionAttribute** is an asynchronous operation. After a request is sent, the system returns a request ID and runs the task in the background. You can call the .

**Parameters:** (2 required, 11 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientToken` | string | No | The client token that is used to ensure the idempotence of the request. Example: `0c593ea1-3bea-11e9-b96b-88e9fe63****` |
| `dryRun` | boolean | No | Specifies whether to perform a dry run. Valid values: Example: `false` |
| `enabled` | boolean | No | Specifies whether to enable the traffic mirror session. Valid values: Example: `false` |
| `packetLength` | number | No | The maximum transmission unit (MTU). Example: `1500` |
| `priority` | number | No | The new priority of the traffic mirror session. Valid values: **1** to **32766**. Example: `2` |
| `regionId` | string | Yes | The region ID of the traffic mirror session. You can call the [DescribeRegions](https://help.aliyun. Example: `cn-hongkong` |
| `trafficMirrorFilterId` | string | No | The ID of the traffic mirror filter. Example: `tmf-j6cmls82xnc86vtpe****` |
| `trafficMirrorSessionDescription` | string | No | The new description of the traffic mirror session. Example: `This` |
| `trafficMirrorSessionId` | string | Yes | The ID of the traffic mirror session. Example: `tms-j6cla50buc44ap8tu****` |
| `trafficMirrorSessionName` | string | No | The new name of the traffic mirror session. Example: `abc` |
| `trafficMirrorTargetId` | string | No | The ID of the traffic mirror destination. Example: `eni-j6c2fp57q8rr47rp*****` |
| `trafficMirrorTargetType` | string | No | The new type of the traffic mirror destination. Valid values: Example: `NetworkInterface` |
| `virtualNetworkId` | number | No | The VXLAN network identifier (VNI) that is used to distinguish different mirrored traffic. Valid val Example: `10` |

