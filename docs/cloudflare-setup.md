# Cloudflare 配置指南

## 资源清单

| 资源 | 名称 | 用途 |
|------|------|------|
| Workers | saltx | SvelteKit 全栈应用 |
| D1 数据库 | saltx | 元数据存储（music、image 表） |
| R2 存储桶 | saltx | 音乐文件、图片 |
| 域名 | saltx.fun | 自定义域名（Custom Domain） |

---

## wrangler.jsonc 关键配置

```jsonc
{
  "name": "saltx",
  "compatibility_date": "2026-05-02",
  "compatibility_flags": ["nodejs_als"],

  "d1_databases": [
    {
      "binding": "DB",           // 代码中 platform.env.DB
      "database_name": "saltx",
      "database_id": "cde17f3d-053a-48cc-9731-ad3a532e1cc1"
    }
  ],
  "r2_buckets": [
    {
      "binding": "BUCKET",       // 代码中 platform.env.BUCKET
      "bucket_name": "saltx"
    }
  ],

  "routes": [
    { "pattern": "saltx.fun", "custom_domain": true }
  ]
}
```

**本地开发说明：**
- D1：`wrangler dev` 自动使用 `.wrangler/state/v3/d1/` 下的本地 SQLite
- R2：自动使用 `.wrangler/state/v3/r2/` 下的本地文件系统模拟

---

## 本地开发

```bash
# 安装依赖
npm install

# 启动（先 build 再 wrangler dev）
npm run dev

# 生成 wrangler 类型定义（修改 wrangler.jsonc 后执行）
npm run gen
```

### 初始化本地数据库

```bash
# 初始化本地数据库
npx wrangler d1 execute saltx --local --file=migrations/001_initial.sql
```

---

## 远程数据库迁移

```bash
# 登录（Token 过期时执行）
npx wrangler login

# 初始化远程数据库
npx wrangler d1 execute saltx --remote --file=migrations/001_initial.sql
```

> 当前迁移目录已重置为单份初始化脚本。后续如再调整表结构，再新增新的迁移文件。

---

## 部署

```bash
npm run build
npx wrangler deploy
```

---

## 获取 Cloudflare 凭证

### Account ID
```
Cloudflare Dashboard → 右侧栏 → Account ID
```

### D1 Database ID
```
Cloudflare Dashboard → D1 → 选择数据库 → Database ID
```

### API Token（drizzle-kit 远程操作时使用）
```
My Profile → API Tokens → Create Token
→ 模板：Edit Cloudflare Workers
→ 确保包含 D1 Write 和 R2 Write 权限
```

---

## .env（drizzle-kit 使用）

```bash
CLOUDFLARE_ACCOUNT_ID="your-account-id"
CLOUDFLARE_DATABASE_ID="cde17f3d-053a-48cc-9731-ad3a532e1cc1"
CLOUDFLARE_D1_TOKEN="your-api-token"
```

> 仅 `drizzle-kit push/generate/migrate` 等 schema 操作时需要，`wrangler dev/deploy` 不需要。

---

## Cloudflare Access（后台鉴权，待配置）

后台路由 `/admin/*` 和 `/api/admin/*` 将通过 Cloudflare Access 保护：

```
Cloudflare Dashboard → Access → Applications → Add Application
→ Self-hosted
→ Domain: saltx.fun, Path: /admin
→ Policy: 邮箱白名单 / One-time PIN
```

API 路由单独配置或在 Worker 层做 JWT 验证。

---

## 健康检查

```
GET /api/ping
```

检查 D1 和 R2 连通性，返回：

```json
{
  "status": "ok",
  "d1": { "status": "ok" },
  "r2": { "status": "ok" }
}
```
