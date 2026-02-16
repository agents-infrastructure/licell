# Security Scanning

Image security scanning rules, tasks, and results.

## createRepoTagScanTask

Creates an image scan task.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `digest` | string | No | The digest of the image. Example: `sha256:815386ebbe9a3490f38785ab11bda34ec8dacf4634af77b8912832d4f85dca04` |
| `instanceId` | string | Yes | The ID of the Container Registry instance. Example: `cri-xkx6vujuhay0****` |
| `repoId` | string | Yes | The ID of the image repository. Example: `crr-xwvi3osiy4ff****` |
| `scanService` | string | No | The type of the scanning engine. Example: `ACR_SCAN_SERVICE` |
| `tag` | string | Yes | The image version. Example: `1.24` |

## getRepoTagScanStatus

Queries the scanning status of an image tag.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `digest` | string | No | The image digest. Example: `67bfbcc12b67936ec7f867927817cbb071832b873dbcaed312a1930ba5f1d529` |
| `instanceId` | string | Yes | The instance ID. Example: `cri-2j88dtld8yel****` |
| `repoId` | string | No | The ID of the image repository. Example: `crr-uf082u9dg8do****` |
| `scanTaskId` | string | No | The ID of the image scan task. Example: `838152F9-F725-5A52-A344-8972D65AC045` |
| `tag` | string | No | The image tag. Example: `1` |

## getRepoTagScanSummary

@param request - GetRepoTagScanSummaryRequest.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `digest` | string | No | The number of unknown-severity vulnerabilities. Example: `sha256:c9f370a4eb1c00d0b0d7212a0a9fa4a7697756c90f0f680afaf9737a25725f4c` |
| `instanceId` | string | Yes | The ID of the image repository. Example: `cri-2j88dtld8yel****` |
| `repoId` | string | No | The name of the image tag. Example: `crr-c2i5yk6h6pu9d5o8` |
| `scanTaskId` | string | No | The digest of the image. Example: `47A3E5A3-6AD4-5F02-93B8-59F778AE25D4` |
| `tag` | string | No | The ID of the security scan task. Example: `1` |

## listRepoTagScanResult

Queries the results of a security scan that is created for an image tag.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `digest` | string | No | The digest of the image. Example: `sha256:6b0b094f8a904f8fb6602427aed0d1fa` |
| `filterValue` | string | No | The parameter whose value that you want to query. Fox example, if the value is `FixCmd`, only the `F Example: `FixCmd` |
| `instanceId` | string | Yes | The ID of the instance. Example: `cri-2j88dtld8yel****` |
| `pageNo` | number | No | The number of the page to return. Example: `1` |
| `pageSize` | number | No | The number of entries to return on each page. Example: `30` |
| `repoId` | string | No | The ID of the image repository. Example: `crr-uf082u9dg8do****` |
| `scanTaskId` | string | No | The ID of the security scan task. Example: `6b0b094f-8a90-4f8f-b660-2427aed0****` |
| `scanType` | string | No | The type of the vulnerability. Valid values: Example: `sca` |
| `severity` | string | No | The severity of the vulnerability. Valid values: Example: `High` |
| `tag` | string | No | The name of the image tag. Example: `1` |
| `vulQueryKey` | string | No | The keyword for fuzzy search used in scanning. The value can be a CVE name. Example: `CVE-2021` |

## createScanRule

Creates a scan or content analysis rule.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The instance ID Example: `cri-dqwc**********` |
| `namespaces` | string[] | No | The list of namespaces. |
| `repoNames` | string[] | No | The list of repositories. |
| `repoTagFilterPattern` | string | Yes | The tag that triggers the scan matches the regular expression Example: `.*` |
| `ruleName` | string | Yes | The rule name Example: `default` |
| `scanScope` | string | Yes | The scan scope Example: `NAMESPACE` |
| `scanType` | string | No | The scan type. Valid values: Example: `VUL` |
| `triggerType` | string | Yes | Trigger type Example: `AUTO` |

## deleteScanRule

Deletes a scan rule.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | No | The instance ID Example: `cri-kmsiwlxxdcva****` |
| `scanRuleId` | string | No | The rule ID Example: `crscnr-aemytkwad2h7fyhb` |

## getScanRule

Obtains a scan rule.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The instance ID. Example: `cri-xkx6vujuhay0****` |
| `scanRuleId` | string | Yes | The scan rule ID. Example: `crscnr-2sdveqjhpzdcafyq` |

## listScanRule

Lists the scan rules.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | No | The instance ID. Example: `cri-upoulewerx*****` |
| `pageNo` | number | No | The page number. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Example: `30` |
| `scanType` | string | No | The type of the vulnerability. Valid values: Example: `SBOM` |

## updateScanRule

Updates a scan rule.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | Yes | The instance ID. Example: `cri-4abntrj42twd****` |
| `namespaces` | string[] | No | The list of namespaces. |
| `repoNames` | string[] | No | The list of repositories. |
| `repoTagFilterPattern` | string | Yes | The tag filtering rules. Example: `prod-.*` |
| `ruleName` | string | Yes | The rule name. Example: `scan-test` |
| `scanRuleId` | string | Yes | The rule ID. Example: `crscnr-3qmkeiuggfpjkfrq` |
| `scanScope` | string | Yes | The scan scope. Example: `REPO` |
| `triggerType` | string | Yes | The trigger type. Example: `AUTO` |

## listScanBaselineByTask

Queries the baseline risks of a scan task by page.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `digest` | string | No | The digest value of the image. Example: `sha256:1c89806cfaf66d2990e2cf1131ebd56ff24b133745a33abf1228*************` |
| `instanceId` | string | No | The ID of the Container Registry instance. Example: `cri-***********` |
| `level` | string | No | The level of the baseline risk. Example: `High` |
| `pageNo` | number | No | The page number. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Example: `30` |
| `repoId` | string | No | The ID of the image repository. Example: `crr-**************` |
| `scanTaskId` | string | No | The ID of the image scan task. Example: `3e526d7e-4b45-4703-b046-***********` |
| `tag` | string | No | The image version. Example: `1.1.36` |

## listScanMaliciousFileByTask

Queries the malicious files of a scan task by page.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `digest` | string | No | The image digest. Example: `sha256:aa4bffff6406785e930dab1f94c9a1297ba22xxxx71d71504a015764*********` |
| `instanceId` | string | No | The instance ID. Example: `cri-gu94qynvpwk*****` |
| `level` | string | No | The severity of the malicious file. Example: `High` |
| `pageNo` | number | No | The page number. Example: `1` |
| `pageSize` | number | No | The number of entries per page. Maximum value: 100. If you specify a value greater than 100 for this Example: `30` |
| `repoId` | string | No | The image repository ID. Example: `crr-h1y4l279wb8*****` |
| `scanTaskId` | string | No | The ID of the image scan task. Example: `79ee6bc2-3288-4c56-b967-**********` |
| `tag` | string | No | The image tag. Example: `V6.11` |

