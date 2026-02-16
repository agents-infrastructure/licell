# 函数计算 FC 3.0 核心 API 报告

**产品名称:** 函数计算3.0
**产品Code:** FC
**API版本:** 2023-03-30
**API风格:** ROA
**总API数量:** 86

## 1. 函数管理 (Function)

| API 名称 | 功能描述 | 方法 |
|---|---|---|
| CreateFunction | 创建函数 | POST |
| UpdateFunction | 更新函数信息 | PUT |
| GetFunction | 获取函数详情 | GET |
| GetFunctionCode | 获取函数代码 | GET |
| ListFunctions | 获取函数列表 | GET |
| DeleteFunction | 删除函数 | DELETE |
| InvokeFunction | 调用执行函数 | POST |

## 2. 触发器管理 (Trigger)

| API 名称 | 功能描述 | 方法 |
|---|---|---|
| CreateTrigger | 创建触发器 | POST |
| UpdateTrigger | 更新触发器信息 | PUT |
| GetTrigger | 获取触发器详情 | GET |
| ListTriggers | 查询触发器列表 | GET |
| DeleteTrigger | 删除触发器 | DELETE |

## 3. 版本与别名管理 (Version & Alias)

| API 名称 | 功能描述 | 方法 |
|---|---|---|
| PublishFunctionVersion | 发布函数版本 | POST |
| ListFunctionVersions | 查询函数版本列表 | GET |
| DeleteFunctionVersion | 删除函数版本 | DELETE |
| CreateAlias | 创建别名 | POST |
| UpdateAlias | 更新别名 | PUT |
| GetAlias | 获取别名详情 | GET |
| ListAliases | 查询别名列表 | GET |
| DeleteAlias | 删除别名 | DELETE |

## 4. 自定义域名 (Custom Domain)

| API 名称 | 功能描述 | 方法 |
|---|---|---|
| CreateCustomDomain | 创建自定义域名 | POST |
| UpdateCustomDomain | 更新自定义域名 | PUT |
| GetCustomDomain | 获取自定义域名详情 | GET |
| ListCustomDomains | 获取自定义域名列表 | GET |
| DeleteCustomDomain | 删除自定义域名 | DELETE |

## 5. 层管理 (Layer)

| API 名称 | 功能描述 | 方法 |
|---|---|---|
| CreateLayerVersion | 创建层版本 | POST |
| GetLayerVersion | 获取层版本详情 | GET |
| ListLayerVersions | 获取层版本列表 | GET |
| ListLayers | 获取层列表 | GET |
| DeleteLayerVersion | 删除层版本 | DELETE |
| PutLayerACL | 修改层的权限 | PUT |

## 6. 异步调用配置 (Async Invoke)

| API 名称 | 功能描述 | 方法 |
|---|---|---|
| PutAsyncInvokeConfig | 创建或更新异步调用配置 | PUT |
| GetAsyncInvokeConfig | 获取异步调用配置 | GET |
| ListAsyncInvokeConfigs | 查询所有异步配置 | GET |
| DeleteAsyncInvokeConfig | 删除异步调用配置 | DELETE |
| GetAsyncTask | 获取异步任务详情 | GET |
| ListAsyncTasks | 获取异步任务列表 | GET |
| StopAsyncTask | 停止异步任务 | PUT |

## 7. 弹性与并发配置 (Scaling & Concurrency)

| API 名称 | 功能描述 | 方法 |
|---|---|---|
| PutProvisionConfig | 创建预留配置 | PUT |
| GetProvisionConfig | 获取预留配置 | GET |
| ListProvisionConfigs | 查询预留配置列表 | GET |
| DeleteProvisionConfig | 删除预留配置 | DELETE |
| PutConcurrencyConfig | 设置函数并发度 | PUT |
| ListConcurrencyConfigs | 查询并发度配置列表 | GET |
| DeleteConcurrencyConfig | 删除并发度配置 | DELETE |
| PutScalingConfig | 设置函数弹性配置 | PUT |
| GetScalingConfig | 获取函数弹性配置 | GET |
| ListScalingConfigs | 列出函数弹性配置 | GET |
| DeleteScalingConfig | 删除函数弹性配置 | DELETE |

## 8. VPC 绑定

| API 名称 | 功能描述 | 方法 |
|---|---|---|
| CreateVpcBinding | 创建VPC连接 | POST |
| ListVpcBindings | 查询VPC连接列表 | GET |
| DeleteVpcBinding | 删除VPC连接 | DELETE |

## 9. 实例与标签

| API 名称 | 功能描述 | 方法 |
|---|---|---|
| ListInstances | 查询函数实例列表 | GET |
| TagResources | 给资源打标签 | POST |
| UntagResources | 删除资源标签 | DELETE |
| ListTagResources | 列出被打标签的资源 | GET |
