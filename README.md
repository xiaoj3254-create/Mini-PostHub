# Mini PostHub 📮

轻量全栈 UGC 投稿审核展示平台。核心闭环：**内容投稿 → 审核 → 公开展示 → 用户互动 → 后台治理**。

## 技术栈

| 端 | 技术 |
| --- | --- |
| 前端 | Vue 3 + TypeScript + Vite + Pinia + Vue Router + TailwindCSS 4 |
| 后端 | Express 5 + TypeScript + Drizzle ORM + mysql2 |
| 数据库 | MySQL 8.0 |
| 上传 | multer 本地存储 + Express 静态托管 |
| 鉴权 | JWT（7 天）+ bcryptjs |

## 项目结构

```
Mini PostHub/
├── server/              # Express 后端
│   ├── src/
│   │   ├── db/          # schema.ts 表定义 / seed.ts 种子数据 / init-db.ts 建库
│   │   ├── config/      # env.ts（zod 校验）/ db.ts（drizzle 客户端）
│   │   ├── middlewares/ # auth / error / upload
│   │   ├── modules/     # auth / category / post / comment / collect / admin
│   │   └── utils/       # jwt / 统一响应 / zod 校验
│   └── uploads/         # 上传图片（gitignore）
└── client/              # Vue 3 前端
    └── src/
        ├── api/         # axios 封装 + 领域 API
        ├── stores/      # Pinia（auth / toast）
        ├── router/      # 路由 + 登录/管理员守卫
        ├── components/  # 公共组件 + 业务组件
        └── views/       # 前台页面 + 后台页面
```

## 快速开始

### 1. 安装依赖

```bash
npm install --prefix server
npm install --prefix client
npm install   # 根目录（concurrently）
```

### 2. 配置数据库

1. 确认本地 MySQL 8.0 已启动
2. 复制 `server/.env.example` 为 `server/.env`，填写 `DB_PASSWORD`（root 密码）并修改 `JWT_SECRET`

### 3. 初始化数据库（建库 → 建表 → 种子数据）

```bash
npm --prefix server run db:create   # 创建数据库（drizzle-kit 不建库，需先手动建）
npm run db:push                     # drizzle-kit push 建表
npm run seed                        # 写入演示数据
```

### 4. 启动开发环境

```bash
npm run dev
```

- 前端：http://localhost:5173
- 后端：http://localhost:3000（`/api/health` 健康检查）
- Vite 代理 `/api` 与 `/uploads` → 3000

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
- 首页：分类筛选、关键词搜索、最新/最热排序、网格/列表视图、分页
- 作品详情：图文浏览、作者信息、浏览量自增、收藏、评论 + 二级回复、同分类相关推荐
- 账号：注册 / 登录 / 退出；个人中心（资料编辑、修改密码）
- 我的投稿：全部状态 Tab 管理，草稿/已驳回可编辑、重新提交、删除，查看驳回原因
- 我的收藏：取消收藏

### 后台（admin 登录）
- 仪表盘：用户/作品/评论/收藏/待审核等统计
- 作品审核：状态与分类筛选、通过、驳回（填原因）、下架/恢复、删除
- 分类管理：CRUD、排序、启停
- 用户管理：搜索、封禁/解封、设置/取消管理员（不可操作自己）
- 评论管理：搜索、删除

### 作品状态机

```
草稿(draft) --提交--> 待审核(pending) --通过--> 已发布(approved)
                              \--驳回(带原因)--> 已驳回(rejected) --编辑重提--> 待审核
```

- 仅 `draft` / `rejected` 可编辑、可重新提交；`pending` 不可编辑
- `approved` 可被管理员下架（前台隐藏），可恢复
- 公开列表只展示 `approved` 且未下架的作品

## 常用脚本

```bash
npm run dev               # 同时启动前后端
npm --prefix server run typecheck   # 后端类型检查
npm --prefix client run build       # 前端生产构建 + 类型检查
```

## API 约定

- 前缀 `/api`，统一响应 `{ code: 0|1, message, data }`
- 鉴权：`Authorization: Bearer <token>`
- 错误经全局 handler 统一返回，前台 axios 拦截器自动提示并处理 401 跳登录
