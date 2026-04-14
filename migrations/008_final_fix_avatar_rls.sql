-- 终极修复：头像上传RLS策略问题
-- 在 Supabase SQL 编辑器中运行此脚本
-- 此脚本创建最简单、最可靠的RLS策略

-- 开始修复
DO $$
BEGIN
  RAISE NOTICE '🔄 开始终极修复头像上传RLS策略问题...';
END $$;

-- 1. 删除所有profiles表的现有策略，从头开始
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
DROP POLICY IF EXISTS "profiles_select_public" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own_partial" ON profiles;
DROP POLICY IF EXISTS "profiles_upsert_own_avatar" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own_partial" ON profiles;
DROP POLICY IF EXISTS "profiles_upsert_own_avatar" ON profiles;

DO $$
BEGIN
  RAISE NOTICE '✅ 已清理所有现有策略';
END $$;

-- 2. 确保RLS已启用
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. 创建最简单、最可靠的RLS策略
-- 策略1：所有人都可以查看所有profiles（SELECT）
CREATE POLICY "enable_select_for_all" ON profiles
  FOR SELECT USING (true);

DO $$
BEGIN
  RAISE NOTICE '✅ 创建了 SELECT 策略（所有人可查看）';
END $$;

-- 策略2：认证用户可以插入自己的profile（INSERT）
-- 使用 WITH CHECK (auth.uid() = id) 确保用户只能插入自己的记录
CREATE POLICY "enable_insert_for_users" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DO $$
BEGIN
  RAISE NOTICE '✅ 创建了 INSERT 策略（用户只能插入自己的记录）';
END $$;

-- 策略3：认证用户可以更新自己的profile（UPDATE）
-- 使用 USING (auth.uid() = id) 进行行过滤
CREATE POLICY "enable_update_for_users" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DO $$
BEGIN
  RAISE NOTICE '✅ 创建了 UPDATE 策略（用户只能更新自己的记录）';
END $$;

-- 4. 检查并修复缺失的profile记录
DO $$
DECLARE
  user_count INTEGER;
  profile_count INTEGER;
  missing_count INTEGER;
BEGIN
  -- 统计用户和profile数量
  SELECT COUNT(*) INTO user_count FROM auth.users;
  SELECT COUNT(*) INTO profile_count FROM profiles;

  missing_count := user_count - profile_count;

  RAISE NOTICE '📊 数据统计：';
  RAISE NOTICE '   - 总用户数: %', user_count;
  RAISE NOTICE '   - 现有profile数: %', profile_count;
  RAISE NOTICE '   - 缺失profile数: %', missing_count;

  IF missing_count > 0 THEN
    RAISE NOTICE '⚠️  正在为缺失的用户创建profile记录...';

    INSERT INTO profiles (id, display_name, avatar_url)
    SELECT
      u.id,
      COALESCE(
        u.raw_user_meta_data->>'username',
        u.raw_user_meta_data->>'name',
        split_part(u.email, '@', 1)
      ),
      COALESCE(u.raw_user_meta_data->>'avatar_url', '')
    FROM auth.users u
    WHERE u.id NOT IN (SELECT id FROM profiles)
    ON CONFLICT (id) DO NOTHING;

    GET DIAGNOSTICS missing_count = ROW_COUNT;
    RAISE NOTICE '✅ 已为 % 个用户创建了profile记录', missing_count;
  END IF;
END $$;

-- 5. 验证表结构和触发器
DO $$
BEGIN
  -- 检查表是否存在
  IF NOT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    RAISE EXCEPTION '❌ profiles 表不存在！请先运行基础迁移脚本';
  END IF;

  -- 检查列是否完整
  IF (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) < 8 THEN
    RAISE WARNING '⚠️  profiles 表可能缺少某些列';
  END IF;

  RAISE NOTICE '✅ 表结构检查完成';
END $$;

-- 6. 清除缓存并完成
SELECT pg_notify('pgrst', 'reload schema');

DO $$
BEGIN
  RAISE NOTICE '✅ 已清除schema缓存';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 RLS策略终极修复完成！';
  RAISE NOTICE '';
  RAISE NOTICE '📋 创建的策略：';
  RAISE NOTICE '    1. enable_select_for_all - 所有人可查看profiles';
  RAISE NOTICE '    2. enable_insert_for_users - 用户只能插入自己的记录';
  RAISE NOTICE '    3. enable_update_for_users - 用户只能更新自己的记录';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 测试步骤：';
  RAISE NOTICE '    1. 访问 https://aipromptku.com/profile';
  RAISE NOTICE '    2. 点击头像上传图片';
  RAISE NOTICE '    3. 应该显示"头像上传成功！"';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 如果仍然失败：';
  RAISE NOTICE '    - 代码已修改为先检查后操作，避免upsert';
  RAISE NOTICE '    - 检查Supabase控制台是否创建了"avatars"存储桶';
  RAISE NOTICE '    - 检查浏览器控制台是否有其他错误';
END $$;