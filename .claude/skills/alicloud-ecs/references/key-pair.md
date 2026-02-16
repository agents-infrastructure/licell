# SSH Key Pair

SSH key pair management for instance login.

## createKeyPair

**Signature:** `createKeyPair(request: CreateKeyPairRequest)`

In addition to calling the CreateKeyPair operation to create a key pair, you can use a third-party tool to create a key pair and then call the [ImportKeyPair](https://help.aliyun.com/document_detail/5.

**Parameters:** (2 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of tag N to add to the key pair. Valid values of N: 1 to 20. The tag key cannot be an empty  Example: `TestKey` |
| `value` | string | No | The value of tag N to add to the key pair. Valid values of N: 1 to 20. The tag value can be an empty Example: `TestValue` |
| `keyPairName` | string | Yes | The name of the key pair. The name must be 2 to 128 characters in length. The name must start with a Example: `testKeyPairName` |
| `regionId` | string | Yes | The ID of the region in which to create the key pair. You can call the [DescribeRegions](https://hel Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group to which to add the key pair. Example: `rg-bp67acfmxazb4p****` |
| `tag` | CreateKeyPairRequestTag[] | No | - |

## deleteKeyPairs

**Signature:** `deleteKeyPairs(request: DeleteKeyPairsRequest)`

When you call this operation, take note of the following items: *   After an SSH key pair is deleted, you cannot query the SSH key pair by calling the [DescribeKeyPairs](https://help.aliyun.com/docume.

**Parameters:** (2 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `keyPairNames` | string | Yes | The names of SSH key pairs. The value can be a JSON array that consists of up to 100 SSH key pair na Example: `["skp-bp67acfmxazb41****",` |
| `regionId` | string | Yes | The ID of the region. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/256 Example: `cn-hangzhou` |

## describeKeyPairs

**Signature:** `describeKeyPairs(request: DescribeKeyPairsRequest)`

Queries one or more key pairs..

**Parameters:** (1 required, 9 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of tag N of the key pair. Valid values of N: 1 to 20. Example: `TestKey` |
| `value` | string | No | The value of tag N of the key pair. Valid values of N: 1 to 20. Example: `TestValue` |
| `includePublicKey` | boolean | No | Specifies whether to include PublicKey in the response. Default value: false. Example: `false` |
| `keyPairFingerPrint` | string | No | The fingerprint of the key pair. The message-digest algorithm 5 (MD5) is used based on the public ke Example: `ABC1234567` |
| `keyPairName` | string | No | The name of the key pair. You can use the asterisk (\\*) symbol as a wildcard in regular expressions Example: `*SshKey*` |
| `pageNumber` | number | No | The number of the page to return. Pages start from page 1. Example: `1` |
| `pageSize` | number | No | The number of entries to return on each page. Maximum value: 50. Example: `10` |
| `regionId` | string | Yes | The region ID of the key pair. You can call the [DescribeRegions](https://help.aliyun.com/document_d Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the resource group. If this parameter is specified to query resources, up to 1,000 resourc Example: `rg-amnhr7u7c7hj****` |
| `tag` | DescribeKeyPairsRequestTag[] | No | - |

## importKeyPair

**Signature:** `importKeyPair(request: ImportKeyPairRequest)`

Take note of the following items: *   A maximum of 500 key pairs can be created in each region. *   The key pair to be imported must support one of the following encryption methods: *   rsa *   dsa * .

**Parameters:** (3 required, 4 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | The key of tag N to add to the key pair. Valid values of N: 1 to 20. The tag key cannot be an empty  Example: `TestKey` |
| `value` | string | No | The value of tag N to add to the key pair. Valid values of N: 1 to 20. The tag value can be an empty Example: `TestValue` |
| `keyPairName` | string | Yes | The name of the key pair. The name must be unique. It must be 2 to 128 characters in length. It must Example: `testKeyPairName` |
| `publicKeyBody` | string | Yes | The public key of the key pair. Example: `ABC1234567` |
| `regionId` | string | Yes | The region ID. You can call the [DescribeRegions](https://help.aliyun.com/document_detail/25609.html Example: `cn-hangzhou` |
| `resourceGroupId` | string | No | The ID of the enterprise resource group to which the SSH key pair belongs. Example: `rg-bp67acfmxazb4p****` |
| `tag` | ImportKeyPairRequestTag[] | No | - |

## attachKeyPair

**Signature:** `attachKeyPair(request: AttachKeyPairRequest)`

Take note of the following items: *   SSH key pairs are not supported on Windows instances. *   If an SSH key pair is bound to an instance, authentication by using the username and password is disable.

**Parameters:** (3 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceIds` | string | Yes | The IDs of instances to which you want to bind the SSH key pair. The value can be a JSON array that  Example: `["i-bp1gtjxuuvwj17zr****",` |
| `keyPairName` | string | Yes | The name of the SSH key pair. Example: `testKeyPairName` |
| `regionId` | string | Yes | The region ID of the SSH key pair. You can call the [DescribeRegions](https://help.aliyun.com/docume Example: `cn-hangzhou` |

## detachKeyPair

**Signature:** `detachKeyPair(request: DetachKeyPairRequest)`

When you call this operation, take note of the following items: *   After you unbind an SSH key pair from an instance, you must call the [RebootInstance](https://help.aliyun.com/document_detail/25502..

**Parameters:** (3 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceIds` | string | Yes | The IDs of instances from which you want to unbind the SSH key pair. The value can be a JSON array t Example: `["i-bp1d6tsvznfghy7y****",` |
| `keyPairName` | string | Yes | The name of the SSH key pair. Example: `testKeyPairName` |
| `regionId` | string | Yes | The region ID of the SSH key pair. You can call the [DescribeRegions](https://help.aliyun.com/docume Example: `cn-hangzhou` |

