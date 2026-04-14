-- 修复 profiles 表迁移脚本
-- 在 Supabase SQL 编辑器中执行此脚本

-- 1. 创建 profiles 表（如果不存在）
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  website TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. 启用行级安全策略
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. 删除现有策略（如果存在）以避免冲突
DROP POLICY IF EXISTS "Users can view their own profile and public profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- 4. 创建新的RLS策略
-- 所有人都可以查看所有资料（公开资料）
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (true);

-- 用户只能插入自己的资料
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 用户只能更新自己的资料
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 5. 删除现有触发器函数（如果存在）
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 6. 创建更新时间戳触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. 创建触发器
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. 创建用户注册时自动创建profile的函数（改进版）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. 创建用户注册触发器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON profiles(display_name);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);

-- 11. 为现有用户创建profiles记录（如果不存在）
INSERT INTO profiles (id, display_name, avatar_url)
SELECT
  id,
  COALESCE(
    raw_user_meta_data->>'username',
    raw_user_meta_data->>'name',
    split_part(email, '@', 1)
  ),
  COALESCE(raw_user_meta_data->>'avatar_url', '')
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- 12. 输出完成信息
DO $$
BEGIN
  RAISE NOTICE '✅ profiles 表迁移完成！';
  RAISE NOTICE '    - 表已创建/更新';
  RAISE NOTICE '    - RLS策略已配置';
  RAISE NOTICE '    - 触发器已设置';
  RAISE NOTICE '    - 现有用户记录已处理';
END $$;