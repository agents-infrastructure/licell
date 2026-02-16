# Layer Management

Layer version management and ACL control.

## createLayerVersion

**Signature:** `createLayerVersion(layerName: string, request: CreateLayerVersionRequest)`

创建层版本。.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `layerName` | string | Yes | Path parameter: layerName |
| `body.code` | InputCodeLocation | No | - |
| `body.description` | string | No | - Example: `my` |
| `body.license` | string | No | - Example: `Apache` |

## deleteLayerVersion

**Signature:** `deleteLayerVersion(layerName: string, version: string)`

Deletes a layer version..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `layerName` | string | Yes | Path parameter: layerName |
| `version` | string | Yes | Path parameter: version |

## getLayerVersion

**Signature:** `getLayerVersion(layerName: string, version: string)`

Queries versions of a layer..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `layerName` | string | Yes | Path parameter: layerName |
| `version` | string | Yes | Path parameter: version |

## getLayerVersionByArn

**Signature:** `getLayerVersionByArn(arn: string)`

Obtain version information of a layer by using ARNs..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `arn` | string | Yes | Path parameter: arn |

## listLayerVersions

**Signature:** `listLayerVersions(layerName: string, request: ListLayerVersionsRequest)`

Gets a list of layer versions..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `layerName` | string | Yes | Path parameter: layerName |
| `limit` | number | No | The number of versions to be returned. Example: `10` |
| `startVersion` | string | No | The initial version of the layer. Example: `1` |

## listLayers

**Signature:** `listLayers(request: ListLayersRequest)`

Gets a list of layers..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | number | No | The number of layers that are returned Example: `10` |
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. Example: `MTIzNCNhYmM=` |
| `official` | string | No | Specifies whether the layer is official. Valid values: true and false. Example: `true` |
| `prefix` | string | No | The name prefix of the layer. Example: `my-layer` |
| `public` | string | No | Specifies whether the layer is public. Valid values: true and false. Example: `true` |

## putLayerACL

**Signature:** `putLayerACL(layerName: string, request: PutLayerACLRequest)`

Modifies permissions of a layer..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `layerName` | string | Yes | Path parameter: layerName |

