# 后台媒体管理

## 概述

saltx 后台提供音乐和图片的管理能力，包括上传、编辑、删除和元数据维护。  
所有文件存储于 Cloudflare R2，元数据存储于 Cloudflare D1（SQLite）。

- 后台前端路由：`/admin/*`
- 后台 API 路由：`/api/admin/*`
- 文件访问路由：`/files/{key}`（公开，不鉴权）
- 认证：Cloudflare Access（待接入）

---

## 数据模型

### music 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | nanoid(8)，小写字母+数字 |
| name | TEXT NOT NULL | 音乐名称 |
| artist | TEXT NOT NULL | 音乐人 |
| version | TEXT NOT NULL | 版本，如 "原版"、"Live"、"Remix" |
| extension | TEXT NOT NULL | 文件扩展名，如 "mp3"、"flac" |
| cover_file_key | TEXT | 封面图在 R2 的路径，使用图片缩略图或原图的 key |
| created_at | TEXT NOT NULL | ISO 8601 |
| updated_at | TEXT NOT NULL | ISO 8601 |

**R2 路径规则：** `music/{id}/{version}.{extension}`

### image 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | nanoid(8)，小写字母+数字 |
| name | TEXT NOT NULL | 图片名称 |
| extension | TEXT NOT NULL | 文件扩展名，如 "webp"、"jpg" |
| aspect_ratio | TEXT NOT NULL | 比例，目前固定 "1:1" |
| file_key | TEXT | 原图在 R2 的路径 |
| thumbnail_key | TEXT | 缩略图在 R2 的路径（200×200 WebP） |
| created_at | TEXT NOT NULL | ISO 8601 |
| updated_at | TEXT NOT NULL | ISO 8601 |

**R2 路径规则：**
- 原图：`image/{id}.{extension}`
- 缩略图：`image/{id}_thumb.webp`

---

## 音乐管理 API

### POST /api/admin/music — 上传音乐

**请求：multipart/form-data**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 音乐名称 |
| artist | string | 是 | 音乐人 |
| version | string | 是 | 版本标识 |
| file | File | 是 | 音频文件 |
| cover_file_key | string | 否 | 封面图 R2 路径（从图片库选取） |

**响应：201**

```json
{
  "id": "hqpo5942",
  "name": "夜曲",
  "artist": "周杰伦",
  "version": "原版",
  "extension": "mp3",
  "cover_file_key": "image/k3a9x2bf_thumb.webp",
  "created_at": "2026-05-08T12:00:00Z",
  "updated_at": "2026-05-08T12:00:00Z",
  "file_key": "music/hqpo5942/原版.mp3"
}
```

---

### PUT /api/admin/music?id={id} — 编辑音乐

**请求：multipart/form-data**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | 新名称 |
| artist | string | 否 | 新音乐人 |
| cover_file_key | string | 否 | 新封面，空字符串表示清除 |
| file | File | 否 | 替换音频文件 |
| version | string | 否 | 替换时的版本号（file 存在时有效） |

**响应：200** — 返回更新后的完整记录

---

### DELETE /api/admin/music?id={id} — 删除音乐

同步删除 R2 文件和 D1 记录。

**响应：200**

```json
{ "success": true }
```

---

### GET /api/admin/music/list — 音乐列表

**Query 参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| page | number | 页码，默认 1 |
| pageSize | number | 每页条数，默认 20，最大 100 |
| name | string | 名称模糊搜索 |
| artist | string | 音乐人模糊搜索 |

**响应：200**

```json
{
  "items": [...],
  "page": 1,
  "pageSize": 20,
  "total": 42,
  "totalPages": 3
}
```

---

## 图片管理 API

### POST /api/admin/image — 上传图片

前端负责裁剪（svelte-easy-crop）和缩略图生成（Canvas API → WebP）。

**请求：multipart/form-data**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | File | 是 | 裁剪后的原图（WebP） |
| thumbnail | File | 否 | 缩略图（200×200 WebP） |
| name | string | 否 | 图片名称，缺省取文件名 |
| aspect_ratio | string | 否 | 比例，目前仅支持 "1:1" |

**响应：201** — 返回完整 image 记录

---

### GET /api/admin/image?id={id} — 图片详情

**响应：200** — 返回 image 记录，**404** — 不存在

---

### PUT /api/admin/image?id={id} — 更新图片信息

**请求：application/json**

```json
{ "name": "新名称" }
```

**响应：200** — 返回更新后的完整记录

---

### DELETE /api/admin/image?id={id} — 删除图片

同步删除原图、缩略图（R2）和 D1 记录。

**响应：200**

```json
{ "success": true }
```

---

### GET /api/admin/image/list — 图片列表

**Query 参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| page | number | 页码，默认 1 |
| pageSize | number | 每页条数，默认 20，最大 100 |
| name | string | 名称模糊搜索 |

---

## 文件访问

所有 R2 文件统一通过 `/files/{key}` 访问，支持 Range 请求（音频流式播放）：

```
GET /files/music/hqpo5942/原版.mp3
GET /files/image/k3a9x2bf.webp
GET /files/image/k3a9x2bf_thumb.webp
```

不鉴权，后续可按需加 Cloudflare Access Policy。

---

## 前台准备

前台（公开站点）独立于后台，规划如下：

- 前台前端路由：`/`（根路由，未来实现）
- 前台 API 路由：`/api/*`（与 `/api/admin/*` 区分）
- 认证：GitHub OAuth（待实现）
- 主要功能：音乐播放页、图片浏览页（基于后台已有数据）
