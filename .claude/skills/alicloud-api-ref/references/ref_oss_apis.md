# 阿里云对象存储OSS核心API报告

## 一、资源创建/部署 (Create/Deploy)

| API 名称 | 功能描述 | 请求方法 | 关键参数 |
| --- | --- | --- | --- |
| PutBucket | 创建一个存储空间（Bucket）。 | PUT | `bucket`, `x-oss-acl`, `StorageClass`, `DataRedundancyType` |

## 二、资源配置/更新 (Update/Modify)

| API 名称 | 功能描述 | 请求方法 | 关键参数 |
| --- | --- | --- | --- |
| PutBucketAcl | 设置Bucket的访问权限（ACL）。 | PUT | `bucket`, `x-oss-acl` |
| PutBucketPolicy | 设置Bucket的授权策略（Policy）。 | PUT | `bucket`, `policy` |
| PutBucketCors | 设置Bucket的跨域资源共享（CORS）规则。 | PUT | `bucket`, `CORSConfiguration` |
| PutBucketWebsite | 配置Bucket的静态网站托管功能。 | PUT | `bucket`, `WebsiteConfiguration` |
| PutBucketLifecycle | 设置Bucket的生命周期规则。 | PUT | `bucket`, `LifecycleConfiguration` |

## 三、资源查询/状态 (Get/List/Describe)

| API 名称 | 功能描述 | 请求方法 | 关键参数 |
| --- | --- | --- | --- |
| ListBuckets (GetService) | 列出请求者拥有的所有存储空间。 | GET | `prefix`, `marker`, `max-keys` |
| GetBucketInfo | 获取Bucket的相关信息。 | GET | `bucket` |
| GetBucketLocation | 获取Bucket所在的地域信息。 | GET | `bucket` |
| GetBucketAcl | 获取Bucket的访问权限（ACL）。 | GET | `bucket` |
| GetBucketPolicy | 获取Bucket的授权策略（Policy）。 | GET | `bucket` |
| GetBucketCors | 获取Bucket的跨域资源共享（CORS）规则。 | GET | `bucket` |
| GetBucketWebsite | 获取Bucket的静态网站托管配置。 | GET | `bucket` |
| GetBucketLifecycle | 获取Bucket的生命周期规则。 | GET | `bucket` |

## 四、资源删除/清理 (Delete/Remove)

| API 名称 | 功能描述 | 请求方法 | 关键参数 |
| --- | --- | --- | --- |
| DeleteBucket | 删除一个空的存储空间。 | DELETE | `bucket` |
| DeleteBucketCors | 关闭Bucket的CORS功能并删除所有规则。 | DELETE | `bucket` |
| DeleteBucketWebsite | 关闭Bucket的静态网站托管功能。 | DELETE | `bucket` |
| DeleteBucketLifecycle | 删除Bucket的生命周期规则。 | DELETE | `bucket` |

## 五、特定于该产品的关键操作

| API 名称 | 功能描述 | 请求方法 | 关键参数 |
| --- | --- | --- | --- |
| PutBucketReferer | 设置Bucket的防盗链（Referer）配置。 | PUT | `bucket`, `RefererConfiguration` |
| GetBucketReferer | 获取Bucket的防盗链（Referer）配置。 | GET | `bucket` |
| PutBucketLogging | 设置Bucket的访问日志记录功能。 | PUT | `bucket`, `BucketLoggingStatus` |
| GetBucketLogging | 获取Bucket的访问日志记录配置。 | GET | `bucket` |
| PutBucketVersioning | 设置Bucket的版本控制状态。 | PUT | `bucket`, `VersioningConfiguration` |
| GetBucketVersioning | 获取Bucket的版本控制状态。 | GET | `bucket` |
| PutBucketReplication | 为Bucket设置跨区域复制规则。 | PUT | `bucket`, `ReplicationConfiguration` |
| GetBucketReplication | 获取Bucket的跨区域复制规则。 | GET | `bucket` |
| DeleteBucketReplication | 删除Bucket的跨区域复制规则。 | DELETE | `bucket` |
| PutObject | 上传一个文件（Object）到指定的Bucket。 | PUT | `bucket`, `key`, `Content-Length`, `Content-Type` |
| GetObject | 下载一个文件（Object）。 | GET | `bucket`, `key` |
| DeleteObject | 删除一个文件（Object）。 | DELETE | `bucket`, `key` |
| HeadObject | 获取一个Object的元数据。 | HEAD | `bucket`, `key` |
| ListObjects (GetBucket) | 列出Bucket中的Object。 | GET | `bucket`, `prefix`, `marker`, `max-keys` |
