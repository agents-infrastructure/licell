# VPC Binding

VPC binding management for function network access.

## createVpcBinding

**Signature:** `createVpcBinding(functionName: string, request: CreateVpcBindingRequest)`

Creates a VPC connection..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | Yes | Path parameter: functionName |
| `body.vpcId` | string | Yes | This parameter is required. Example: `vpc-8vb8x8dggvr0axxxxxxxx` |

## deleteVpcBinding

**Signature:** `deleteVpcBinding(functionName: string, vpcId: string)`

Deletes an access control policy from a specified policy group for a VPC firewall..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | Yes | Path parameter: functionName |
| `vpcId` | string | Yes | Path parameter: vpcId |

## listVpcBindings

**Signature:** `listVpcBindings(functionName: string)`

Queries a list of existing VPC connections..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `functionName` | string | Yes | Path parameter: functionName |

