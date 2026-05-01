# AI Prompt - AI提示词库应用

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.2.2-black?style=for-the-badge&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Supabase-Database-yellow?style=for-the-badge&logo=supabase" alt="Supabase">
  <img src="https://img.shields.io/badge/TailwindCSS-4-purple?style=for-the-badge&logo=tailwindcss" alt="TailwindCSS">
</p>

<p align="center">
  <strong>一个现代化的AI提示词库管理平台，支持提示词搜索、分类筛选、用户收藏和社区互动</strong>
</p>

## ✨ 功能特性

### 🎯 核心功能
- **提示词浏览**：查看所有AI提示词，支持标题、描述、标签全文搜索
- **智能筛选**：按分类（写作、营销、编程等）和AI模型（ChatGPT、Claude、Gemini、deepseek、豆包、kimi等）筛选
- **用户系统**：注册、登录、个人收藏管理
- **社区互动**：发布帖子、点赞、评论、收藏，与社区成员交流AI提示词经验
- **管理员功能**：管理员可添加、编辑、删除提示词

### 💎 高级特性
- **收藏系统**：用户可收藏喜欢的提示词，方便快速访问
- **社区模块**：完整的社区发帖系统，支持Markdown内容、标签和多级评论
- **个人资料**：支持头像上传（自动压缩）、昵称、简介等个性化设置
- **响应式设计**：完美适配桌面、平板和手机端
- **现代化UI**：渐变色彩、平滑动画、卡片式设计，支持深色/浅色主题

## 🏗️ 技术栈

