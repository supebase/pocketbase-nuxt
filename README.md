# PocketBase Nuxt 全栈应用

这是一个基于 Nuxt 4 和 PocketBase 构建的全栈应用，包含用户认证、头像管理、帖子管理和评论功能。

## 核心功能

- ✅ 用户认证（登录/注册/退出）
- ✅ 邮箱验证
- ✅ 头像管理（上传/删除/自动替换）
- ✅ 帖子管理（创建/编辑/查看/列表）
- ✅ 评论功能（发表/查看）
- ✅ 用户资料
- ✅ 响应式设计
- ✅ 详细的错误处理
- ✅ 实时日期显示

## 技术栈

- **前端框架**: Nuxt 4
- **后端服务**: PocketBase
- **UI 组件**: Nuxt UI
- **工具库**: @vueuse/nuxt
- **语言**: Vue 3, TypeScript
- **样式**: CSS (自定义 + Nuxt UI)

## 项目结构

```
app/
├── assets/                   # 静态资源
│   └── css/                  # 样式文件
├── components/               # Vue 组件
│   ├── Auth.vue              # 认证组件
│   ├── AvatarManager.vue     # 头像管理组件
│   ├── CommentForm.vue       # 评论表单
│   ├── CommentList.vue       # 评论列表
│   ├── Logo.vue              # Logo 组件
│   ├── PostCard.vue          # 帖子卡片
│   ├── PostForm.vue          # 帖子表单
│   ├── Profile.vue           # 用户资料
│   └── User.vue              # 用户组件
├── composables/              # 可复用逻辑
│   ├── useAuth.ts            # 认证功能
│   ├── useAvatar.ts          # 头像管理
│   ├── useComments.ts        # 评论功能
│   ├── useDateRelative.ts    # 相对日期
│   ├── useErrorHandler.ts    # 错误处理
│   ├── usePocketbase.ts      # PocketBase 实例
│   └── usePosts.ts           # 帖子管理
├── layouts/                  # 布局组件
│   └── default.vue           # 默认布局
├── middleware/               # 中间件
│   ├── auth.ts               # 认证中间件
│   └── verified.ts           # 邮箱验证中间件
├── pages/                    # 页面组件
│   ├── posts/                # 帖子相关页面
│   │   ├── [id]/             # 帖子详情
│   │   │   └── edit.vue      # 编辑帖子
│   │   ├── [id].vue          # 帖子详情
│   │   ├── create.vue        # 创建帖子
│   │   └── index.vue         # 帖子列表
│   └── index.vue             # 首页
├── plugins/                  # 插件
│   └── pocketbase.ts         # PocketBase 插件
├── types/                    # TypeScript 类型
│   ├── comment.ts            # 评论类型
│   ├── post.ts               # 帖子类型
│   └── user.ts               # 用户类型
├── app.config.ts             # 应用配置
└── app.vue                   # 根组件
```

## 安装和运行

### 前置条件

- Node.js 18+ 或 20+
- pnpm
- PocketBase 服务器

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

1. 复制 `.env.example` 文件为 `.env`
2. 在 `.env` 文件中配置 PocketBase URL

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```
# PocketBase API
POCKETBASE_URL=https://your-pocketbase-instance.com
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

### 预览生产版本

```bash
pnpm run preview
```

## 功能说明

### 认证功能

- 使用邮箱和密码进行登录和注册
- 邮箱验证（通过中间件保护特定路由）
- 自动处理认证状态
- 提供详细的错误信息
- 安全退出

### 头像管理

- 支持上传用户头像
- 自动删除旧头像
- 支持删除现有头像
- 实时预览头像

### 帖子管理

- 创建新帖子
- 编辑现有帖子
- 查看帖子详情
- 帖子列表展示
- 响应式设计，适配不同设备

### 评论功能

- 发表评论
- 查看评论列表
- 实时更新评论

### 用户资料

- 查看用户基本信息
- 显示用户头像
- 显示用户发布的帖子

## 使用说明

1. **注册/登录**
   - 打开应用，在首页进行注册或登录
   - 注册后会收到邮箱验证链接
   - 验证邮箱后即可使用完整功能

2. **管理头像**
   - 登录后，在个人资料页面上传或删除头像
   - 支持多种图片格式
   - 自动调整图片大小

3. **发布帖子**
   - 点击导航栏的"创建帖子"按钮
   - 填写帖子标题和内容
   - 点击"发布"按钮提交

4. **查看和编辑帖子**
   - 在帖子列表页面浏览所有帖子
   - 点击帖子标题查看详情
   - 在帖子详情页面可以编辑或删除自己的帖子

5. **发表评论**
   - 在帖子详情页面底部填写评论内容
   - 点击"发表评论"按钮提交
   - 可以查看所有评论

6. **退出登录**
   - 点击导航栏的"退出"按钮
   - 系统会清除认证信息并返回登录页面

## 配置说明

### PocketBase 设置

1. **创建集合**
   - `users`: 用户集合（PocketBase 默认）
   - `posts`: 帖子集合
   - `comments`: 评论集合

2. **字段配置**
   - `posts` 集合需要包含：`title`, `content`, `author` (relation to users)
   - `comments` 集合需要包含：`content`, `post` (relation to posts), `author` (relation to users)

3. **规则配置**
   - 设置适当的读写规则，确保数据安全
   - 例如：只有帖子作者可以编辑或删除帖子

## 注意事项

- 确保您的 PocketBase API 服务已正确配置
- 头像上传功能需要正确配置 PocketBase 的文件存储设置
- 所有 API 请求都通过 PocketBase 进行处理
- 邮箱验证功能需要配置 PocketBase 的邮件服务

## 许可证

MIT