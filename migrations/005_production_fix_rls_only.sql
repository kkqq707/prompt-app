-- 生产环境专用：只修复RLS策略，不删除数据
-- 在 Supabase 生产数据库的 SQL 编辑器中运行此脚本
-- 此脚本安全：不会删除表或数据，只修改策略

-- 0. 重要提示：生产环境操作
DO $$
BEGIN
  RAISE NOTICE '🔒 生产环境操作提示：';
  RAISE NOTICE '   - 此脚本只修复RLS策略，不删除数据';
  RAISE NOTICE '   - 建议在非高峰时段执行';
  RAISE NOTICE '   - 执行前请确认当前用户有权修改策略';
  RAISE NOTICE '   - 修复后请立即测试应用功能';
END $$;

-- 1. 检查表是否存在（安全验证）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
  ) THEN
    RAISE EXCEPTION '❌ profiles 表不存在，请先创建表';
  END IF;
END $$;

-- 2. 删除所有可能存在的旧策略（避免冲突）
-- 安全操作：使用 IF EXISTS，不存在则跳过
DROP POLICY IF EXISTS "Users can view their own profile and public profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;

RAISE NOTICE '✅ 旧策略已清理';

-- 3. 确保RLS已启用
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
RAISE NOTICE '✅ RLS已启用';

-- 4. 创建新的RLS策略（修复版）
-- 4.1 SELECT策略：所有人都可以查看所有profiles（公开资料）
CREATE POLICY "profiles_select_public" ON profiles
  FOR SELECT USING (true);
RAISE NOTICE '✅ SELECT策略已创建：所有人可查看';

-- 4.2 INSERT策略：用户只能插入自己的profile
-- 关键修复：使用 WITH CHECK (auth.uid() = id) 确保用户只能插入自己的记录
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
RAISE NOTICE '✅ INSERT策略已创建：用户只能插入自己的记录';

-- 4.3 UPDATE策略：用户只能更新自己的profile
-- 关键修复：使用 USING (auth.uid() = id) 进行行过滤
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);
RAISE NOTICE '✅ UPDATE策略已创建：用户只能更新自己的记录';

-- 5. 验证现有触发器（如果不存在则创建）
-- 5.1 检查update_updated_at_column函数是否存在
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.routines
    WHERE routine_schema = 'public'
      AND routine_name = 'update_updated_at_column'
  ) THEN
    -- 创建更新时间戳函数
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = TIMEZONE('utc'::text, NOW());
      RETURN NEW;
    END;
    $$ language 'plpgsql';
    RAISE NOTICE '✅ 创建了 update_updated_at_column 函数';
  ELSE
    RAISE NOTICE '✅ update_updated_at_column 函数已存在';
  END IF;
END $$;

-- 5.2 检查触发器是否存在
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.triggers
    WHERE event_object_table = 'profiles'
      AND trigger_name = 'update_profiles_updated_at'
  ) THEN
    -- 创建触发器
    CREATE TRIGGER update_profiles_updated_at
      BEFORE UPDATE ON profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    RAISE NOTICE '✅ 创建了 update_profiles_updated_at 触发器';
  ELSE
    RAISE NOTICE '✅ update_profiles_updated_at 触发器已存在';
  END IF;
END $$;

-- 6. 检查并修复 handle_new_user 函数（用户注册触发器）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.routines
    WHERE routine_schema = 'public'
      AND routine_name = 'handle_new_user'
  ) THEN
    -- 创建用户注册时自动创建profile的函数
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
    RAISE NOTICE '✅ 创建了 handle_new_user 函数';

    -- 创建触发器（如果不存在）
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    RAISE NOTICE '✅ 创建了 on_auth_user_created 触发器';
  ELSE
    RAISE NOTICE '✅ handle_new_user 函数已存在';
  END IF;
END $$;

-- 7. 检查并创建索引
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON profiles(display_name);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);
RAISE NOTICE '✅ 索引已检查/创建';

-- 8. 统计现有数据
DO $$
DECLARE
  profile_count INTEGER;
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM profiles;
  SELECT COUNT(*) INTO user_count FROM auth.users;

  RAISE NOTICE '📊 数据统计：';
  RAISE NOTICE '   - profiles 表记录数: %', profile_count;
  RAISE NOTICE '   - auth.users 表用户数: %', user_count;

  -- 如果有用户但没有profile，尝试创建缺失的profile
  IF user_count > 0 AND profile_count < user_count THEN
    RAISE NOTICE '⚠️  发现用户缺少profile记录，正在修复...';

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

    GET DIAGNOSTICS profile_count = ROW_COUNT;
    RAISE NOTICE '✅ 已为 % 个用户创建了profile记录', profile_count;
  END IF;
END $$;

-- 9. 清除Supabase schema缓存
SELECT pg_notify('pgrst', 'reload schema');
RAISE NOTICE '✅ 已清除schema缓存';

-- 10. 完成总结
DO $$
BEGIN
  RAISE NOTICE '🎉 生产环境RLS策略修复完成！';
  RAISE NOTICE '    - RLS策略已配置：SELECT/INSERT/UPDATE';
  RAISE NOTICE '    - 现有数据保留：✅';
  RAISE NOTICE '    - 触发器检查完成：✅';
  RAISE NOTICE '    - 索引检查完成：✅';
  RAISE NOTICE '';
  RAISE NOTICE '📋 下一步：';
  RAISE NOTICE '    1. 访问 https://aipromptku.com/profile';
  RAISE NOTICE '    2. 测试个人资料保存功能';
  RAISE NOTICE '    3. 测试头像上传功能（如需要）';
  RAISE NOTICE '    4. 确认无"RLS策略"错误';
END $$;