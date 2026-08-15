# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

轻量全栈 UGC 投稿审核展示平台。核心闭环：**内容投稿 → 审核 → 公开展示 → 用户互动 → 后台治理**。单仓双包：`server/`（Express 5 + Drizzle + mysql2）+ `client/`（Vue3 + Vite + Pinia + TailwindCSS 4）。

## 常用命令

```bash
# 安装（根 / server / client 三处各装一次）
npm install
npm --prefix server install
npm --prefix client install

# 开发（根目录 concurrently 同时起前后端；或分开跑）
npm run dev                        # server:3000 + client:5173
npm --prefix server run dev        # 仅后端（tsx watch）
npm --prefix client run dev        # 仅前端（vite，代理 /api 与 /uploads → 3000）

# 数据库：建库 → 建表 → 种子数据（按此顺序）
npm --prefix server run db:create  # 创建数据库（drizzle-kit 不建库）
npm run db:push                    # drizzle-kit push 建表
npm run seed                       # 写入演示数据

# 校验
npm --prefix server run typecheck  # 后端 tsc --noEmit
npm --prefix client run build      # 前端 vue-tsc -b + vite build
```

**没有测试框架**。端到端验证用 [server/smoke-verify.mjs](server/smoke-verify.mjs)（Node `fetch` 直连运行中的 server 打 API），需先启动 server 并已 seed。新增业务逻辑后可沿用该脚本追加断言。

## 架构

### 后端分层（每个 module 三个文件）

`*.routes.ts`（薄路由）→ `*.controller.ts`（zod 校验 + 调 service + `ok()`/`okPaginated()` 包装响应）→ `*.service.ts`（**全部业务逻辑与 Drizzle 查询**）。

- 所有 router 自带完整 `/api/...` 路径，在 [app.ts](server/src/app.ts) 用 `app.use('/api', xxxRouter)` 挂载；路由路径不含 `/api` 前缀。
- 控制器入参一律经 `parseBody`/`parseQuery`（zod），路由参数用 `Number(req.params.id)` + 整数校验。
- 业务错误抛 `HttpError`（`badRequest`/`unauthorized`/`forbidden`/`notFound`），[error.ts](server/src/middlewares/error.ts) 全局转为 `{ code: 1, message, data: null }` + 对应 HTTP 状态。
- **Server 是 ESM**（`"type": "module"`），TS 源码里的相对导入必须写 `.js` 后缀（如 `import { db } from '../config/db.js'`）。

### 数据库（Drizzle，[schema.ts](server/src/db/schema.ts)）

5 张表：`user` / `category` / `post` / `comment` / `collect`。枚举值见 schema 顶部导出的 `as const` 数组（`userRole`/`userStatus`/`postStatus`）。外键约束：

- `comment.postId`、`comment.parentId`（自引用）、`collect` 均为 **ON DELETE CASCADE**；`post.categoryId`、`comment.userId` 等为 NO ACTION（删除前需先检查引用）。
- `post` 冗余了三个反规范化计数：`viewCount` / `favoriteCount` / `commentCount`，在 service 层维护（无触发器）。

### 计数维护的既有模式（改动时务必遵守）

- **浏览量**：`sql\`${postTable.viewCount} + 1\`` 原子自增，返回展示值用读到的计数 +1。
- **收藏**：`addCollect` 用「先查后插 + try/catch 吞 `ER_DUP_ENTRY`（errno 1062）」保证幂等；`removeCollect` 仅当 `affectedRows > 0` 才递减。**不要用 `onDuplicateKeyUpdate` + `affectedRows === 1` 判断插入**——已实测该值受驱动 flag 影响不可靠，重复 add 仍会误判并多计数。
- **评论删除**：MySQL DELETE 的 `affectedRows` **不含** FK 级联删除的后代行。删除评论必须先经 [commentSubtree.ts](server/src/utils/commentSubtree.ts) 的递归 CTE 统计整棵子树，再按子树数递减 `commentCount`。
- 计数递减一律用 `GREATEST(col - n, 0)` 防下溢。
- **LIKE 搜索**：`%`/`_`/`\` 必须经 [like.ts](server/src/utils/like.ts) 的 `escapeLike` 转义。

### 鉴权与响应约定

- `requireAuth` 从 `Authorization: Bearer` 取 JWT 并查库（封禁用户被拒）；`requireAdmin` **必须排在 `requireAuth` 之后**（它读 `req.user`）；`optionalAuth` 有 token 就填 `req.user`，无效 token 不报错。
- 统一响应 `{ code: 0|1, message, data }`。**前端 axios 响应拦截器已解包**：`httpGet/httpPost/...` 直接 resolve 出 `data` 字段，类型经泛型断言，401 自动清登录态并跳 `/login`。

### 作品状态机

`draft --提交--> pending --通过--> approved`；`pending --驳回(带原因)--> rejected --编辑重提--> pending`。仅 `draft`/`rejected` 可编辑/重提；公开列表只展示 `approved` 且未下架（`isOffShelf=false`）；详情页非公开作品仅 owner/admin 可见。

### 上传（multer）

存储扩展名由服务端按 MIME 决定（`MIME_EXT` 映射），不信任客户端文件名；**禁止 SVG**（存储型 XSS 风险）。文件大小上限 5MB。图片经 `/uploads` 静态托管，Vite 已代理。

### 前端要点

- 路由守卫见 [router/index.ts](client/src/router/index.ts)：`meta.requiresAuth` / `meta.requiresAdmin` / `meta.guestOnly`。
- 详情页组件复用同一实例时（如相关推荐跳转），需 `watch(() => route.params.id, load)` 重新加载，不能只 `onMounted`。
- 图片统一用 `SmartImage`（懒加载 + 加载失败回退分类渐变占位），分类风格映射在 [categoryStyle.ts](client/src/utils/categoryStyle.ts)。

## 环境注意事项

- **本地 MySQL 端口是 3307**（非默认 3306）。`server/.env`（已 gitignore）里 `DB_PORT=3307`、`JWT_SECRET=mini_posthub_dev_secret_change_me`；`.env.example` 里仍是 3306，仅供模板参考。
- `JWT_SECRET` 在 [env.ts](server/src/config/env.ts) 里是 **zod 必填**（无默认值），未配置启动即失败——这是安全要求，不要给回退默认值。
- Windows 环境：杀进程用 `netstat -ano | grep :PORT` + `taskkill //F //PID <pid>`（bash 下双斜杠）。
