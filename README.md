# Mini PostHub 📮

轻量全栈 UGC 投稿审核展示平台。核心闭环：**内容投稿 → 审核 → 公开展示 → 用户互动 → 后台治理**。

单仓双包：`server/`（Express 5 + Drizzle ORM + mysql2）+ `client/`（Vue 3 + Vite + Pinia + TailwindCSS 4）。

## 技术栈

| 端 | 技术 |
| --- | --- |
| 前端 | Vue 3.5 + TypeScript + Vite 8 + Pinia 4 + Vue Router 4 + TailwindCSS 4 + axios |
| 后端 | Express 5 + TypeScript + Drizzle ORM 0.36 + mysql2 + zod + multer |
| 数据库 | MySQL 8.0 |
| 鉴权 | JWT（默认 7 天）+ bcryptjs |
| 上传 | multer 本地存储 + Express 静态托管（`/uploads`） |
| 构建 | tsc（后端）/ vue-tsc + vite build（前端）/ concurrently（同时起前后端） |

## 项目结构

```
Mini PostHub/
├── package.json             # 根：concurrently 同时启动前后端
├── CLAUDE.md                # Claude Code 协作约定
├── server/                  # Express 后端（ESM）
│   ├── src/
│   │   ├── app.ts           # createApp：cors / 静态 / 路由挂载 / 错误处理
│   │   ├── index.ts         # 入口 listen
│   │   ├── config/          # env.ts（zod 校验）/ db.ts（drizzle 客户端）
│   │   ├── db/              # schema.ts 表定义 / seed.ts 种子数据 / init-db.ts 建库
│   │   ├── middlewares/     # auth（require/optional/requireAdmin）/ error / upload
│   │   ├── modules/         # auth / category / post / comment / collect / admin
│   │   │                       每个 module 三件套：routes → controller → service
│   │   ├── types/           # express.d.ts 类型扩展
│   │   └── utils/           # jwt / response / http-error / validate / like / commentSubtree / user
│   ├── drizzle/             # drizzle-kit 迁移产物（push 模式，仅做记录）
│   ├── drizzle.config.ts    # drizzle-kit 配置
│   ├── uploads/             # 上传图片（gitignore）
│   ├── smoke-verify.mjs     # Node fetch 端到端冒烟测试（无框架）
│   ├── .env.example         # 环境变量模板
│   └── tsconfig.json
└── client/                  # Vue 3 前端
    ├── vite.config.ts       # Vite + TailwindCSS 插件 + 代理 /api /uploads → 3000
    └── src/
        ├── api/             # axios 封装（http.ts）+ 领域 API（auth/post/comment/collect/category/admin）
        ├── stores/          # Pinia（auth / toast）
        ├── router/          # 路由 + 登录/管理员守卫
        ├── components/
        │   ├── common/       # AppButton/Input/Textarea/Modal/Select、Avatar、Pagination、SmartImage 等
        │   ├── layout/      # Navbar / Footer / AdminLayout
        │   ├── post/        # PostCard / PostEditor / ImageUploader
        │   └── comment/     # CommentSection / CommentItem
        ├── views/
        │   ├── Home.vue / PostDetail.vue / PostEditor.vue
        │   ├── auth/        # Login / Register
        │   ├── profile/     # Profile / MyPosts / MyCollects
        │   └── admin/      # AdminDashboard / AdminPosts / AdminCategories / AdminUsers / AdminComments
        ├── utils/           # categoryStyle / format
        └── types/           # 前端共享类型
```

## 快速开始

### 1. 安装依赖

根 / server / client 三处各装一次：

```bash
npm install                    # 根目录（concurrently）
npm --prefix server install
npm --prefix client install
```

### 2. 配置数据库

1. 确认本地 MySQL 8.0 已启动
2. 复制 `server/.env.example` 为 `server/.env`，按需填写：

| 变量 | 默认 | 说明 |
| --- | --- | --- |
| `PORT` | `3000` | 后端监听端口 |
| `DB_HOST` | `localhost` | MySQL 主机 |
| `DB_PORT` | `3306` | MySQL 端口（本地示例为 3307，请按实际填） |
| `DB_USER` | `root` | 数据库账号 |
| `DB_PASSWORD` | — | 数据库密码（必填） |
| `DB_NAME` | `mini_posthub` | 数据库名 |
| `JWT_SECRET` | — | **必填**，缺省启动即失败（zod 校验，无回退默认值） |
| `JWT_EXPIRES_IN` | `7d` | token 有效期 |

### 3. 初始化数据库（建库 → 建表 → 种子数据，必须按此顺序）

```bash
npm --prefix server run db:create   # 创建数据库（drizzle-kit 不建库，需先建）
npm run db:push                     # drizzle-kit push 建表
npm run seed                        # 写入演示数据（用户/分类/作品/评论/收藏）
```

### 4. 启动开发环境

```bash
npm run dev
```

- 前端：http://localhost:5173
- 后端：http://localhost:3000（`/api/health` 健康检查）
- Vite 代理 `/api` 与 `/uploads` → 3000，前端无跨域问题

