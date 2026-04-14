-- 简化版：修复头像上传的RLS策略问题
-- 在 Supabase SQL 编辑器中运行此脚本（在生产环境）
-- 此脚本修复头像上传时的 "new row violates row-level security policy" 错误

-- 注意：RAISE NOTICE 只能在 DO $$ 块中使用
DO $$
BEGIN
  RAISE NOTICE '🔄 开始修复头像上传RLS策略问题...';
END $$;

-- 1. 删除可能冲突的旧策略
DROP POLICY IF EXISTS "profiles_update_own_partial" ON profiles;
DROP POLICY IF EXISTS "profiles_upsert_own_avatar" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own_partial" ON profiles;

DO $$
BEGIN
  RAISE NOTICE '✅ 已清理旧策略';
END $$;

-- 2. 创建新的RLS策略来解决头像上传问题

-- 2.1 为UPDATE创建更灵活的策略（允许部分字段更新）
CREATE POLICY "profiles_update_own_partial" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DO $$
BEGIN
  RAISE NOTICE '✅ 创建了 profiles_update_own_partial 策略 (UPDATE)';
END $$;

-- 2.2 为头像上传创建专门的upsert策略
-- 允许用户upsert自己的记录，即使只有id和avatar_url字段
CREATE POLICY "profiles_upsert_own_avatar" ON profiles
  FOR ALL USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DO $$
BEGIN
  RAISE NOTICE '✅ 创建了 profiles_upsert_own_avatar 策略 (ALL)';
END $$;

-- 2.3 更宽松的INSERT策略（用于第一次上传头像）
CREATE POLICY "profiles_insert_own_partial" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DO $$
BEGIN
  RAISE NOTICE '✅ 创建了 profiles_insert_own_partial 策略 (INSERT)';
END $$;

-- 3. 检查是否有用户缺少profile记录（可能导致第一次上传头像失败）
DO $$
DECLARE
  missing_profiles INTEGER;
  created_count INTEGER;
BEGIN
  -- 统计缺少profile的用户
  SELECT COUNT(*) INTO missing_profiles
  FROM auth.users u
  LEFT JOIN profiles p ON u.id = p.id
  WHERE p.id IS NULL;

  IF missing_profiles > 0 THEN
    RAISE NOTICE '⚠️  发现 % 个用户缺少profile记录', missing_profiles;
    RAISE NOTICE '   正在创建缺失的profile记录...';

    -- 为这些用户创建基本的profile记录
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
    LEFT JOIN profiles p ON u.id = p.id
    WHERE p.id IS NULL
    ON CONFLICT (id) DO NOTHING;

    GET DIAGNOSTICS created_count = ROW_COUNT;
    RAISE NOTICE '✅ 已为 % 个用户创建了profile记录', created_count;
  ELSE
    RAISE NOTICE '✅ 所有用户都有对应的profile记录';
  END IF;
END $$;

-- 4. 清除Supabase schema缓存
SELECT pg_notify('pgrst', 'reload schema');

DO $$
BEGIN
  RAISE NOTICE '✅ 已清除schema缓存';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 RLS策略修复完成！';
  RAISE NOTICE '';
  RAISE NOTICE '📋 下一步：';
  RAISE NOTICE '    1. 访问 https://aipromptku.com/profile';
  RAISE NOTICE '    2. 测试头像上传功能';
  RAISE NOTICE '    3. 应该显示"头像上传成功！"';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 如果仍然失败，可能需要：';
  RAISE NOTICE '    - 在Supabase控制台创建 "avatars" 存储桶（Storage → Create bucket）';
  RAISE NOTICE '    - 检查代码中的upsert是否提供所有字段';
END $$;