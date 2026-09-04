import type { GeneratedCapability } from '../../utils/alicloud-capability-generator';

export interface AlicloudCapabilityOverlay {
  product: string;
  operation: string;
  commandKeys: string[];
  confidence: 'curated';
  notes: string[];
}

// This registry is intentionally small and reviewed by hand. It describes
// exact operation coverage; heuristic command matching remains the fallback
// for capabilities that have not been promoted into a curated surface.
const OVERLAYS: AlicloudCapabilityOverlay[] = [
  {
    product: 'vpc',
    operation: 'DescribeVpcs',
    commandKeys: ['vpc list', 'vpc info', 'vpc topology'],
    confidence: 'curated',
    notes: ['vpc list and info project VPC inventory; vpc topology adds related core network resources.']
  },
  {
    product: 'vpc',
    operation: 'DescribeVSwitches',
    commandKeys: ['vpc topology'],
    confidence: 'curated',
    notes: ['vpc topology inventories VSwitches for the selected VPC.']
  },
  {
    product: 'vpc',
    operation: 'DescribeRouteTables',
    commandKeys: ['vpc topology'],
    confidence: 'curated',
    notes: ['vpc topology inventories route tables for the selected VPC router.']
  },
  {
    product: 'vpc',
    operation: 'DescribeNatGateways',
    commandKeys: ['vpc topology'],
    confidence: 'curated',
    notes: ['vpc topology inventories NAT gateways for the selected VPC.']
  },
  {
    product: 'vpc',
    operation: 'DescribeEipAddresses',
    commandKeys: ['vpc topology'],
    confidence: 'curated',
    notes: ['vpc topology filters EIPs associated with the selected VPC or its NAT gateways.']
  },
  {
    product: 'cs',
    operation: 'DescribeClusters',
    commandKeys: ['k8s clusters'],
    confidence: 'curated',
    notes: ['k8s clusters lists ACK and ACS clusters through the CS read API.']
  },
  {
    product: 'cs',
    operation: 'DescribeClustersV1',
    commandKeys: ['k8s clusters'],
    confidence: 'curated',
    notes: ['k8s clusters provides the curated cluster inventory surface.']
  },
  {
    product: 'cs',
    operation: 'DescribeClusterUserKubeconfig',
    commandKeys: ['k8s workloads'],
    confidence: 'curated',
    notes: ['k8s workloads consumes a 15-minute KubeConfig internally and never returns the credential.']
  },
  {
    product: 'ecs',
    operation: 'DescribeInstances',
    commandKeys: ['ecs list', 'ecs info'],
    confidence: 'curated',
    notes: ['ecs list maps filters to DescribeInstances.', 'ecs info projects a single instance summary.']
  },
  {
    product: 'fc',
    operation: 'ListFunctions',
    commandKeys: ['fn list'],
    confidence: 'curated',
    notes: ['fn list reads the FC function inventory.']
  },
  {
    product: 'fc-open',
    operation: 'ListFunctions',
    commandKeys: ['fn list'],
    confidence: 'curated',
    notes: ['fn list reads the FC function inventory.']
  },
  {
    product: 'rds',
    operation: 'DescribeDBInstances',
    commandKeys: ['db list', 'db info'],
    confidence: 'curated',
    notes: ['db list and db info use the RDS instance query provider.']
  },
  {
    product: 'r-kvstore',
    operation: 'DescribeInstances',
    commandKeys: ['cache list', 'cache info'],
    confidence: 'curated',
    notes: ['cache list and cache info use the Redis/Tair query provider.']
  }
];

export function findAlicloudCapabilityOverlay(capability: Pick<GeneratedCapability, 'operation'> & {
  product: GeneratedCapability['product'] | { directory: string };
}) {
  const product = typeof capability.product === 'string'
    ? capability.product.toLowerCase()
    : capability.product.directory.toLowerCase();
  const operation = capability.operation.toLowerCase();
  return OVERLAYS.find((overlay) => overlay.product === product && overlay.operation.toLowerCase() === operation);
}

export function listAlicloudCapabilityOverlays() {
  return OVERLAYS.map((overlay) => ({ ...overlay, commandKeys: [...overlay.commandKeys], notes: [...overlay.notes] }));
}