## 演示账号

| 账号 | 密码 | 角色 |
| --- | --- | --- |
| admin | admin123 | 管理员 |
| alice | alice123 | 普通用户 |
| bob | bob123 | 普通用户 |
| carol | carol123 | 普通用户 |
| dave | dave123 | 已封禁用户（用于演示封禁效果） |

种子数据包含 7 个分类（1 个停用）、10 篇覆盖全部状态（草稿/待审核/已发布/已驳回）的作品、评论与二级回复、收藏记录。

## 核心功能

### 前台

- **首页**：分类筛选、关键词搜索、最新/最热排序、网格/列表视图、分页
- **作品详情**：图文浏览、作者信息、浏览量自增、收藏、评论 + 二级回复、同分类相关推荐
- **账号**：注册 / 登录 / 退出；个人中心（资料编辑、修改密码）
- **我的投稿**：按状态 Tab 管理，`draft` / `rejected` 可编辑、重新提交、删除，查看驳回原因
- **我的收藏**：取消收藏

### 后台（需管理员登录）

- **仪表盘**：用户 / 作品 / 评论 / 收藏 / 待审核 等统计
- **作品审核**：状态与分类筛选、通过、驳回（填原因）、下架 / 恢复、删除
- **分类管理**：CRUD、排序、启停
- **用户管理**：搜索、封禁 / 解封、设置 / 取消管理员（不可操作自己）
- **评论管理**：搜索、删除

### 作品状态机

```
草稿(draft) --提交--> 待审核(pending) --通过--> 已发布(approved)
                              \--驳回(带原因)--> 已驳回(rejected) --编辑重提--> 待审核
```

- 仅 `draft` / `rejected` 可编辑、可重新提交；`pending` 不可编辑
- `approved` 可被管理员下架（前台隐藏），可恢复
- 公开列表只展示 `approved` 且未下架（`isOffShelf=false`）的作品
- 详情页非公开作品仅 owner / admin 可见

## 数据库表设计

5 张表，详见 [schema.ts](server/src/db/schema.ts)：

| 表 | 关键字段 | 说明 |
| --- | --- | --- |
| `user` | `role`(user/admin)、`status`(active/banned) | 用户与权限 |
| `category` | `sort`、`isEnabled` | 作品分类，可启停排序 |
| `post` | `status`(draft/pending/approved/rejected)、`isOffShelf`、`viewCount` / `favoriteCount` / `commentCount` | 作品主表，三个反规范化计数在 service 层维护 |
| `comment` | `parentId`（自引用） | 评论 + 二级回复；`postId`/`parentId` 均 `ON DELETE CASCADE` |
| `collect` | `(userId, postId)` 唯一索引 | 用户收藏 |

计数维护约定（修改时务必遵守）：

