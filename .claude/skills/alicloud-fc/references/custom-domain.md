# Custom Domain

Custom domain name management for HTTP function endpoints.

## createCustomDomain

**Signature:** `createCustomDomain(request: CreateCustomDomainRequest)`

If you want to use a fixed domain name to access an application or function in a production environment of Function Compute, or to resolve the issue of forced downloads when accessing an HTTP trigger, you can bind a custom domain name to the application or function..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `body.authConfig` | AuthConfig | No | - |
| `body.domainName` | string | Yes | This parameter is required. Example: `example.com` |
| `body.protocol` | string | No | - Example: `HTTP` |

## deleteCustomDomain

**Signature:** `deleteCustomDomain(domainName: string)`

Deletes a custom domain name..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | Path parameter: domainName |

## getCustomDomain

**Signature:** `getCustomDomain(domainName: string)`

Queries information about a custom domain name..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | Path parameter: domainName |

## listCustomDomains

**Signature:** `listCustomDomains(request: ListCustomDomainsRequest)`

Queries custom domain names..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | number | No | The number of custom domain names returned. Example: `10` |
| `nextToken` | string | No | The pagination token that is used in the next request to retrieve a new page of results. Example: `MTIzNCNhYmM=` |
| `prefix` | string | No | The domain name prefix. Example: `foo` |

## updateCustomDomain

**Signature:** `updateCustomDomain(domainName: string, request: UpdateCustomDomainRequest)`

Update a custom domain name..

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | Path parameter: domainName |
| `body.authConfig` | AuthConfig | No | - |
| `body.protocol` | string | No | - Example: `HTTP` |

