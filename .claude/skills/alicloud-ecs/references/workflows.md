# Common Workflows

## Workflow 1: Create and Launch an ECS Instance

```
Step 1: describeRegions → choose region
Step 2: describeInstanceTypes → choose instance type
Step 3: describeImages → choose image
Step 4: createSecurityGroup + authorizeSecurityGroup → set up network rules
Step 5: runInstances → create and start instance
Step 6: describeInstances → verify running
```

```typescript
import * as models from '@alicloud/ecs20140526/dist/models';

// Create security group
const { body: sg } = await client.createSecurityGroup(new models.CreateSecurityGroupRequest({
  regionId: 'cn-hangzhou',
  securityGroupName: 'my-sg',
  vpcId: 'vpc-xxx',
}));

// Allow SSH
await client.authorizeSecurityGroup(new models.AuthorizeSecurityGroupRequest({
  regionId: 'cn-hangzhou',
  securityGroupId: sg.securityGroupId,
  ipProtocol: 'tcp',
  portRange: '22/22',
  sourceCidrIp: '0.0.0.0/0',
}));

// Launch instance
const { body: result } = await client.runInstances(new models.RunInstancesRequest({
  regionId: 'cn-hangzhou',
  imageId: 'ubuntu_22_04_x64_20G_alibase_20240101.vhd',
  instanceType: 'ecs.g7.large',
  securityGroupId: sg.securityGroupId,
  vSwitchId: 'vsw-xxx',
  instanceName: 'my-server',
  internetMaxBandwidthOut: 5,
  systemDisk: { category: 'cloud_essd', size: '40' },
  amount: 1,
}));
console.log('Instance IDs:', result.instanceIdSets?.instanceIdSet);
```

## Workflow 2: Disk Management (Create, Attach, Snapshot)

```
Step 1: createDisk → create data disk
Step 2: attachDisk → attach to instance
Step 3: createSnapshot → create backup
Step 4: createAutoSnapshotPolicy → set up auto backup
Step 5: applyAutoSnapshotPolicy → apply to disk
```

```typescript
// Create disk
const { body: disk } = await client.createDisk(new models.CreateDiskRequest({
  regionId: 'cn-hangzhou',
  zoneId: 'cn-hangzhou-h',
  diskCategory: 'cloud_essd',
  size: 100,
  diskName: 'data-disk',
}));

// Attach to instance
await client.attachDisk(new models.AttachDiskRequest({
  instanceId: 'i-xxx',
  diskId: disk.diskId,
}));

// Create snapshot
await client.createSnapshot(new models.CreateSnapshotRequest({
  diskId: disk.diskId,
  snapshotName: 'backup-snapshot',
}));

// Auto snapshot policy
const { body: policy } = await client.createAutoSnapshotPolicy(
  new models.CreateAutoSnapshotPolicyRequest({
    regionId: 'cn-hangzhou',
    autoSnapshotPolicyName: 'daily-backup',
    timePoints: '["0"]',
    repeatWeekdays: '["1","2","3","4","5","6","7"]',
    retentionDays: 7,
  })
);

await client.applyAutoSnapshotPolicy(new models.ApplyAutoSnapshotPolicyRequest({
  regionId: 'cn-hangzhou',
  autoSnapshotPolicyId: policy.autoSnapshotPolicyId,
  diskIds: JSON.stringify([disk.diskId]),
}));
```

## Workflow 3: Image Creation and Cross-Region Copy

```
Step 1: createImage → create custom image from instance
Step 2: copyImage → copy to another region
Step 3: describeImages → verify in target region
```

```typescript
// Create image from instance
const { body: image } = await client.createImage(new models.CreateImageRequest({
  regionId: 'cn-hangzhou',
  instanceId: 'i-xxx',
  imageName: 'my-app-image',
  description: 'Application server image',
}));

// Copy to Beijing
const { body: copied } = await client.copyImage(new models.CopyImageRequest({
  regionId: 'cn-hangzhou',
  imageId: image.imageId,
  destinationRegionId: 'cn-beijing',
  destinationImageName: 'my-app-image-copy',
}));
```

## Workflow 4: Security Group Rule Management

```
Step 1: createSecurityGroup → create group
Step 2: authorizeSecurityGroup → add inbound rules
Step 3: authorizeSecurityGroupEgress → add outbound rules
Step 4: describeSecurityGroupAttribute → verify rules
```

```typescript
// Allow HTTP/HTTPS inbound
await client.authorizeSecurityGroup(new models.AuthorizeSecurityGroupRequest({
  regionId: 'cn-hangzhou',
  securityGroupId: 'sg-xxx',
  ipProtocol: 'tcp',
  portRange: '80/80',
  sourceCidrIp: '0.0.0.0/0',
}));

await client.authorizeSecurityGroup(new models.AuthorizeSecurityGroupRequest({
  regionId: 'cn-hangzhou',
  securityGroupId: 'sg-xxx',
  ipProtocol: 'tcp',
  portRange: '443/443',
  sourceCidrIp: '0.0.0.0/0',
}));
```

