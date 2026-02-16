# Redis Core API Report

**Product Name:** Redis
**Product Code:** R-kvstore
**API Version:** 2015-01-01
**API Style:** RPC
**Total API Count:** 146

## Create/Deploy

| API Name | Description | Method | Key Parameters |
|---|---|---|---|
| CreateInstance | 创建一个Redis开源版或Tair内存型经典版实例。若要创建云原生型的Tair实例，请使用CreateTairInstance接口。 |  |  |
| CreateGlobalDistributeCache | 将一个存量的Tair内存型（经典版）实例转换为分布式实例中第一个子实例。 |  |  |
| CreateTairInstance | 创建云原生版的Tair（企业版）实例。 |  |  |
| CreateInstances | 批量创建云数据库 Tair（兼容 Redis）经典版实例。 |  |  |
| CreateAccount | 创建云数据库 Tair（兼容 Redis）实例的账号。 |  |  |
| CreateBackup | 为云数据库 Tair（兼容 Redis）实例创建数据备份。 |  |  |
| CreateCacheAnalysisTask | 手动发起实例缓存分析任务。 |  |  |
| CreateGlobalSecurityIPGroup | 创建全局IP白名单模板。 |  |  |
| CreateParameterGroup | 创建参数模板。 |  |  |
| CreateTairKVCacheVNode | 创建Tair VNode虚拟节点实例 |  |  |

## Update/Modify

