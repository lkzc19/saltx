# saltx — Claude 协作指南

## 语言要求

**所有交互（包括思考过程）一律使用中文。**

## 数据库

使用 Cloudflare D1，通过 wrangler 管理：

```bash
# 本地迁移
npx wrangler d1 execute saltx --local --file=migrations/xxx.sql

# 远程迁移
npx wrangler d1 execute saltx --remote --file=migrations/xxx.sql

# 查看数据
npx wrangler d1 execute saltx --local --command="SELECT * FROM table LIMIT 10"
```

