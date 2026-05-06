# 音乐管理需求文档

## 功能概述

提供音乐文件的管理能力，包括上传、存储和元数据管理。音乐文件存储于 Cloudflare R2，元数据存储于 Cloudflare D1。

## 数据模型

### music 表（D1）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT (PK) | nanoid(8) 主键，小写字母+数字 |
| name | TEXT NOT NULL | 音乐名称 |
| artist | TEXT NOT NULL | 音乐人 |
| version | TEXT NOT NULL | 版本，如 "原版", "Live版", "Remix" |
| extension | TEXT NOT NULL | 文件扩展名，如 "mp3", "flac"（不带点） |
| created_at | TEXT NOT NULL | 创建时间 (ISO 8601) |
| updated_at | TEXT NOT NULL | 更新时间 (ISO 8601)，默认与创建时间相同 |

### 文件命名规则

```
key = {id}/{version}{extension}
```

示例：`id=k3a9x2bf`, `version=原版`, `extension=mp3` → `k3a9x2bf/原版.mp3`

通过 `buildFileKey(id, version, extension)` 工具函数构造。

---

## 接口列表

### 1. POST /api/music — 上传音乐

**请求：Content-Type: multipart/form-data**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 音乐名称 |
| artist | string | 是 | 音乐人 |
| version | string | 是 | 版本，如 "原版", "Live版", "Remix" |
| file | File | 是 | 音乐文件 |

**响应：201 Created**

```json
{
  "id": "k3a9x2bf",
  "name": "夜曲",
  "artist": "周杰伦",
  "version": "原版",
  "extension": "mp3",
  "file_key": "k3a9x2bf/原版.mp3",
  "created_at": "2026-05-03T12:00:00Z"
}
```

**错误响应：400**

```json
{
  "error": "缺少必填字段: name"
}
```

---

### 后续待实现（TODO）

- [x] GET /api/music/list — 获取音乐列表（支持分页、按名称/音乐人筛选）
- [ ] GET /api/music/:id — 获取音乐详情
- [ ] GET /api/music/:id/file — 获取音乐文件（返回 R2 预签名 URL 或直接流）
- [ ] DELETE /api/music/:id — 删除音乐（同步删除 D1 记录和 R2 文件）