| API Name | Description | Method | Key Parameters |
|---|---|---|---|
| ModifyInstanceSpec | 变更云数据库 Tair（兼容 Redis）实例的规格。 |  |  |
| ModifyInstanceAttribute | 修改云数据库 Tair（兼容 Redis）实例的部分信息，包括实例密码、名称等。 |  |  |
| ModifyResourceGroup | 修改云数据库 Tair（兼容 Redis）实例所属的资源组。 |  |  |
| ModifyInstanceMaintainTime | 修改云数据库 Tair（兼容 Redis）实例的可维护时段，阿里云将在您设定的可维护时段内对实例进行例行维护。 |  |  |
| ModifyInstanceMajorVersion | 升级云数据库 Tair（兼容 Redis）实例的大版本。 |  |  |
| ModifyInstanceMinorVersion | 升级云数据库 Tair（兼容 Redis）实例的小版本。 |  |  |
| ModifyDBInstanceAutoUpgrade | 修改实例的小版本自动升级开关。 |  |  |
| SwitchInstanceHA | 执行主备切换（即切换节点角色），可应用于容灾演练、多可用区场景下的应用就近连接等需求。 |  |  |
| ModifyInstanceNetExpireTime | 若云数据库 Tair（兼容 Redis）实例之前执行过由经典网络向VPC网络切换，并保留了经典网络连接地址，则可调用本接口延长经典网络连接地址的保留时间。 |  |  |
| ModifyDBInstanceConnectionString | 修改云数据库 Tair（兼容 Redis）实例的连接地址和端口。 |  |  |
| ModifyIntranetAttribute | 临时调整专属集群中云数据库 Tair（兼容 Redis）实例的内网带宽。 |  |  |
| SwitchNetwork | 切换云数据库 Tair（兼容 Redis）实例的专有网络VPC或交换机，如果实例为经典网络，则会将其切换为专有网络。 |  |  |
| SwitchInstanceProxy | 开启或关闭专属集群中云数据库 Tair（兼容 Redis）集群实例的代理模式。 |  |  |
| ModifyInstanceAutoRenewalAttribute | 开启或者关闭云数据库 Tair（兼容 Redis）实例的到期前自动续费功能。 |  |  |
| ModifyAccountDescription | 修改云数据库 Tair（兼容 Redis）实例的账号描述。 |  |  |
| ModifyAccountPassword | 修改云数据库 Tair（兼容 Redis）实例中指定账号的密码。 |  |  |
| ModifyBackupPolicy | 修改云数据库 Tair（兼容 Redis）实例的自动备份策略。 |  |  |
| ModifyAuditLogConfig | 开启或修改云数据库 Tair（兼容 Redis）实例的审计日志设置。 |  |  |
| DescribeAuditLogConfig | 查询云数据库 Tair（兼容 Redis）实例审计日志是否开启、日志保存时间等配置信息。 |  |  |
| ModifySecurityIps | 设置云数据库 Tair（兼容 Redis）实例的IP白名单。 |  |  |
| ModifySecurityGroupConfiguration | 设置云数据库 Tair（兼容 Redis）实例白名单中的安全组。 |  |  |
| ModifyInstanceSSL | 为云数据库 Tair（兼容 Redis）实例开启TLS（Transport Layer Security）加密协议配置。 |  |  |
| ModifyInstanceVpcAuthMode | 开启或关闭专有网络免密访问。开启后，同一专有网络内的云服务器无需使用密码即可连接云数据库 Tair（兼容 Redis）实例，同时也继续兼容通过用户名和密码的方式连接实例。 |  |  |
| DescribeSecurityGroupConfiguration | 查看云数据库 Tair（兼容 Redis）白名单中设置的安全组。 |  |  |
| ModifyInstanceConfig | 修改云数据库 Tair（兼容 Redis）实例的参数配置。 |  |  |
| DescribeInstanceConfig | 查询云数据库 Tair（兼容 Redis）实例的部分默认配置参数信息。 |  |  |
| ModifyInstanceTDE | 为云数据库 Tair（兼容 Redis）实例开启透明数据加密TDE功能，支持自定义密钥。 |  |  |
| ModifyActiveOperationTask | 修改运维任务的计划切换时间。 |  |  |
| DescribeActiveOperationMaintenanceConfig | 查询实例的运维任务配置。 |  |  |
| ModifyActiveOperationMaintainConfig | ModifyActiveOperationMaintainConf |  |  |
| ModifyGlobalSecurityIPGroupName | 修改全局IP白名单模板的名称。 |  |  |
| ModifyGlobalSecurityIPGroup | 修改全局IP白名单模板。 |  |  |
| ModifyGlobalSecurityIPGroupRelation | 将指定实例添加到指定的IP白名单模板中。 |  |  |
| ModifyInstanceParameter | 将参数模板应用至指定实例，表示将参数模板的值赋于指定的实例中。当您修改参数模版后，您也需要重新应用至指定实例，才能将修改后的参数值赋于指定实例。 |  |  |
| ModifyParameterGroup | 修改参数模板的设置。 |  |  |
| ModifyActiveOperationTasks | 修改实例计划内运维事件的切换时间。 |  |  |
| ModifyEventInfo | 事件中心修改事件信息 |  |  |
| SwitchInstanceZoneFailOver | 模拟云数据库 Tair（兼容 Redis）集群架构实例发生可用区级别故障，实例将自动切换到备可用区中。 |  |  |
| ModifyInstanceBandwidth | 设置云数据库 Tair（兼容 Redis）实例的目标带宽值。 |  |  |
| ModifyTaskInfo | 进行任务操作，当前支持修改任务执行时间点。 |  |  |
| ModifyBackupExpireTime | 延长手动备份数据的过期时间。 |  |  |
| ModifyDBInstanceMonitor | 修改Tair实例的监控采集粒度 |  |  |

## Get/List/Describe

