# Live Channel

RTMP-based live streaming channel management and VOD playlist.

## putLiveChannel

**Signature:** `putLiveChannel(bucket: string, channel: string, request: PutLiveChannelRequest)`

putLiveChannel operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `channel` | string | Yes | Path parameter: channel |
| `liveChannelConfiguration` | LiveChannelConfiguration | No | - |

## getLiveChannelInfo

**Signature:** `getLiveChannelInfo(bucket: string, channel: string)`

getLiveChannelInfo operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `channel` | string | Yes | Path parameter: channel |

## getLiveChannelStat

**Signature:** `getLiveChannelStat(bucket: string, channel: string)`

getLiveChannelStat operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `channel` | string | Yes | Path parameter: channel |

## getLiveChannelHistory

**Signature:** `getLiveChannelHistory(bucket: string, channel: string)`

getLiveChannelHistory operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `channel` | string | Yes | Path parameter: channel |

## listLiveChannel

**Signature:** `listLiveChannel(bucket: string, request: ListLiveChannelRequest)`

listLiveChannel operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `marker` | string | No | - |
| `maxKeys` | number | No | - |
| `prefix` | string | No | - |

## putLiveChannelStatus

**Signature:** `putLiveChannelStatus(bucket: string, channel: string, request: PutLiveChannelStatusRequest)`

putLiveChannelStatus operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `channel` | string | Yes | Path parameter: channel |
| `status` | string | No | - |

## deleteLiveChannel

**Signature:** `deleteLiveChannel(bucket: string, channel: string)`

deleteLiveChannel operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `channel` | string | Yes | Path parameter: channel |

## postVodPlaylist

**Signature:** `postVodPlaylist(bucket: string, channel: string, playlist: string, request: PostVodPlaylistRequest)`

postVodPlaylist operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `channel` | string | Yes | Path parameter: channel |
| `playlist` | string | Yes | Path parameter: playlist |
| `endTime` | string | No | - |
| `startTime` | string | No | - |

## getVodPlaylist

**Signature:** `getVodPlaylist(bucket: string, channel: string, request: GetVodPlaylistRequest)`

getVodPlaylist operation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bucket` | string | Yes | Path parameter: bucket |
| `channel` | string | Yes | Path parameter: channel |
| `endTime` | string | No | - |
| `startTime` | string | No | - |

