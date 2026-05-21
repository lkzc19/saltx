# saltx — Claude 协作指南

## 语言要求

**所有交互（包括思考过程）一律使用中文。**

## 技术栈

- **框架**：SvelteKit 5（Runes 模式：`$state`、`$derived`、`$effect`、`$props`）
- **部署**：Cloudflare Workers + Pages
- **数据库**：Cloudflare D1（SQLite），通过 Drizzle ORM 查询
- **存储**：Cloudflare R2，前端通过 `/files/{file_key}` 访问
- **样式**：前台页面用手写 CSS（`<style>` scoped），后台管理用 Tailwind CSS

## 数据库

使用 Cloudflare D1，通过 wrangler 管理迁移（不使用 drizzle-kit push/generate）：

```bash
# 本地迁移
npx wrangler d1 execute saltx --local --file=migrations/xxx.sql

# 远程迁移
npx wrangler d1 execute saltx --remote --file=migrations/xxx.sql

# 查看数据
npx wrangler d1 execute saltx --local --command="SELECT * FROM table LIMIT 10"
```

迁移文件放在 `migrations/` 目录，按 `001_xxx.sql` 顺序命名。

## 文件存储（R2）规则

| 类型 | R2 路径 | 访问 URL |
|------|---------|---------|
| 音乐文件 | `music/{id}.{ext}` | `/files/music/{id}.{ext}` |
| 图片文件 | `image/{id}.{ext}` | `/files/image/{id}.{ext}` |

- `image.file_key` 存完整 R2 路径（如 `image/abc123.webp`）
- `music.cover_file_key` 存 `image.file_key` 的值
- 前端直接用 `/files/{file_key}` 访问，不需要额外拼接

## 代码检查

```bash
npm run check   # 类型检查（.svelte-kit/ 目录下的报错是框架产物，忽略）
npm run dev     # 本地开发
npm run build   # 构建
```
