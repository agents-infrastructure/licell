# Common Workflows

## Workflow 1: Create VPC with VSwitches and Security

```
Step 1: createVpc → create VPC
Step 2: createVSwitch → create VSwitch in each zone
Step 3: createNetworkAcl → create network ACL
Step 4: associateNetworkAcl → bind ACL to VSwitch
```

```typescript
import * as models from '@alicloud/vpc20160428/dist/models';

// Create VPC
const { body: vpc } = await client.createVpc(new models.CreateVpcRequest({
  regionId: 'cn-hangzhou',
  cidrBlock: '10.0.0.0/8',
  vpcName: 'production-vpc',
  description: 'Production VPC',
}));
const vpcId = vpc.vpcId!;

// Wait for VPC to be available
await new Promise(r => setTimeout(r, 5000));

// Create VSwitches in different zones
const { body: vsw1 } = await client.createVSwitch(new models.CreateVSwitchRequest({
  vpcId,
  zoneId: 'cn-hangzhou-h',
  cidrBlock: '10.0.1.0/24',
  vSwitchName: 'web-subnet',
}));

const { body: vsw2 } = await client.createVSwitch(new models.CreateVSwitchRequest({
  vpcId,
  zoneId: 'cn-hangzhou-i',
  cidrBlock: '10.0.2.0/24',
  vSwitchName: 'app-subnet',
}));
```

## Workflow 2: Configure NAT Gateway for Internet Access

```
Step 1: createNatGateway → create NAT gateway
Step 2: allocateEipAddress → allocate EIP
Step 3: associateEipAddress → bind EIP to NAT gateway
Step 4: createSnatEntry → create SNAT rule for outbound
Step 5: createForwardEntry → create DNAT rule for inbound
```

```typescript
// Create NAT Gateway
const { body: nat } = await client.createNatGateway(new models.CreateNatGatewayRequest({
  regionId: 'cn-hangzhou',
  vpcId,
  vSwitchId: vsw1.vSwitchId!,
  natGatewayName: 'prod-nat',
  natType: 'Enhanced',
}));

// Allocate EIP
const { body: eip } = await client.allocateEipAddress(new models.AllocateEipAddressRequest({
  regionId: 'cn-hangzhou',
  bandwidth: '100',
  internetChargeType: 'PayByTraffic',
}));

// Bind EIP to NAT Gateway
await client.associateEipAddress(new models.AssociateEipAddressRequest({
  regionId: 'cn-hangzhou',
  allocationId: eip.allocationId!,
  instanceId: nat.natGatewayId!,
  instanceType: 'Nat',
}));

// Create SNAT entry for outbound internet
await client.createSnatEntry(new models.CreateSnatEntryRequest({
  regionId: 'cn-hangzhou',
  snatTableId: nat.snatTableIds?.snatTableId?.[0]!,
  sourceCIDR: '10.0.0.0/8',
  snatIp: eip.eipAddress!,
  snatEntryName: 'outbound-all',
}));
```

## Workflow 3: VPN Gateway for Site-to-Site Connection

```
Step 1: createVpnGateway → create VPN gateway
Step 2: createCustomerGateway → register on-premises gateway
Step 3: createVpnConnection → create IPsec tunnel
Step 4: createVpnRouteEntry → add VPN route
Step 5: downloadVpnConnectionConfig → get config for on-premises
```

```typescript
// Create VPN Gateway
const { body: vpn } = await client.createVpnGateway(new models.CreateVpnGatewayRequest({
  regionId: 'cn-hangzhou',
  vpcId,
  bandwidth: 100,
  vSwitchId: vsw1.vSwitchId!,
  vpnType: 'Normal',
}));

// Create Customer Gateway
const { body: cgw } = await client.createCustomerGateway(new models.CreateCustomerGatewayRequest({
  regionId: 'cn-hangzhou',
  ipAddress: '203.0.113.1',
  name: 'office-gateway',
}));

// Create IPsec VPN Connection
const { body: conn } = await client.createVpnConnection(new models.CreateVpnConnectionRequest({
  regionId: 'cn-hangzhou',
  vpnGatewayId: vpn.vpnGatewayId!,
  customerGatewayId: cgw.customerGatewayId!,
  localSubnet: '10.0.0.0/8',
  remoteSubnet: '192.168.0.0/16',
  name: 'office-tunnel',
}));
```

## Workflow 4: VPC Peering Connection

```
Step 1: createVpcPeerConnection → create peering
Step 2: acceptVpcPeerConnection → accept (if cross-account)
Step 3: createRouteEntry → add routes in both VPCs
```

