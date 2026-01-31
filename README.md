# PocketBase‑Nuxt

PocketBase‑Nuxt 是一个示例/生产就绪的全栈 Web 应用，结合 Nuxt 4 前端与 PocketBase 后端（BaaS），实现实时同步、Markdown 编辑、用户认证与内容管理。PocketBase‑Nuxt is a full‑stack web application combining a Nuxt 4 frontend with a PocketBase backend (BaaS). It demonstrates authentication, real‑time sync, Markdown editing, and content management.

[![zread](https://img.shields.io/badge/Ask_Zread-_.svg?style=for-the-badge&color=00b0aa&labelColor=000000&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQuOTYxNTYgMS42MDAxSDIuMjQxNTZDMS44ODgxIDEuNjAwMSAxLjYwMTU2IDEuODg2NjQgMS42MDE1NiAyLjI0MDFWNC45NjAxQzEuNjAxNTYgNS4zMTM1NiAxLjg4ODEgNS42MDAxIDIuMjQxNTYgNS42MDAxSDQuOTYxNTZDNS4zMTUwMiA1LjYwMDEgNS42MDE1NiA1LjMxMzU2IDUuNjAxNTYgNC45NjAxVjIuMjQwMUM1LjYwMTU2IDEuODg2NjQgNS4zMTUwMiAxLjYwMDEgNC45NjE1NiAxLjYwMDFaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik00Ljk2MTU2IDEwLjM5OTlIMi4yNDE1NkMxLjg4ODEgMTAuMzk5OSAxLjYwMTU2IDEwLjY4NjQgMS42MDE1NiAxMS4wMzk5VjEzLjc1OTlDMS42MDE1NiAxNC4xMTM0IDEuODg4MSAxNC4zOTk5IDIuMjQxNTYgMTQuMzk5OUg0Ljk2MTU2QzUuMzE1MDIgMTQuMzk5OSA1LjYwMTU2IDE0LjExMzQgNS42MDE1NiAxMy43NTk5VjExLjAzOTlDNS42MDE1NiAxMC42ODY0IDUuMzE1MDIgMTAuMzk5OSA0Ljk2MTU2IDEwLjM5OTlaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik0xMy43NTg0IDEuNjAwMUgxMS4wMzg0QzEwLjY4NSAxLjYwMDEgMTAuMzk4NCAxLjg4NjY0IDEwLjM5ODQgMi4yNDAxVjQuOTYwMUMxMC4zOTg0IDUuMzEzNTYgMTAuNjg1IDUuNjAwMSAxMS4wMzg0IDUuNjAwMUgxMy43NTg0QzE0LjExMTkgNS42MDAxIDE0LjM5ODQgNS4zMTM1NiAxNC4zOTg0IDQuOTYwMVYyLjI0MDFDMTQuMzk4NCAxLjg4NjY0IDE0LjExMTkgMS42MDAxIDEzLjc1ODQgMS42MDAxWiIgZmlsbD0iI2ZmZiIvPgo8cGF0aCBkPSJNNCAxMkwxMiA0TDQgMTJaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik00IDEyTDEyIDQiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4K&logoColor=ffffff)](https://zread.ai/supebase/pocketbase-nuxt)

---

## 目录 / Table of Contents

- 快速开始 / Quickstart
- 功能一览 / Features
- 技术栈 / Tech Stack
- 环境变量 / Environment
- 运行 & 构建 / Run & Build
- 项目结构与关键文件 / Project layout & Key files
- 实时同步（SSE/Partykit） / Real-time (SSE / Partykit)
- 部署建议 / Deployment
- 开发者工具 / Development tools
- 常见问题 / Troubleshooting
- 贡献 / Contributing

---

## 快速开始 / Quickstart

先决条件 / Prerequisites:

- Node.js (推荐 LTS) / Node.js (LTS recommended)
- pnpm（package.json 指定 pnpm）/ pnpm (package.json uses pnpm)
- 本地或远程 PocketBase 实例（可在本地运行 pocketbase）/ A local or remote PocketBase instance

快速运行：

1. 克隆仓库 / Clone:

```bash
git clone https://github.com/supebase/pocketbase-nuxt.git
cd pocketbase-nuxt
```

2. 安装依赖 / Install dependencies:

```bash
pnpm install
```

(如果你使用 npm 或 yarn，请相应替换命令，但推荐 pnpm)

3. 配置环境 / Configure env: 复制 env.example 为 .env 并根据需要设置（详见下一节）：

```bash
cp env.example .env
# 编辑 .env，设置 POCKETBASE_URL、BASE_URL 等
```

4. 本地开发 / Start dev server:

```bash
pnpm dev
# package.json 的 dev 脚本已经包含 --host=0.0.0.0
```

构建并预览：

```bash
pnpm build
pnpm preview
```

---

## 功能一览 / Features

- 用户注册 / 登录、会话管理 / User registration/login and session management
- 带 Markdown 编辑器（TipTap 扩展）与图片自动抓取 / Markdown editor (TipTap) with remote image handling
- 内容的发布/草稿与 CRUD 操作 / Post CRUD with published/draft statuses
- 实时同步（SSE / Partysocket）跨客户端更新 / Real‑time sync via SSE / Partysocket
- 评论、点赞、通知系统 / Comments, likes and notifications
- 使用 TypeScript 和自动生成的 PocketBase types / TypeScript with typed PocketBase collection types

---

## 技术栈 / Tech Stack

- 前端：Nuxt 4、Vue 3、TypeScript、Tailwind CSS
- 后端：PocketBase（通过 server 目录封装逻辑/路由）
- 实时：SSE、partykit / partysocket
- 工具：pnpm、PM2（部署示例）、ESLint、Prettier

主要依赖（摘录 package.json）：nuxt, pocketbase, partysocket, partykit, tailwindcss, tiptap 等。

---

## 环境变量 / Environment

仓库根目录包含 `env.example`，请复制为 `.env` 并填写必要的值（示例）：

- POCKETBASE_URL — PocketBase 服务地址（例如 http://localhost:8090）
- BASE_URL — 应用的基本 URL（用于生成前端引用）
- 其他与邮箱、管理员帐号、第三方服务相关的配置请参见 `env.example`

注意：不同部署环境可能需要额外的配置（反向代理、HTTPS 等）。

---

## 运行 & 构建 / Run & Build

常用脚本（package.json）:

- pnpm dev — 本地开发
- pnpm build — 生产构建
- pnpm preview — 启动生产预览
- pnpm lint — ESLint 自动修复
- pnpm format — Prettier 格式化
- pnpm typecheck — TypeScript 类型检查

示例：

```bash
pnpm install
pnpm dev
# 或者构建
pnpm build
pnpm preview
```

---

## 项目结构与关键文件 / Project layout & Key files

仓库内重要目录（摘录）:

- app/ — Nuxt 前端源码（components, pages, composables, utils）
  - app/components — 可重用 UI 组件（编辑器、评论、帖子等）
  - app/composables — 领域特定的组合函数（useAuth, usePosts, useComments）
  - app/utils — 编辑器配置、Markdown 同步、图像处理等
- server/ — 自定义后端路由与服务（结合 PocketBase）
  - server/api — HTTP 路由（posts, comments, likes, notifications, realtime 等）
  - server/services — 将业务逻辑封装为可复用服务
  - server/utils — 辅助工具（graph-scraper, markdown-sync, pocketbase helper 等）
- partykit.json & partykit/server.ts — Partykit 配置与服务
- ecosystem.config.js — PM2 部署示例
- nuxt.config.ts — Nuxt 配置

查看这些目录可以快速定位功能实现点（例如：实时逻辑在 server/api/realtime.get.ts 与 partykit/server.ts）。

---

## 实时同步（SSE/Partykit） / Real-time (SSE / Partykit)

- 项目使用 SSE（Server‑Sent Events）与 Partykit/partysocket 来实现跨客户端的实时更新。
- 包含连接保活（心跳）与指数退避的重连策略（例如 1s, 2s, 4s, 8s, 16s, 最大 30s）。
- 清理机制覆盖客户端断开、服务器断连与应用关闭，避免孤立连接/内存泄漏。

若要查看或调整行为，请检查：

- server/api/realtime.get.ts
- partykit/server.ts
- partysocket 使用处（app/composables/usePocketRealtime.ts 或类似）

---

## 部署建议 / Deployment

小型部署示例（PM2）:

- 使用已有的 ecosystem.config.js：

```bash
# 生产构建并使用 pm2 启动
pnpm build
pm2 start ecosystem.config.js --env production
```

使用 Partykit：

- Partykit 可用于托管服务的轻量发行版，参见 partykit.json 与 partykit/server.ts。

容器化：

- 项目没有附带官方 Dockerfile；如果需要，请基于 Node LTS 镜像创建 Dockerfile，并确保在容器运行 PocketBase 或连接到远程 PocketBase。

静态资源/反向代理：

- 推荐通过 Nginx / CDN 做静态资源缓存与 HTTPS 终端。

---

## 开发者工具 / Development tools

- 格式化：pnpm format（Prettier）
- Lint：pnpm lint（ESLint）
- 类型检查：pnpm typecheck（npx tsc --noEmit）
- IDE：推荐 VSCode + Volar/TypeScript 支持

---

## 常见问题 / Troubleshooting

- PocketBase 连接问题：确认 POCKETBASE_URL 设置，检查 CORS 与反向代理配置。
- 图片抓取失败：服务器可能没有写权限或远程资源拒绝访问（403）；查看 server/services/images.service.ts。
- 实时断连频繁：检查 SSE/endpoints、反向代理对长连接的支持（Nginx 需要配置 keepalive 和 proxy_read_timeout）。
- 构建后资源缺失：确认 build 完成且静态文件正确部署到生产服务。

---

## 贡献 / Contributing

欢迎贡献！常见流程：

1. Fork 仓库并新建分支
2. 按需添加/修改代码
3. 保持代码风格（pnpm format && pnpm lint）
4. 发送 Pull Request，描述改动与测试步骤

在 PR 中请尽量包含可复现的步骤和截图（如果界面有变化）。

---

## 其他 & 参考 / Misc & Reference

- 查看 server/services/ 和 app/composables/ 可快速找到业务逻辑与客户端状态管理实现。
- 如果项目将公开发布，建议添加明确 LICENSE 文件（例如 MIT）并补充 README 的部署示例与 API 文档。

如果你想，我可以：

- 帮你把 env.example 的字段提取成一节环境变量说明
- 添加部署到 Docker 的示例 Dockerfile
- 生成英文单独版 README（仅英文）

感谢使用 PocketBase‑Nuxt！如需中文或英文的更详细部署/架构图，我可以继续扩展。
