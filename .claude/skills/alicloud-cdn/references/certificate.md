# SSL Certificate

SSL/TLS certificate management for CDN domains.

## setCdnDomainSSLCertificate

**Signature:** `setCdnDomainSSLCertificate(request: SetCdnDomainSSLCertificateRequest)`

You can call this operation up to 30 times per second per account. *   Method: POST..

**Parameters:** See `SetCdnDomainSSLCertificateRequest` model.

## setCdnDomainCSRCertificate

**Signature:** `setCdnDomainCSRCertificate(request: SetCdnDomainCSRCertificateRequest)`

> You can call this operation up to 100 times per second per account..

**Parameters:** See `SetCdnDomainCSRCertificateRequest` model.

## setCdnDomainSMCertificate

**Signature:** `setCdnDomainSMCertificate(request: SetCdnDomainSMCertificateRequest)`

> You can call this operation up to 30 times per second per account..

**Parameters:** See `SetCdnDomainSMCertificateRequest` model.

## createCdnCertificateSigningRequest

**Signature:** `createCdnCertificateSigningRequest(request: CreateCdnCertificateSigningRequestRequest)`

> You can call this operation up to 100 times per second per account..

**Parameters:** (1 required, 7 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `city` | string | No | The city. Default value: Hangzhou. Example: `Hangzhou` |
| `commonName` | string | Yes | The Common Name of the certificate. Example: `CommonName` |
| `country` | string | No | The country or region in which the organization is located. Default value: CN. Example: `CN` |
| `email` | string | No | The email address. Example: `username@example.com` |
| `organization` | string | No | The name of the organization. Default value: Alibaba Inc. Example: `Alibaba` |
| `organizationUnit` | string | No | The name of the department. Default value: Aliyun CDN. Example: `Aliyun` |
| `SANs` | string | No | The Subject Alternative Name (SAN) extension of the SSL certificate. This extension is used to add d Example: `example.com` |
| `state` | string | No | The provincial district. Default value: Zhejiang. Example: `Zhejiang` |

## describeCdnCertificateDetail

**Signature:** `describeCdnCertificateDetail(request: DescribeCdnCertificateDetailRequest)`

> You can call this operation up to 20 times per second per account..

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `certName` | string | Yes | The ID of the SSL certificate. You can query only one certificate at a time. Example: `cert-15480655xxxx` |

## describeCdnCertificateList

**Signature:** `describeCdnCertificateList(request: DescribeCdnCertificateListRequest)`

describeCdnCertificateList operation.

**Parameters:** (0 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | No | The accelerated domain name. Separate multiple accelerated domain names with commas (,). Example: `example.com` |

## describeDomainCertificateInfo

**Signature:** `describeDomainCertificateInfo(request: DescribeDomainCertificateInfoRequest)`

> You can call this operation up to 100 times per second per account..

**Parameters:** (1 required, 0 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | The accelerated domain name. You can specify only one domain name in each request. Example: `example.com` |


## describeCdnCertificateDetailById

**Signature:** `describeCdnCertificateDetailById(request: DescribeCdnCertificateDetailByIdRequest)`

Queries certificate details by certificate ID..

**Parameters:** (1 required, 1 optional)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `certId` | string | Yes | The ID of the certificate. Example: `12345` |
| `certRegion` | string | No | The region of the certificate. Valid values: Example: `cn-hangzhou` |


## describeCertificateInfoByID

**Signature:** `describeCertificateInfoByID(request: DescribeCertificateInfoByIDRequest)`

You can call this operation up to 100 times per second per account. *   If a certificate is associated with a domain name but the certificate is not enabled, the result of this operation shows that th.

