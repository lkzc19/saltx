# Cloudflare 本地开发配置指南 (R2 + D1)

## 前置条件

- 已安装 `wrangler` (devDependency 已包含)
- 已注册 Cloudflare 账号
- 已创建 D1 数据库和 R2 存储桶（用于生产部署时使用）

---

## wrangler.jsonc 配置说明

```jsonc
{
  // D1 数据库绑定
  "d1_databases": [
    {
      "binding": "DB",                    // 代码中通过 platform.env.DB 访问
      "database_name": "saltx-db",        // D1 控制台中创建的数据库名称
      "database_id": "<your-d1-database-id>"  // D1 控制台中获取的 Database ID
    }
  ],

  // R2 存储桶绑定
  "r2_buckets": [
    {
      "binding": "BUCKET",               // 代码中通过 platform.env.BUCKET 访问
      "bucket_name": "saltx-bucket",     // 生产环境存储桶名称
      "preview_bucket_name": "saltx-bucket-preview"  // 本地开发预览存储桶名称
    }
  ]
}
```

**本地模式说明：**
- **D1**：`wrangler dev` 时会自动使用本地 SQLite 文件，路径在 `.wrangler/state/v3/d1/<binding>/`
- **R2**：`wrangler dev` 时会自动使用本地文件系统模拟，路径在 `.wrangler/state/v3/r2/<binding>/`
- 无需 `preview_id`（wrangler v4 已移除此字段），本地开发自动隔离数据

---

## 获取 Cloudflare 凭证

### 1. 获取 Account ID

```
Cloudflare Dashboard → 右侧栏 → Account ID
```

### 2. 获取 D1 Database ID

```
Cloudflare Dashboard → D1 → 选择数据库 → 复制 Database ID
```

### 3. 获取 API Token

```
Cloudflare Dashboard → My Profile → API Tokens → Create Token
→ 使用 "Edit Cloudflare Workers" 模板
→ 确保包含 Account.D1 和 Account.Workers R2 Storage 权限
```

---

## .env 环境变量

`.env` 文件用于 `drizzle-kit push/generate/migrate` 远程操作：

```bash
# Cloudflare D1 (远程推送 schema 时需要)
CLOUDFLARE_ACCOUNT_ID="your-account-id"
CLOUDFLARE_DATABASE_ID="your-database-id"
CLOUDFLARE_D1_TOKEN="your-api-token"
```

> **注意：** 本地开发 (`wrangler dev`) 不需要这些环境变量，D1/R2 绑定由 wrangler 自动处理。

---

## 本地开发命令

### 启动本地开发服务器

```bash
npm run dev
```

wrangler 会自动：
- 在 `.wrangler/state/v3/d1/` 创建本地 D1 SQLite 文件
- 在 `.wrangler/state/v3/r2/` 创建本地 R2 文件存储目录

### 推送数据库 schema 到本地 D1

```bash
npm run db:push
```

### 生成数据库迁移文件

```bash
npm run db:generate
```

### 生成 wrangler 类型定义

```bash
npm run gen
```

这会生成 `worker-configuration.d.ts`，包含 `Env` 接口中 `DB` 和 `BUCKET` 的类型。

---

## 代码中使用 D1 和 R2

### D1 数据库（已有封装）

```typescript
// src/lib/server/db/index.ts
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export const getDb = (d1: D1Database) => drizzle(d1, { schema });
```

在 SvelteKit 路由中使用：

```typescript
// src/routes/+page.server.ts
import { getDb } from '$lib/server/db';

export const load = async ({ platform }) => {
  const d1 = platform!.env.DB;
  const db = getDb(d1);
  const tasks = await db.select().from(schema.task);
  return { tasks };
};
```

### R2 存储桶

```typescript
// 上传文件
const r2 = platform!.env.BUCKET;
await r2.put('path/to/file.txt', fileContent);

// 获取文件
const object = await r2.get('path/to/file.txt');
const text = await object!.text();

// 列出文件
const list = await r2.list({ prefix: 'path/to/' });

// 删除文件
await r2.delete('path/to/file.txt');
```

---

## 本地开发 vs 生产部署

| 功能 | 本地 (`wrangler dev`) | 生产 (`wrangler deploy`) |
|------|----------------------|------------------------|
| D1 | `.wrangler/state/v3/d1/` 本地 SQLite | Cloudflare D1 云端数据库 |
| R2 | `.wrangler/state/v3/r2/` 本地文件系统 | Cloudflare R2 云端存储 |
| 数据隔离 | 每次 `wrangler restart` 清空 | 持久化 |

---

## 常见问题

### Q: 本地开发数据不持久怎么办？

本地开发数据存储在 `.wrangler/state/v3/` 下，wrangler restart 后会清空。如需持久化，将 schema 推送到远程 D1：

```bash
# 设置 .env 后执行
npm run db:push
```

### Q: drizzle-kit push 报错？

确保 `.env` 中 `CLOUDFLARE_ACCOUNT_ID`、`CLOUDFLARE_DATABASE_ID`、`CLOUDFLARE_D1_TOKEN` 已正确填写。

### Q: R2 本地存储目录在哪里？

在 `.wrangler/state/v3/r2/` 下，目录结构与 `binding` 名称一致（如 `BUCKET`）。
