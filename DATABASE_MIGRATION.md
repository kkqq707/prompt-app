# 数据库迁移说明

为了支持用户资料功能（头像、昵称等），需要创建 `profiles` 表。请按照以下步骤在 Supabase 中执行 SQL 迁移。

## 迁移步骤

1. **登录 Supabase 控制台**
   - 打开您的 Supabase 项目
   - 进入 SQL 编辑器

2. **执行迁移 SQL**
   - 复制 `migrations/001_create_profiles_table.sql` 文件中的 SQL 语句
   - 在 SQL 编辑器中执行

3. **验证表创建成功**
   - 检查表浏览器中是否出现 `profiles` 表
   - 确认 RLS（行级安全）策略已启用

## 表结构说明

`profiles` 表包含以下字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID (主键) | 关联 `auth.users.id`，级联删除 |
| display_name | TEXT | 显示昵称 |
| avatar_url | TEXT | 头像链接 |
| bio | TEXT | 个人简介 |
| website | TEXT | 个人网站 |
| location | TEXT | 所在地 |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

## 自动功能

- **自动创建记录**：当新用户注册时，触发器会自动创建 `profiles` 记录
- **自动更新时间**：更新记录时自动更新 `updated_at` 字段
- **现有用户**：触发器不会为现有用户创建记录，需要手动创建或通过应用逻辑创建

## 手动为现有用户创建记录（可选）

如果您有现有用户，可以执行以下 SQL 为他们创建初始 `profiles` 记录：

```sql
INSERT INTO profiles (id, display_name, avatar_url)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'username', raw_user_meta_data->>'name', split_part(email, '@', 1)),
  raw_user_meta_data->>'avatar_url'
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles);
```

## 故障排除

1. **表已存在**：如果表已存在，SQL 会跳过创建（使用 `IF NOT EXISTS`）
2. **权限问题**：确保执行 SQL 的用户有足够权限
3. **触发器错误**：如果触发器创建失败，可以单独执行函数和触发器创建部分

## 后续维护

- 表结构和 RLS 策略已针对常规使用场景优化
- 索引已创建以提高查询性能
- 支持深色/浅色主题的颜色变量已定义在 CSS 中

## 应用集成

应用代码已经处理以下情况：
- 表不存在时的优雅降级
- 用户资料不存在时的默认值
- 头像加载失败时的回退显示（显示姓名首字母）
- 响应式设计适配不同设备

如有问题，请检查控制台错误信息并确保表结构正确创建。