| API Name | Description | Method | Key Parameters |
|---|---|---|---|
| DescribeRegions | 查询云数据库 Tair（兼容 Redis）实例支持的所有地域及其对应可用区信息。 |  |  |
| DescribeZones | 查询指定地域下，云数据库 Tair（兼容 Redis）支持的可用区。若要查询当前可购买的可用区，请使用"DescribeAvailableResource"接口获取。 |  |  |
| DescribeAvailableResource | 查询指定可用区内可创建的实例规格。 |  |  |
| DescribeInstancesOverview | 查询一个或多个云数据库 Tair（兼容 Redis）实例的信息概览。 |  |  |
| DescribeInstances | 查询一个或多个云数据库 Tair（兼容 Redis）实例的信息。 |  |  |
| DescribeDedicatedClusterInstanceList | 查询专属集群中的云数据库 Tair（兼容 Redis）实例信息。 |  |  |
| DescribeInstanceAttribute | 查询云数据库 Tair（兼容 Redis）实例的详细信息。 |  |  |
| DescribeGlobalDistributeCache | 查询分布式实例的详细信息。 |  |  |
| DescribeEngineVersion | 查询云数据库 Tair（兼容 Redis）实例的大版本和小版本信息，同时可查询到小版本的发布日志信息。 |  |  |
| DescribeRoleZoneInfo | 查询云数据库 Tair（兼容 Redis）实例中各节点的角色、类型、小版本和所属的可用区。 |  |  |
| DescribeClusterMemberInfo | 查询云数据库 Tair（兼容 Redis）集群实例的节点配置信息（例如规格、最大连接数等）。 |  |  |
| DescribeDBInstanceNetInfo | 查看云数据库 Tair（兼容 Redis）实例的网络信息。 |  |  |
| DescribeDBNodeDirectVipInfo | 查询集群版直连实例的子实例VIP（Virtual IP Address）信息。 |  |  |
| DescribeLogicInstanceTopology | 查询云数据库 Tair（兼容 Redis）实例的逻辑拓扑结构。 |  |  |
| DescribeIntranetAttribute | 查询云数据库 Tair（兼容 Redis）实例当前的带宽。 |  |  |
| DescribePrice | 查询创建、升级配置或续费云数据库 Tair（兼容 Redis）实例等操作产生的费用。 |  |  |
| DescribeInstanceAutoRenewalAttribute | 查看云数据库 Tair（兼容 Redis）实例是否开通自动续费。 |  |  |
| DescribeAccounts | 查找指定云数据库 Tair（兼容 Redis）实例列表中某个账号的信息。 |  |  |
| DescribeBackupTasks | 查询云数据库 Tair（兼容 Redis）实例的备份任务执行情况。 |  |  |
| DescribeBackupPolicy | 查询云数据库 Tair（兼容 Redis）实例的备份策略，包括备份周期、备份时间等。 |  |  |
| DescribeBackups | 查询云数据库 Tair（兼容 Redis）实例的备份文件信息。 |  |  |
| DescribeClusterBackupList | 查询云数据库 Tair（兼容 Redis）集群实例的备份列表。 |  |  |
| DescribeDBInstanceMonitor | 查询Tair实例的监控采集粒度 |  |  |
| DescribeMonitorItems | 查询云数据库 Tair（兼容 Redis）实例支持的监控项列表。 |  |  |
| DescribeHistoryMonitorValues | 查看云数据库 Tair（兼容 Redis）实例的性能监控信息。 |  |  |
| DescribeAuditRecords | 查询云数据库 Tair（兼容 Redis）实例的审计日志。 |  |  |
| DescribeRunningLogRecords | 查询云数据库 Tair（兼容 Redis）实例的运行日志。 |  |  |
| DescribeSlowLogRecords | 查询云数据库 Tair（兼容 Redis）实例在指定时间内产生的慢日志。 |  |  |
| DescribeServiceLinkedRoleExists | 查询云数据库 Tair（兼容 Redis）是否已授权服务关联角色。 |  |  |
| DescribeSecurityIps | 查询云数据库 Tair（兼容 Redis）实例的IP白名单。 |  |  |
| DescribeInstanceSSL | 查询云数据库 Tair（兼容 Redis）实例是否开启了TLS（SSL）加密认证。 |  |  |
| DescribeParameterTemplates | 查询云数据库 Tair（兼容 Redis）实例在不同架构和大版本下的参数列表和默认值。 |  |  |
| DescribeParameters | 查询云数据库 Tair（兼容 Redis）实例的配置参数和运行参数。 |  |  |
| DescribeParameterModificationHistory | 查询云数据库 Tair（兼容 Redis）实例的参数修改历史。 |  |  |
| ListTagResources | 查询云数据库 Tair（兼容 Redis）实例和标签的绑定关系。 |  |  |
| DescribeCacheAnalysisReport | 查看实例在指定日期中的缓存分析报告。 |  |  |
| DescribeCacheAnalysisReportList | 查询实例的缓存分析报告列表。 |  |  |
| DescribeInstanceTDEStatus | 查询云数据库 Tair（兼容 Redis）实例是否开启了TDE加密功能。 |  |  |
| DescribeEncryptionKeyList | 查询云数据库 Tair（兼容 Redis）实例使用的自定义密钥列表。 |  |  |
| DescribeEncryptionKey | 查询云数据库 Tair（兼容 Redis）实例的透明数据加密TDE自定义密钥的详情。 |  |  |
| DescribeActiveOperationTaskCount | 查询Tair实例的运维任务数量 |  |  |
| DescribeHistoryTasks | 查看任务中心的任务列表。 |  |  |
| DescribeHistoryTasksStat | 查询任务中心的任务统计。 |  |  |
| DescribeActiveOperationTask | 查询云数据库 Tair（兼容 Redis）实例的运维任务详情。 |  |  |
| DescribeGlobalSecurityIPGroupRelation | 查询实例关联的全局IP白名单模板信息。 |  |  |
| DescribeGlobalSecurityIPGroup | 查询全局IP白名单模板列表。 |  |  |
| DescribeParameterGroupSupportParam | 查询在不同版本的参数模版中支持设置的参数列表。 |  |  |
| DescribeParameterGroup | 查询参数模版基本信息。 |  |  |
| DescribeParameterGroups | 查询可用的参数模版列表。 |  |  |
| DescribeParameterGroupTemplateList | 查询参数模板中可配置参数的具体信息，例如默认值、取值范围、描述等。 |  |  |
| DescribeActiveOperationTasks | 查询实例的运维事件详情。 |  |  |
| DescribeHistoryEvents | 查询事件中心中的历史事件 |  |  |
| DescribeHistoryEventsStat | 查询历史事件统计。 |  |  |
| DescribeTairKVCacheInferInstances | 查询一个或多个Tair KVCache实例的信息。 |  |  |
| DescribeTags | 查询目标地域中所有的标签信息。 |  |  |
| DescribeDbInstanceConnectivity | 检测源客户端IP到实例的联通性。 |  |  |