```typescript
// Create VPC Peering
const { body: peer } = await client.createVpcPeerConnection(new models.CreateVpcPeerConnectionRequest({
  regionId: 'cn-hangzhou',
  vpcId: 'vpc-source-xxx',
  acceptingAliUid: 1234567890,
  acceptingRegionId: 'cn-shanghai',
  acceptingVpcId: 'vpc-target-xxx',
  name: 'prod-to-staging',
}));

// Add route to peer VPC
await client.createRouteEntry(new models.CreateRouteEntryRequest({
  routeTableId: 'rtb-source-xxx',
  destinationCidrBlock: '172.16.0.0/12',
  nextHopType: 'VpcPeer',
  nextHopId: peer.instanceId!,
}));
```

## Workflow 5: Express Connect Physical Connection

```
Step 1: createPhysicalConnection → apply for physical connection
Step 2: createVirtualBorderRouter → create VBR
Step 3: createBgpGroup → create BGP group
Step 4: createBgpPeer → create BGP peer
Step 5: addBgpNetwork → advertise routes
```

```typescript
// Create VBR
const { body: vbr } = await client.createVirtualBorderRouter(new models.CreateVirtualBorderRouterRequest({
  regionId: 'cn-hangzhou',
  physicalConnectionId: 'pc-xxx',
  vlanId: 100,
  localGatewayIp: '10.0.0.1',
  peerGatewayIp: '10.0.0.2',
  peeringSubnetMask: '255.255.255.252',
}));

// Create BGP Group
const { body: bgpGroup } = await client.createBgpGroup(new models.CreateBgpGroupRequest({
  regionId: 'cn-hangzhou',
  routerId: vbr.vbrId!,
  peerAsn: 65001,
  name: 'idc-bgp',
}));
```

## Workflow 6: Flow Log for Traffic Analysis

```
Step 1: createFlowLog → create flow log
Step 2: activeFlowLog → activate flow log
Step 3: describeFlowLogs → check status
```

```typescript
// Create Flow Log
const { body: fl } = await client.createFlowLog(new models.CreateFlowLogRequest({
  regionId: 'cn-hangzhou',
  flowLogName: 'vpc-traffic-log',
  resourceType: 'VPC',
  resourceId: vpcId,
  trafficType: 'All',
  projectName: 'vpc-flowlog',
  logStoreName: 'flowlog-store',
}));

// Activate
await client.activeFlowLog(new models.ActiveFlowLogRequest({
  regionId: 'cn-hangzhou',
  flowLogId: fl.flowLogId!,
}));
```

## Workflow 7: Traffic Mirroring for Packet Inspection

```
Step 1: createTrafficMirrorFilter → create filter rules
Step 2: createTrafficMirrorFilterRules → add ingress/egress rules
Step 3: createTrafficMirrorSession → create mirror session
Step 4: addSourcesToTrafficMirrorSession → add ENI sources
```

```typescript
// Create filter
const { body: filter } = await client.createTrafficMirrorFilter(new models.CreateTrafficMirrorFilterRequest({
  regionId: 'cn-hangzhou',
  trafficMirrorFilterName: 'http-filter',
}));

// Create session
await client.createTrafficMirrorSession(new models.CreateTrafficMirrorSessionRequest({
  regionId: 'cn-hangzhou',
  trafficMirrorTargetId: 'eni-target-xxx',
  trafficMirrorTargetType: 'NetworkInterface',
  trafficMirrorFilterId: filter.trafficMirrorFilterId!,
  trafficMirrorSessionName: 'http-mirror',
  priority: 1,
}));
```

## Workflow 8: EIP and Bandwidth Management

```
Step 1: allocateEipAddress → allocate EIP
Step 2: associateEipAddress → bind to ECS/SLB/NAT
Step 3: createCommonBandwidthPackage → create shared bandwidth
Step 4: addCommonBandwidthPackageIp → add EIP to shared bandwidth
```

```typescript
// Allocate EIP
const { body: eip } = await client.allocateEipAddress(new models.AllocateEipAddressRequest({
  regionId: 'cn-hangzhou',
  bandwidth: '200',
  internetChargeType: 'PayByTraffic',
  instanceChargeType: 'PostPaid',
}));

// Create shared bandwidth package
const { body: bwp } = await client.createCommonBandwidthPackage(
  new models.CreateCommonBandwidthPackageRequest({
    regionId: 'cn-hangzhou',
    bandwidth: 1000,
    internetChargeType: 'PayByBandwidth',
    name: 'shared-bw',
  })
);

// Add EIP to shared bandwidth
await client.addCommonBandwidthPackageIp(new models.AddCommonBandwidthPackageIpRequest({
  regionId: 'cn-hangzhou',
  bandwidthPackageId: bwp.bandwidthPackageId!,
  ipInstanceId: eip.allocationId!,
}));
```
