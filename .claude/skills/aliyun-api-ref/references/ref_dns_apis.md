# 云解析 DNS (Alidns) 核心 API 报告

**产品名称:** 云解析 DNS
**产品Code:** Alidns
**API版本:** 2015-01-09
**API风格:** RPC
**总API数量:** 235

## 1. 域名管理

| API 名称 | 功能描述 | 方法 |
|---|---|---|
| AddDomain | 添加域名 | POST/GET |
| DeleteDomain | 删除域名 | POST/GET |
| DescribeDomains | 获取域名列表 | POST/GET |
| DescribeDomainInfo | 获取域名信息 | POST/GET |
| UpdateDomainRemark | 修改域名备注 | POST/GET |
| GetMainDomainName | 获取主域名名称 | POST/GET |
| ModifyHichinaDomainDNS | 变更域名DNS服务器 | POST/GET |

## 2. 解析记录管理（核心）

| API 名称 | 功能描述 | 方法 |
|---|---|---|
| AddDomainRecord | 添加解析记录 | POST/GET |
| UpdateDomainRecord | 修改解析记录 | POST/GET |
| DeleteDomainRecord | 删除解析记录 | POST/GET |
| SetDomainRecordStatus | 设置解析记录状态（启用/暂停） | POST/GET |
| DescribeDomainRecords | 获取域名的解析记录列表 | POST/GET |
| DescribeDomainRecordInfo | 获取解析记录详情 | POST/GET |
| DescribeSubDomainRecords | 获取子域名的所有解析记录 | POST/GET |
| UpdateDomainRecordRemark | 修改解析记录备注 | POST/GET |

## 3. 批量操作

| API 名称 | 功能描述 | 方法 |
|---|---|---|
| OperateBatchDomain | 批量操作（添加/删除域名和解析记录） | POST/GET |
| DescribeBatchResultDetail | 获取批量操作结果详情 | POST/GET |
| DescribeBatchResultCount | 获取批量操作结果统计 | POST/GET |

## 4. 域名分组

| API 名称 | 功能描述 | 方法 |
|---|---|---|
| AddDomainGroup | 添加域名分组 | POST/GET |
| UpdateDomainGroup | 修改域名分组名称 | POST/GET |
| DeleteDomainGroup | 删除域名分组 | POST/GET |
| ChangeDomainGroup | 更换域名所属分组 | POST/GET |
| DescribeDomainGroups | 获取域名分组列表 | POST/GET |

## 5. DNS负载均衡

| API 名称 | 功能描述 | 方法 |
|---|---|---|
| SetDNSSLBStatus | 开启/关闭权重配置 | POST/GET |
| UpdateDNSSLBWeight | 修改解析记录权重 | POST/GET |
| DescribeDNSSLBSubDomains | 获取DNS负载均衡子域名列表 | POST/GET |

## 6. DNSSEC

| API 名称 | 功能描述 | 方法 |
|---|---|---|
| SetDomainDnssecStatus | 开启/关闭DNSSEC | POST/GET |
| DescribeDomainDnssecInfo | 获取DNSSEC信息 | POST/GET |

## 7. 域名备份

| API 名称 | 功能描述 | 方法 |
|---|---|---|
| AddDomainBackup | 建立域名备份 | POST/GET |
| DescribeRecordLogs | 获取解析操作日志 | POST/GET |

## 8. 域名转移

| API 名称 | 功能描述 | 方法 |
|---|---|---|
| TransferDomain | 批量跨账号转移DNS权限 | POST/GET |
| DescribeTransferDomains | 获取跨账号转移DNS列表 | POST/GET |
| RetrieveDomain | 找回域名 | POST/GET |
| GetTxtRecordForVerify | 生成验证TXT记录 | POST/GET |

## 9. 付费版DNS绑定

| API 名称 | 功能描述 | 方法 |
|---|---|---|
| BindInstanceDomains | 绑定付费版DNS域名到实例 | POST/GET |
| UnbindInstanceDomains | 解绑付费版DNS域名 | POST/GET |
| ChangeDomainOfDnsProduct | 更换云解析产品绑定域名 | POST/GET |

## 10. 统计与监控

| API 名称 | 功能描述 | 方法 |
|---|---|---|
| DescribeRecordStatistics | 查询子域名请求量实时数据 | POST/GET |
| DescribeRecordStatisticsSummary | 查询全部子域名请求量统计 | POST/GET |
| DescribeRecordResolveStatisticsSummary | 查询域名下全部子域名请求量统计 | POST/GET |
| DescribeDomainStatistics | 获取域名请求量统计 | POST/GET |
| DescribeDomainStatisticsSummary | 获取域名请求量统计汇总 | POST/GET |
