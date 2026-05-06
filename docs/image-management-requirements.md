# 图片管理需求文档

## 功能概述

提供图片文件的管理能力，包括上传、存储和元数据管理。图片文件存储于 Cloudflare R2，元数据存储于 Cloudflare D1。

## 数据模型

### image 表（D1）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT (PK) | nanoid(8) 主键，小写字母+数字 |
| name | TEXT NOT NULL | 图片名称 |
| extension | TEXT NOT NULL | 文件扩展名，如 "png", "jpg"（不带点） |
| aspect_ratio | TEXT NOT NULL | 比例，目前固定 "1:1" |
| created_at | TEXT NOT NULL | 创建时间 (ISO 8601) |
| updated_at | TEXT NOT NULL | 更新时间 (ISO 8601) |

### 文件命名规则

```
key = {id}.{extension}
```

示例：`id=k3a9x2bf`, `extension=png` → `k3a9x2bf.png`

---

## 接口列表

### 1. POST /api/image — 上传图片

**请求：Content-Type: multipart/form-data**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 图片名称 |
| file | File | 是 | 图片文件 |
| aspect_ratio | string | 否 | 比例，默认 "1:1"，目前仅支持 "1:1" |

**响应：201 Created**

```json
{
  "id": "k3a9x2bf",
  "name": "封面图",
  "extension": "png",
  "aspect_ratio": "1:1",
  "file_key": "k3a9x2bf.png",
  "created_at": "2026-05-03T12:00:00Z",
  "updated_at": "2026-05-03T12:00:00Z"
}
```

**错误响应：400**

```json
{
  "error": "缺少必填字段: name"
}
```

**curl 示例**

```bash
curl -X POST http://localhost:5173/api/image \
  -F "name=封面图" \
  -F "aspect_ratio=1:1" \
  -F "file=@/path/to/cover.png"
```

---

### 2. GET /api/image/list — 获取图片列表

**请求参数（Query）**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页条数，默认 20，最大 100 |
| name | string | 否 | 按名称模糊搜索 |

**响应：200 OK**

```json
{
  "items": [
    {
      "id": "k3a9x2bf",
      "name": "封面图",
      "extension": "png",
      "aspect_ratio": "1:1",
      "file_key": "k3a9x2bf.png",
      "created_at": "2026-05-03T12:00:00Z",
      "updated_at": "2026-05-03T12:00:00Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 1,
  "totalPages": 1
}
```

---

### 3. GET /api/image — 获取图片详情

**请求参数（Query）**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 图片 ID |

**响应：200 OK**

```json
{
  "id": "k3a9x2bf",
  "name": "封面图",
  "extension": "png",
  "aspect_ratio": "1:1",
  "file_key": "k3a9x2bf.png",
  "created_at": "2026-05-03T12:00:00Z",
  "updated_at": "2026-05-03T12:00:00Z"
}
```

**错误响应：404**

```json
{
  "error": "图片不存在"
}
```

---

### 4. PUT /api/image — 更新图片信息

**请求参数（Query）**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 图片 ID |

**请求体：Content-Type: application/json**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | 新名称 |
| aspect_ratio | string | 否 | 新比例，目前仅支持 "1:1" |

**响应：200 OK**

返回更新后的完整记录。

**错误响应：404 / 400**

---

### 5. DELETE /api/image — 删除图片

**请求参数（Query）**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 图片 ID |

同步删除 D1 记录和 R2 文件。

**响应：200 OK**

```json
{
  "success": true
}
```

---

## 后续待实现（TODO）

- [ ] aspect_ratio 支持更多比例（如 "16:9", "4:3"）
- [ ] 图片缩略图生成
- [ ] 前端图片管理页面