- 浏览量用 `sql\`${postTable.viewCount} + 1\`` 原子自增
- 收藏 `addCollect` 用「先查后插 + try/catch 吞 `ER_DUP_ENTRY`」保证幂等；`removeCollect` 仅当 `affectedRows > 0` 才递减
- 删除评论先经 [commentSubtree.ts](server/src/utils/commentSubtree.ts) 递归 CTE 统计整棵子树，再按子树数递减 `commentCount`（MySQL `affectedRows` 不含级联后代）
- 计数递减一律 `GREATEST(col - n, 0)` 防下溢
- LIKE 搜索的 `%`/`_`/`\` 必须经 [like.ts](server/src/utils/like.ts) 的 `escapeLike` 转义

## API 约定

- 前缀 `/api`，统一响应 `{ code: 0|1, message, data }`（`code: 0` 成功）
- 鉴权：`Authorization: Bearer <token>`；封禁用户被拒
- 错误经全局 handler 统一返回，前台 axios 响应拦截器自动解包 `data`，401 自动清登录态并跳 `/login`
- 路由参数 `:id` 在 controller 用 `Number(req.params.id)` + 整数校验

### 主要接口一览

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | — | 注册 |
| `POST` | `/api/auth/login` | — | 登录，返回 JWT |
| `GET` | `/api/auth/me` | user | 当前用户信息 |
| `PUT` | `/api/auth/profile` | user | 编辑资料 |
| `PUT` | `/api/auth/password` | user | 修改密码 |
| `GET` | `/api/categories` | — | 启用中的分类列表 |
| `GET` | `/api/posts` | — | 公开作品列表（支持分类/关键词/排序/分页） |
| `GET` | `/api/posts/:id` | optional | 作品详情（非公开仅 owner/admin 可见） |
| `GET` | `/api/me/posts` | user | 我的投稿（按状态过滤） |
| `POST` | `/api/posts` | user | 创建作品（草稿） |
| `PUT` | `/api/posts/:id` | user | 编辑作品（仅 draft/rejected） |
| `POST` | `/api/posts/:id/submit` | user | 提交审核 |
| `DELETE` | `/api/posts/:id` | user | 删除作品 |
| `POST` | `/api/uploads` | user | 上传图片（multer，≤5MB，禁 SVG） |
| `GET` | `/api/posts/:postId/comments` | — | 评论列表（含二级回复） |
| `POST` | `/api/posts/:postId/comments` | user | 一级评论 |
| `POST` | `/api/comments/:commentId/reply` | user | 二级回复 |
| `DELETE` | `/api/comments/:id` | user | 删除评论（递归级联删除子树） |
| `GET` | `/api/me/collects` | user | 我的收藏 |
| `POST` | `/api/posts/:postId/collect` | user | 收藏（幂等） |
| `DELETE` | `/api/posts/:postId/collect` | user | 取消收藏（幂等） |
| `GET` | `/api/admin/stats` | admin | 仪表盘统计 |
| `GET` | `/api/admin/posts` | admin | 后台作品列表（多状态筛选） |
| `POST` | `/api/admin/posts/:id/approve` | admin | 审核通过 |
| `POST` | `/api/admin/posts/:id/reject` | admin | 驳回（带原因） |
| `POST` | `/api/admin/posts/:id/off-shelf` | admin | 下架 / 恢复 |
| `DELETE` | `/api/admin/posts/:id` | admin | 删除作品 |
| `GET` | `/api/admin/categories` | admin | 分类列表（含停用） |
| `POST` | `/api/admin/categories` | admin | 新建分类 |
| `PUT` | `/api/admin/categories/:id` | admin | 编辑分类 |
| `DELETE` | `/api/admin/categories/:id` | admin | 删除分类 |
| `GET` | `/api/admin/users` | admin | 用户列表 |
| `PUT` | `/api/admin/users/:id/status` | admin | 封禁 / 解封 |
| `PUT` | `/api/admin/users/:id/role` | admin | 设置 / 取消管理员 |
| `GET` | `/api/admin/comments` | admin | 评论列表 |
| `DELETE` | `/api/admin/comments/:id` | admin | 删除评论 |

## 常用脚本

```bash
npm run dev                          # 同时启动前后端（concurrently）
npm --prefix server run dev          # 仅后端（tsx watch）
npm --prefix client run dev          # 仅前端（vite）
npm --prefix server run db:create    # 创建数据库
npm run db:push                      # drizzle-kit push 建表
npm run seed                         # 写入种子数据
npm --prefix server run typecheck    # 后端 tsc --noEmit
npm --prefix client run build        # 前端 vue-tsc -b + vite build
npm --prefix server run build        # 后端 tsc → dist/
npm --prefix server run start        # 后端生产启动 node dist/index.js
```

## 测试

没有正式的测试框架。端到端冒烟验证使用 [smoke-verify.mjs](server/smoke-verify.mjs)：

- 直接用 Node `fetch` 调用运行中的 server
- 覆盖：收藏幂等、评论级联计数等关键计数维护逻辑
- 用法：先启动 server 并 seed，再 `node server/smoke-verify.mjs`

新增业务逻辑后，可沿用该脚本追加断言。

## 鉴权与响应约定

- `requireAuth` 从 `Authorization: Bearer` 取 JWT 并查库（封禁用户被拒）
- `requireAdmin` **必须排在 `requireAuth` 之后**（它读 `req.user`）
- `optionalAuth` 有 token 就填 `req.user`，无效 token 不报错
- 统一响应 `{ code: 0|1, message, data }`，前端 axios 响应拦截器已解包，`httpGet/httpPost/...` 直接 resolve `data`
- 业务错误抛 `HttpError`（`badRequest`/`unauthorized`/`forbidden`/`notFound`），全局 error handler 转为 `{ code: 1, message, data: null }` + 对应 HTTP 状态

## 上传（multer）

- 存储扩展名由服务端按 MIME 决定（`MIME_EXT` 映射），不信任客户端文件名
- **禁止 SVG**（存储型 XSS 风险）
- 文件大小上限 5MB
- 图片经 `/uploads` 静态托管，Vite 已代理

## 前端要点

- 路由守卫见 [router/index.ts](client/src/router/index.ts)：`meta.requiresAuth` / `meta.requiresAdmin` / `meta.guestOnly`
- 详情页复用同一实例时（如相关推荐跳转），需 `watch(() => route.params.id, load)` 重新加载
- 图片统一用 `SmartImage`（懒加载 + 加载失败回退分类渐变占位），分类风格映射在 [categoryStyle.ts](client/src/utils/categoryStyle.ts)

## 环境注意事项

- 本地 MySQL 端口示例为 3307（非默认 3306），按实际填入 `server/.env`
- `JWT_SECRET` 是 **zod 必填**（无默认值），未配置启动即失败 —— 安全要求，不要给回退默认值
- Windows 杀进程：`netstat -ano | findstr :PORT` + `taskkill //F //PID <pid>`
- 后端为 ESM（`"type": "module"`），TS 源码里相对导入必须写 `.js` 后缀（如 `'../config/db.js'`）

## License

私有项目，未开源。
