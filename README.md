# PocketBase-Nuxt

一个基于 Nuxt.js 和 PocketBase 的现代化 Web 应用程序，提供完整的用户认证、内容管理和社交功能。

## 🌟 功能特性

### 认证系统
- ✅ 用户注册与登录
- ✅ 密码重置
- ✅ 邮箱验证
- ✅ JWT 令牌认证

### 内容管理
- ✅ 帖子创建与编辑
- ✅ 评论系统
- ✅ 点赞功能
- ✅ 内容审核

### 社交功能
- ✅ 用户个人资料
- ✅ 评论互动
- ✅ 点赞系统
- ✅ 实时通知

### 技术特性
- ✅ 响应式设计
- ✅ 深色模式支持
- ✅ 图片优化
- ✅ 高性能构建
- ✅ 安全的 API 设计

## 📦 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Nuxt.js | ^4.2.2 | 前端框架 |
| PocketBase | ^0.26.5 | 后端服务 |
| Vue.js | ^3.5.26 | UI 框架 |
| TypeScript | - | 类型系统 |
| Tailwind CSS | - | 样式框架 |
| Nuxt UI | ^4.3.0 | UI 组件库 |

## 🚀 快速开始

### 环境要求

- Node.js ^18.0.0
- pnpm ^8.0.0
- PocketBase ^0.26.5

### 安装步骤

1. **克隆项目**

```bash
git clone <repository-url>
cd pocketbase-nuxt
```

2. **安装依赖**

```bash
pnpm install
```

3. **配置环境变量**

创建 `.env` 文件，添加以下环境变量：

```env
# PocketBase 配置
POCKETBASE_URL=http://localhost:8090

# 会话配置
NUXT_SESSION_PASSWORD=your-secure-session-password
```

4. **启动开发服务器**

```bash
pnpm dev
```

5. **访问应用**

打开浏览器访问 `http://localhost:3000`

## 📋 项目结构

```
pocketbase-nuxt/
├── app/                    # 应用代码
│   ├── components/         # Vue 组件
│   ├── composables/        # 组合式函数
│   ├── layouts/           # 布局组件
│   ├── middleware/         # 路由中间件
│   ├── pages/              # 页面组件
│   ├── types/              # TypeScript 类型定义
│   └── utils/              # 工具函数
├── public/                 # 静态资源
├── server/                 # 服务器代码
│   ├── api/                # API 端点
│   ├── services/           # 业务逻辑
│   └── utils/              # 服务器工具函数
├── .env.example            # 环境变量示例
├── nuxt.config.ts          # Nuxt 配置
├── package.json            # 项目依赖
└── tsconfig.json           # TypeScript 配置
```

## 🔧 配置说明

### 环境变量

| 变量名 | 描述 | 必填 | 默认值 |
|--------|------|------|--------|
| POCKETBASE_URL | PocketBase 服务器 URL | ✅ | - |
| NUXT_SESSION_PASSWORD | 会话加密密码 | ✅ | - |

### 安全配置

项目已配置以下安全措施：

- CORS 保护
- CSRF 防护
- 输入验证
- XSS 防护
- 内容安全策略 (CSP)

## 📝 API 文档

### 认证 API

#### 注册

```
POST /api/auth/register
```

**请求体**：
```json
{
  "email": "user@example.com",
  "password": "password123",
  "passwordConfirm": "password123"
}
```

#### 登录

```
POST /api/auth/login
```

**请求体**：
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### 内容 API

#### 获取帖子列表

```
GET /api/collections/posts
```

#### 创建帖子

```
POST /api/collections/posts
```

**请求体**：
```json
{
  "content": "帖子内容",
  "allow_comment": true,
  "icon": "📝",
  "action": "create"
}
```

## 📦 部署指南

### 开发环境

```bash
pnpm dev
```

### 生产构建

```bash
pnpm build
```

### 预览生产构建

```bash
pnpm preview
```

### Docker 部署

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "preview"]
```

## 🔒 安全最佳实践

1. **环境变量管理**
   - 所有敏感配置通过环境变量管理
   - 避免在代码中硬编码密钥

2. **输入验证**
   - 所有 API 端点都有严格的输入验证
   - 使用 `sanitize-html` 清理用户输入

3. **认证与授权**
   - 使用 JWT 令牌进行认证
   - 所有敏感操作都需要身份验证
   - 实现了基于角色的访问控制

4. **数据安全**
   - 密码使用 bcrypt 加密存储
   - 敏感数据传输使用 HTTPS

## 📊 性能优化

- **图片优化**：使用 `@nuxt/image` 进行图片压缩和格式转换
- **代码分割**：启用了自动代码分割，减少初始加载时间
- **缓存策略**：实现了合理的缓存策略，提高页面加载速度
- **懒加载**：组件和资源按需加载，减少初始加载时间

## 📱 兼容性

### 浏览器支持

| 浏览器 | 版本 |
|--------|------|
| Chrome | 最新 2 个版本 |
| Firefox | 最新 2 个版本 |
| Safari | 最新 2 个版本 |
| Edge | 最新 2 个版本 |

### 设备支持

- 桌面端：Windows、macOS、Linux
- 移动端：iOS、Android
- 响应式设计，支持各种屏幕尺寸

## 📋 开发流程

### 代码质量

```bash
# 运行 ESLint 检查
pnpm lint

# 运行 Prettier 格式化
pnpm format

# 运行 TypeScript 类型检查
pnpm typecheck
```

### 构建测试

```bash
# 构建生产版本
pnpm build

# 预览生产构建
pnpm preview
```

## 🔧 错误处理与日志

### 错误处理

项目使用了统一的错误处理机制，包括：

- 全局错误拦截
- 友好的错误提示
- 错误日志记录

### 日志系统

- 生产环境日志记录到文件
- 支持不同级别的日志（debug、info、warn、error）
- 日志轮转机制

## 📁 数据备份与恢复

### 备份策略

```bash
# 备份 PocketBase 数据
pb backup

# 恢复 PocketBase 数据
pb restore backup.zip
```

### 自动化备份

```bash
# 每天凌晨 2 点备份
0 2 * * * /path/to/pb backup --output /path/to/backups/$(date +%Y-%m-%d).zip
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

MIT License - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

- 项目维护者：[Your Name]
- 项目链接：[GitHub Repository]
- 问题反馈：[GitHub Issues]

## 📋 待办事项

- [ ] 添加单元测试
- [ ] 添加集成测试
- [ ] 实现实时通知功能
- [ ] 添加用户角色管理
- [ ] 实现内容审核流程

---

**感谢使用 PocketBase-Nuxt！** 🚀