## Workflow 5: Instance Scaling (Modify Spec)

```
Step 1: stopInstance → stop the instance
Step 2: modifyInstanceSpec (PostPaid) or modifyPrepayInstanceSpec (PrePaid)
Step 3: startInstance → restart
Step 4: describeInstances → verify new spec
```

```typescript
// Stop instance
await client.stopInstance(new models.StopInstanceRequest({ instanceId: 'i-xxx' }));

// Wait for stopped status...

// Upgrade spec (pay-as-you-go)
await client.modifyInstanceSpec(new models.ModifyInstanceSpecRequest({
  instanceId: 'i-xxx',
  instanceType: 'ecs.g7.xlarge',
}));

// Start instance
await client.startInstance(new models.StartInstanceRequest({ instanceId: 'i-xxx' }));
```

## Workflow 6: Cloud Assistant Remote Command

```
Step 1: describeCloudAssistantStatus → check agent status
Step 2: runCommand → run command on instances
Step 3: describeInvocationResults → get output
```

```typescript
// Run shell command on instance
const { body: invocation } = await client.runCommand(new models.RunCommandRequest({
  regionId: 'cn-hangzhou',
  type: 'RunShellScript',
  commandContent: 'df -h && free -m',
  instanceId: ['i-xxx'],
  timeout: 60,
}));

// Check results (after waiting)
const { body: results } = await client.describeInvocationResults(
  new models.DescribeInvocationResultsRequest({
    regionId: 'cn-hangzhou',
    invokeId: invocation.invokeId,
  })
);
```

## Workflow 7: Network Interface (ENI) Management

```
Step 1: createNetworkInterface → create ENI
Step 2: attachNetworkInterface → attach to instance
Step 3: assignPrivateIpAddresses → add secondary IPs
Step 4: describeNetworkInterfaces → verify
```

```typescript
// Create ENI
const { body: eni } = await client.createNetworkInterface(
  new models.CreateNetworkInterfaceRequest({
    regionId: 'cn-hangzhou',
    vSwitchId: 'vsw-xxx',
    securityGroupIds: ['sg-xxx'],
    networkInterfaceName: 'my-eni',
  })
);

// Attach to instance
await client.attachNetworkInterface(new models.AttachNetworkInterfaceRequest({
  regionId: 'cn-hangzhou',
  networkInterfaceId: eni.networkInterfaceId,
  instanceId: 'i-xxx',
}));
```

## Workflow 8: Key Pair and Secure Login

```
Step 1: createKeyPair → create SSH key pair
Step 2: runInstances (with keyPairName) → launch with key
Step 3: attachKeyPair → or attach to existing instance
```

```typescript
// Create key pair
const { body: kp } = await client.createKeyPair(new models.CreateKeyPairRequest({
  regionId: 'cn-hangzhou',
  keyPairName: 'my-key',
}));
console.log('Private Key:', kp.privateKeyBody); // Save this!

// Launch instance with key pair
await client.runInstances(new models.RunInstancesRequest({
  regionId: 'cn-hangzhou',
  imageId: 'ubuntu_22_04_x64_20G_alibase_20240101.vhd',
  instanceType: 'ecs.g7.large',
  securityGroupId: 'sg-xxx',
  vSwitchId: 'vsw-xxx',
  keyPairName: 'my-key',
  amount: 1,
}));
```

## Workflow 9: Dedicated Host Allocation

```
Step 1: describeDedicatedHostTypes → choose host type
Step 2: allocateDedicatedHosts → allocate host
Step 3: runInstances (with dedicatedHostId) → launch on host
```

```typescript
const { body: host } = await client.allocateDedicatedHosts(
  new models.AllocateDedicatedHostsRequest({
    regionId: 'cn-hangzhou',
    dedicatedHostType: 'ddh.g7',
    quantity: 1,
  })
);
```

## Workflow 10: Tag-Based Resource Management

```
Step 1: tagResources → tag instances/disks
Step 2: describeInstances (with tag filter) → query by tag
Step 3: untagResources → remove tags
```

```typescript
// Tag instances
await client.tagResources(new models.TagResourcesRequest({
  regionId: 'cn-hangzhou',
  resourceType: 'instance',
  resourceId: ['i-xxx1', 'i-xxx2'],
  tag: [
    { key: 'env', value: 'production' },
    { key: 'team', value: 'backend' },
  ],
}));

// Query by tag
const { body } = await client.describeInstances(new models.DescribeInstancesRequest({
  regionId: 'cn-hangzhou',
  tag: [{ key: 'env', value: 'production' }],
}));
```
