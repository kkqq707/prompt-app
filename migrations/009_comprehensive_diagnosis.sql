-- 综合诊断脚本：检查profiles表RLS策略和存储配置
-- 在 Supabase SQL 编辑器中运行此脚本

-- 1. 检查profiles表状态
DO $$
BEGIN
  RAISE NOTICE '🔍 开始综合诊断...';
  RAISE NOTICE '';
END $$;

-- 1.1 检查表是否存在
SELECT '1.1 检查profiles表是否存在' AS step;
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = 'profiles'
) AS profiles_table_exists;

-- 1.2 查看表结构
SELECT '1.2 查看profiles表结构' AS step;
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 1.3 检查RLS是否启用
SELECT '1.3 检查RLS是否启用' AS step;
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'profiles';

-- 1.4 查看所有现有策略
SELECT '1.4 查看所有现有策略' AS step;
SELECT
  policyname,
  permissive,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- 1.5 检查auth.users表状态
SELECT '1.5 检查auth.users表状态' AS step;
SELECT COUNT(*) AS total_users FROM auth.users;

-- 1.6 检查profiles数据
SELECT '1.6 检查profiles数据' AS step;
SELECT COUNT(*) AS total_profiles FROM profiles;

-- 1.7 检查缺失的profile记录
SELECT '1.7 检查缺失的profile记录' AS step;
SELECT COUNT(*) AS missing_profiles
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- 2. 检查存储配置（需要管理员权限）
-- 2.1 检查存储桶
SELECT '2.1 检查存储桶配置（需要storage_admin权限）' AS step;
-- 注意：以下查询需要storage_admin权限，可能无法直接运行
-- 如果有权限错误，请在Supabase控制台的Storage页面手动检查

-- 3. 测试认证上下文（模拟）
SELECT '3. 诊断完成' AS step;
SELECT '📋 诊断结果分析：' AS analysis;

-- 根据诊断结果提供建议
DO $$
DECLARE
  table_exists BOOLEAN;
  rls_enabled BOOLEAN;
  select_policy_count INTEGER;
  insert_policy_count INTEGER;
  update_policy_count INTEGER;
  total_users INTEGER;
  total_profiles INTEGER;
  missing_profiles INTEGER;
BEGIN
  -- 检查表是否存在
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) INTO table_exists;

  -- 检查RLS是否启用
  SELECT rowsecurity INTO rls_enabled
  FROM pg_tables
  WHERE schemaname = 'public' AND tablename = 'profiles';

  -- 检查策略数量
  SELECT COUNT(*) INTO select_policy_count
  FROM pg_policies
  WHERE tablename = 'profiles' AND cmd = 'SELECT';

  SELECT COUNT(*) INTO insert_policy_count
  FROM pg_policies
  WHERE tablename = 'profiles' AND cmd = 'INSERT';

  SELECT COUNT(*) INTO update_policy_count
  FROM pg_policies
  WHERE tablename = 'profiles' AND cmd = 'UPDATE';

  -- 统计数据
  SELECT COUNT(*) INTO total_users FROM auth.users;
  SELECT COUNT(*) INTO total_profiles FROM profiles;

  missing_profiles := total_users - total_profiles;

  -- 输出诊断结果
  RAISE NOTICE '';
  RAISE NOTICE '📊 诊断摘要：';
  RAISE NOTICE '   1. profiles表存在: %', CASE WHEN table_exists THEN '✅' ELSE '❌' END;
  RAISE NOTICE '   2. RLS已启用: %', CASE WHEN rls_enabled THEN '✅' ELSE '❌' END;
  RAISE NOTICE '   3. SELECT策略数: %', select_policy_count;
  RAISE NOTICE '   4. INSERT策略数: %', insert_policy_count;
  RAISE NOTICE '   5. UPDATE策略数: %', update_policy_count;
  RAISE NOTICE '   6. 总用户数: %', total_users;
  RAISE NOTICE '   7. 总profile数: %', total_profiles;
  RAISE NOTICE '   8. 缺失profile数: %', missing_profiles;
  RAISE NOTICE '';

  -- 提供建议
  IF NOT table_exists THEN
    RAISE NOTICE '❌ 问题：profiles表不存在';
    RAISE NOTICE '💡 解决方案：运行 migrations/001_create_profiles_table.sql';
  ELSIF NOT rls_enabled THEN
    RAISE NOTICE '❌ 问题：RLS未启用';
    RAISE NOTICE '💡 解决方案：运行 ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;';
  ELSIF insert_policy_count = 0 THEN
    RAISE NOTICE '❌ 问题：缺少INSERT策略';
    RAISE NOTICE '💡 解决方案：运行 migrations/008_final_fix_avatar_rls.sql';
  ELSIF update_policy_count = 0 THEN
    RAISE NOTICE '❌ 问题：缺少UPDATE策略';
    RAISE NOTICE '💡 解决方案：运行 migrations/008_final_fix_avatar_rls.sql';
  ELSIF missing_profiles > 0 THEN
    RAISE NOTICE '⚠️  问题：% 个用户缺少profile记录', missing_profiles;
    RAISE NOTICE '💡 解决方案：运行以下SQL修复缺失记录';
    RAISE NOTICE '   INSERT INTO profiles (id, display_name, avatar_url) ...';
  ELSE
    RAISE NOTICE '✅ profiles表配置基本正常';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 其他可能问题：';
    RAISE NOTICE '   1. 存储桶配置：检查Supabase控制台Storage中是否有"avatars"存储桶';
    RAISE NOTICE '   2. 认证问题：确保用户已登录，auth.uid()可用';
    RAISE NOTICE '   3. 代码逻辑：检查头像上传代码是否正确处理错误';
  END IF;
END $$;

-- 4. 提供修复脚本
SELECT '4. 修复建议' AS step;
SELECT '如果诊断显示问题，请运行以下脚本之一：' AS suggestion;
SELECT '   - migrations/008_final_fix_avatar_rls.sql (推荐)' AS script;
SELECT '   - migrations/005_production_fix_rls_only.sql' AS script;
SELECT '   - migrations/002_fix_profiles_table.sql' AS script;

-- 5. 存储桶检查步骤（手动）
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🪣 存储桶检查（在Supabase控制台操作）：';
  RAISE NOTICE '   1. 进入 Storage 页面';
  RAISE NOTICE '   2. 检查是否有 "avatars" 存储桶';
  RAISE NOTICE '   3. 如果没有，点击 "Create new bucket"';
  RAISE NOTICE '   4. 名称: avatars, 权限: Public';
  RAISE NOTICE '   5. 保存后测试头像上传';
END $$;