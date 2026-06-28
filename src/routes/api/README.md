# API 路由

## 归属约定

- `music/` — 前台 `(site)/music` 调用
- `ping/` — 公共：健康检查
- `admin/` — 后台 `(admin)` 调用，URL 自带 `/api/admin/`，鉴权由 `hooks.server.ts` 拦截 `/api/admin/*`
- `files/` — 公共：R2 文件代理，URL `/files/<path>`（由 `src/hooks.server.ts` 重写到 `/api/files/<path>`）

前台与公共 API 物理上在一级目录，靠本 README 标注归属。后台 API 因 URL 自带 `/admin/` 段，归属天然清晰。

## URL 重写规则（`src/hooks.server.ts`）

| 命中 | 改写为 | 命中 endpoint |
|------|--------|----------------|
| `/files/<rest>` | `/api/files/<rest>` | `api/files/<rest>/+server.ts` |