| 技术 | 用途 | 版本 |
|------|------|------|
| [Next.js](https://nextjs.org) | React全栈框架 | 16.2.2 |
| [TypeScript](https://www.typescriptlang.org) | 类型安全的JavaScript | 5 |
| [Supabase](https://supabase.com) | 后端即服务（Auth + Database + Storage） | 2.102.1 |
| [TailwindCSS](https://tailwindcss.com) | 原子化CSS框架 | 4 |
| [@supabase/ssr](https://github.com/supabase/ssr) | Supabase服务器端渲染 | 0.10.0 |

## 📁 项目结构

```
prompt-app/
├── app/                        # Next.js App Router
│   ├── components/             # 可复用组件
│   │   ├── header.tsx          # 全局导航栏
│   │   ├── prompt-list.tsx     # 提示词列表组件
│   │   ├── auth-buttons.tsx    # 认证按钮
│   │   ├── user-menu.tsx       # 用户菜单
│   │   └── logout-button.tsx   # 退出登录按钮
│   ├── page.tsx                # 主页
│   ├── layout.tsx              # 全局布局
│   ├── globals.css             # 全局样式（Tailwind + CSS变量）
│   ├── not-found.tsx           # 404页面
│   ├── login/                  # 登录页面
│   ├── signup/                 # 注册页面
│   ├── forgot-password/        # 忘记密码页面
│   ├── reset-password/         # 重置密码页面
│   ├── change-password/        # 修改密码页面
│   ├── profile/                # 个人资料页
│   ├── favorites/              # 收藏页面
│   ├── vip/                    # VIP说明页
│   ├── community/              # 社区模块
│   │   ├── page.tsx            # 社区首页
│   │   ├── components/         # 社区组件
│   │   └── posts/              # 帖子详情、新建、编辑
│   ├── prompts/                # 提示词模块
│   │   ├── [id]/               # 提示词详情页
│   │   │   └── edit/           # 编辑提示词（管理员）
│   │   └── new/                # 新建提示词（管理员）
│   └── ...
├── data/
│   └── prompts.ts              # 提示词数据类型定义
├── utils/
│   ├── auth-errors.ts          # 认证错误中文提示映射
│   └── supabase/               # Supabase客户端配置
│       ├── client.ts           # 浏览器端客户端
│       ├── server.ts           # 服务器端客户端
│       └── middleware.ts       # 中间件配置
├── lib/
│   └── supabase.ts             # 备用客户端配置
├── migrations/                 # 数据库迁移脚本
├── public/                     # 静态资源
├── package.json                # 依赖配置
├── next.config.ts              # Next.js配置
├── postcss.config.mjs          # PostCSS配置（TailwindCSS入口）
├── middleware.ts               # Next.js中间件（Session刷新）
└── .env.local                  # 环境变量（本地开发）
```

## ⚙️ 环境配置

### 1. 克隆项目
```bash
git clone <your-repo-url>
cd prompt-app
npm install
```

### 2. Supabase配置
1. 在 [Supabase](https://supabase.com) 创建新项目
2. 获取项目URL和公钥：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

3. 创建数据库表（在Supabase SQL编辑器中按顺序执行 `migrations/` 目录下的迁移脚本）：
   - **注意**：以下为核心表的创建语句摘要，建议直接使用 `migrations/` 目录下的完整迁移脚本。

```sql
-- prompts表：存储提示词
CREATE TABLE prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt TEXT NOT NULL,
  is_paid BOOLEAN DEFAULT false,
  tags TEXT[],
  usage_tips TEXT,
  example_input TEXT,
  example_output TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- profiles表：用户扩展信息
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  website TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 新用户自动创建profile的触发器
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- favorites表：用户收藏
CREATE TABLE favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, prompt_id)
);
```

4. **社区功能需额外执行 `migrations/011_create_community_tables.sql`**，创建 `community_posts`、`post_likes`、`post_comments`、`post_favorites` 表及相应触发器。

5. **创建存储桶**（头像上传功能需要）：
   - 登录 Supabase 控制台
   - 进入项目 → Storage → Create new bucket
   - 名称填写：`avatars`
   - 选择 "Public" 权限
   - 点击 "Create bucket"

### 3. 环境变量
创建 `.env.local` 文件：
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
NEXT_PUBLIC_ADMIN_EMAIL=your-admin@email.com
ADMIN_EMAIL=your-admin@email.com
```

## 🚀 本地开发

### 启动开发服务器
```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建生产版本
```bash
npm run build
npm start
```

## 🌐 部署指南

### Vercel 部署（推荐）
1. **推送代码到GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/ai-prompt.git
   git push -u origin main
   ```

2. **Vercel部署**
   - 访问 [Vercel](https://vercel.com)，用GitHub账号登录
   - 点击"New Project"，导入您的GitHub仓库
   - 框架预设选择 `Next.js`
   - 配置环境变量（同 `.env.local`）
   - 点击"Deploy"

3. **Supabase CORS配置**
   - 登录 Supabase 控制台
   - 进入项目 → Settings → API
   - 在CORS设置中添加您的Vercel域名（如 `https://ai-prompt.vercel.app`）
   - 保存设置

### 其他部署选项
- **Netlify**：类似Vercel流程，导入Git仓库并配置环境变量
- **Railway**：支持自定义构建配置

## 👑 管理员功能

### 管理员账户
在环境变量 `NEXT_PUBLIC_ADMIN_EMAIL` 中配置的邮箱拥有特殊权限：
- ✅ **内容管理**：可添加、编辑、删除提示词
- ✅ **完全访问**：可查看和操作所有内容

### 配置其他管理员
在 `adminEmails` 数组中添加邮箱即可（当前在首页及收藏页中硬编码）。

## 🎨 UI设计特色

### 现代化视觉设计
- **渐变色彩**：紫色为主色调的现代化配色方案
- **卡片式布局**：统一圆角、阴影和边框设计
- **平滑动画**：悬停效果、加载动画、过渡效果
- **深色模式**：自动适配系统深色/浅色主题
- **响应式布局**：完美适配各种屏幕尺寸

### 交互体验优化
- **实时搜索**：输入即搜索，无需刷新页面
- **收藏反馈**：即时收藏状态反馈
- **加载状态**：操作中的加载提示
- **错误处理**：友好的中文错误提示信息

## 🔧 开发扩展

### 添加新功能
1. **新的提示词分类**：修改 `prompt-list.tsx` 中的分类选项
2. **新的AI模型**：更新模型筛选选项
3. **新的社区板块**：扩展社区功能或添加新版块
4. **多语言支持**：集成i18n国际化库

### 数据库扩展
如需添加新字段：
1. 在Supabase中添加字段
2. 更新TypeScript类型定义 (`data/prompts.ts`)
3. 更新相关组件的数据处理逻辑
4. 将迁移SQL保存到 `migrations/` 目录

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

1. **提交Issue**：报告bug或提出新功能建议
2. **Fork项目**：创建自己的分支进行开发
3. **编写代码**：遵循现有代码风格
4. **测试验证**：确保功能正常工作
5. **提交PR**：描述修改内容和原因

## 📄 许可证

本项目基于 MIT 许可证开源。

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- **邮箱**: 399569499@qq.com
- **GitHub Issue**: 在仓库中提交问题

---

<p align="center">
  Made with ❤️ by AI Prompt Team
</p>

<p align="center">
  <sub>最后更新: 2026年5月</sub>
</p>
