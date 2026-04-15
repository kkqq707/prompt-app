-- Update all paid content to free and clean up membership references
-- This migration should be run after removing VIP features and before deploying community features

-- Update all prompts to be free (remove paid restrictions)
UPDATE prompts SET is_paid = false WHERE is_paid = true;

-- Optionally, you can also:
-- 1. Keep user_memberships table for historical data (recommended)
-- 2. Keep user_prompt_unlocks table for historical data (recommended)

-- If you want to completely remove membership tables, uncomment the following lines:
-- DROP TABLE IF EXISTS user_prompt_unlocks CASCADE;
-- DROP TABLE IF EXISTS user_memberships CASCADE;

-- Note: Keeping the tables allows for data analytics and potential future features
-- that might reference historical membership data.

-- Update metadata description to reflect the change from paid to community model
COMMENT ON TABLE prompts IS 'AI prompt library - all content is now free for community sharing';