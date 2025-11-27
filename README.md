# PocketBase Nuxt 认证示例

这是一个基于 Nuxt 4 和 PocketBase 构建的认证示例项目，展示了如何实现用户登录、注册以及头像上传和删除功能。

## 核心功能

- ✅ 用户登录/注册
- ✅ 安全退出
- ✅ 头像上传（自动删除旧头像）
- ✅ 头像删除
- ✅ 详细的错误处理
- ✅ 响应式设计

## 技术栈

- **前端框架**: Nuxt 4
- **后端服务**: PocketBase
- **UI 组件**: Nuxt UI
- **语言**: Vue, TypeScript

## 项目结构

```
app/
├── components/
│   └── AvatarManager.vue      # 头像管理组件
├── composables/
│   ├── useAuth.ts             # 认证功能
│   ├── useAvatar.ts           # 头像管理功能
│   └── usePocketbase.ts       # PocketBase
├── pages/
│   └── index.vue              # 主页面
└── plugins/
    └── pocketbase.ts          # PocketBase 插件
```

## 安装和运行

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm run dev
```

应用将在 `http://localhost:3000` 启动。

### 构建生产版本

```bash
pnpm run build
```

## 功能说明

### 认证功能

- 使用邮箱和密码进行登录和注册
- 自动处理认证状态
- 提供详细的错误信息

### 头像管理

- 支持上传用户头像
- 自动删除旧头像
- 支持删除现有头像
- 实时预览头像

## 使用说明

1. 打开应用，您将看到登录和注册表单
2. 注册一个新账号或使用现有账号登录
3. 登录后，您可以上传、预览和删除您的头像
4. 点击"安全退出"按钮退出登录

## 注意事项

- 确保您的 PocketBase API 服务已正确配置
- 头像上传功能需要正确配置 PocketBase 的文件存储设置
- 所有 API 请求都通过 PocketBase 进行处理

## 许可证

MIT