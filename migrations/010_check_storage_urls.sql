-- 检查Supabase Storage配置和URL格式
-- 此脚本帮助诊断头像显示问题

DO $$
BEGIN
  RAISE NOTICE '🔍 检查Supabase Storage配置和URL格式...';
  RAISE NOTICE '';
END $$;

-- 1. 检查项目配置
SELECT '1. 项目信息' AS step;
SELECT
  (SELECT current_setting('app.settings.supabase_url', true)) AS supabase_url,
  (SELECT current_setting('app.settings.supabase_anon_key', true)) AS supabase_anon_key;

-- 2. 检查存储桶配置（通过information_schema）
SELECT '2. 存储桶配置检查' AS step;
-- 注意：存储桶信息可能在内部表中，以下查询可能因权限失败
-- 提供手动检查步骤

DO $$
BEGIN
  RAISE NOTICE '📋 手动检查步骤：';
  RAISE NOTICE '   1. 登录 Supabase 控制台';
  RAISE NOTICE '   2. 进入 Storage → avatars 存储桶';
  RAISE NOTICE '   3. 检查：';
  RAISE NOTICE '      - 存储桶名称: avatars';
  RAISE NOTICE '      - 权限: Public';
  RAISE NOTICE '      - Policies: 应有INSERT和SELECT策略';
  RAISE NOTICE '   4. 上传测试文件，获取URL格式';
  RAISE NOTICE '';
END $$;

-- 3. 检查profiles表中的avatar_url格式
SELECT '3. 检查profiles表中的avatar_url格式' AS step;
SELECT
  id,
  display_name,
  CASE
    WHEN avatar_url IS NULL THEN 'NULL'
    WHEN avatar_url = '' THEN '空字符串'
    WHEN avatar_url LIKE 'http%://%' THEN '完整URL'
    WHEN avatar_url LIKE '/%' THEN '相对路径'
    WHEN avatar_url LIKE 'data:%' THEN 'Data URL'
    ELSE '其他格式'
  END AS url_type,
  LENGTH(avatar_url) AS url_length,
  SUBSTRING(avatar_url FROM 1 FOR 50) AS url_preview
FROM profiles
WHERE avatar_url IS NOT NULL AND avatar_url != ''
LIMIT 10;

-- 4. 提供Supabase Storage URL格式说明
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📝 Supabase Storage URL格式说明：';
  RAISE NOTICE '';
  RAISE NOTICE '标准公共URL格式：';
  RAISE NOTICE '  https://[project-ref].supabase.co/storage/v1/object/public/[bucket]/[file-path]';
  RAISE NOTICE '';
  RAISE NOTICE '示例：';
  RAISE NOTICE '  https://kuuriuorgmuqmfzscwae.supabase.co/storage/v1/object/public/avatars/user-id/1234567890.jpg';
  RAISE NOTICE '';
  RAISE NOTICE 'getPublicUrl() 应该返回上述格式的URL';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 调试建议：';
  RAISE NOTICE '   1. 在浏览器控制台检查avatar_url的值';
  RAISE NOTICE '   2. 直接在浏览器中打开该URL测试';
  RAISE NOTICE '   3. 检查网络请求，查看图片加载状态';
  RAISE NOTICE '   4. 检查是否有CORS或CDN缓存问题';
END $$;

-- 5. 检查存储桶中的文件（如果有直接查询权限）
SELECT '4. 存储桶文件检查（可能需要管理员权限）' AS step;
-- 此查询通常需要特殊权限，提供替代方案

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🪣 存储桶文件手动检查：';
  RAISE NOTICE '   1. 在Supabase控制台进入 Storage → avatars';
  RAISE NOTICE '   2. 查看Objects标签页';
  RAISE NOTICE '   3. 检查是否有用户上传的文件';
  RAISE NOTICE '   4. 点击文件查看详情，复制URL';
  RAISE NOTICE '   5. 比较URL与profiles表中的avatar_url';
END $$;

-- 6. 常见问题排查
SELECT '5. 常见问题排查' AS step;
SELECT
  '问题' AS issue,
  '解决方案' AS solution
FROM (VALUES
  ('URL格式不正确', '确保使用getPublicUrl()获取URL，不要手动拼接'),
  ('存储桶权限问题', '检查avatars存储桶是否为Public，是否有SELECT策略'),
  ('CDN缓存', '上传时添加cacheControl参数或版本号（如?t=时间戳）'),
  ('CORS问题', '在Supabase控制台配置Storage的CORS设置'),
  ('文件不存在', '确认文件已成功上传到存储桶')
) AS t(issue, solution);

-- 7. 提供代码调试建议
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '💻 代码调试建议：';
  RAISE NOTICE '';
  RAISE NOTICE '1. 在handleAvatarUpload函数中添加调试：';
  RAISE NOTICE '   console.log("publicUrl:", publicUrl);';
  RAISE NOTICE '   console.log("完整URL格式:", supabase.storage.from("avatars").getPublicUrl(filePath));';
  RAISE NOTICE '';
  RAISE NOTICE '2. 在img标签的onError中添加调试：';
  RAISE NOTICE '   console.error("图片加载失败:", e.target.src);';
  RAISE NOTICE '';
  RAISE NOTICE '3. 测试直接访问URL：';
  RAISE NOTICE '   在浏览器新标签页中打开avatar_url，查看是否显示图片';
  RAISE NOTICE '';
  RAISE NOTICE '4. 添加图片加载状态指示：';
  RAISE NOTICE '   使用onLoad和onError事件跟踪图片加载状态';
END $$;