## Delete/Remove

| API Name | Description | Method | Key Parameters |
|---|---|---|---|
| DeleteShardingNode | 删除集群实例中的数据分片节点，本接口仅支持集群架构云原生版实例。 |  |  |
| DeleteInstance | 释放云数据库 Tair（兼容 Redis）实例。 |  |  |
| RemoveSubInstance | 将子实例从分布式实例中移除并转变为普通实例（数据会被保留）。 |  |  |
| DeleteAccount | 删除云数据库 Tair（兼容 Redis）实例的账号。 |  |  |
| DeleteGlobalSecurityIPGroup | 删除全局IP白名单模板。 |  |  |
| DeleteParameterGroup | 删除参数模板。 |  |  |
| DeleteBackup | 删除指定备份集，但仅支持删除手动备份的备份集。 |  |  |

## Specific Operations

| API Name | Description | Method | Key Parameters |
|---|---|---|---|
| AllocateInstancePublicConnection | 为云数据库 Tair（兼容 Redis）实例申请公网连接地址。 |  |  |
| ReleaseInstancePublicConnection | 释放云数据库 Tair（兼容 Redis）实例的公网连接地址。 |  |  |
| AllocateDirectConnection | 申请云数据库 Tair（兼容 Redis）集群实例的直连地址。 |  |  |
| ReleaseDirectConnection | 释放云数据库 Tair（兼容 Redis）集群实例的直连地址。 |  |  |
| RestoreInstance | 恢复指定备份文件中的数据到云数据库 Tair（兼容 Redis）实例中。 |  |  |

