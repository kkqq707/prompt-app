-- Create community tables for user-generated content and interactions

-- community_posts table: store community posts
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for community_posts
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

-- Create policies for community_posts
CREATE POLICY "Anyone can view community posts"
  ON community_posts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert their own posts"
  ON community_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
  ON community_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
  ON community_posts FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for community_posts
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_like_count ON community_posts(like_count DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_tags ON community_posts USING GIN(tags);

-- post_likes table: store post likes
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Enable Row Level Security for post_likes
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for post_likes
CREATE POLICY "Anyone can view post likes"
  ON post_likes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert their own likes"
  ON post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
  ON post_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for post_likes
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);

-- post_comments table: store post comments (supports two-level nesting)
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  depth INTEGER DEFAULT 0 CHECK (depth >= 0 AND depth <= 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for post_comments
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for post_comments
CREATE POLICY "Anyone can view post comments"
  ON post_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert their own comments"
  ON post_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON post_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON post_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for post_comments
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent_id ON post_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_created_at ON post_comments(created_at DESC);

-- post_favorites table: store post favorites
CREATE TABLE IF NOT EXISTS post_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Enable Row Level Security for post_favorites
ALTER TABLE post_favorites ENABLE ROW LEVEL SECURITY;

-- Create policies for post_favorites
CREATE POLICY "Anyone can view post favorites"
  ON post_favorites FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert their own favorites"
  ON post_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON post_favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for post_favorites
CREATE INDEX IF NOT EXISTS idx_post_favorites_post_id ON post_favorites(post_id);
CREATE INDEX IF NOT EXISTS idx_post_favorites_user_id ON post_favorites(user_id);

-- Create triggers for updating comment_count and like_count
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts
    SET comment_count = comment_count + 1,
        updated_at = NOW()
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts
    SET comment_count = comment_count - 1,
        updated_at = NOW()
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_comment_count_trigger
  AFTER INSERT OR DELETE ON post_comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts
    SET like_count = like_count + 1,
        updated_at = NOW()
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts
    SET like_count = like_count - 1,
        updated_at = NOW()
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_like_count_trigger
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_like_count();

CREATE OR REPLACE FUNCTION update_post_favorite_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts
    SET favorite_count = favorite_count + 1,
        updated_at = NOW()
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts
    SET favorite_count = favorite_count - 1,
        updated_at = NOW()
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_favorite_count_trigger
  AFTER INSERT OR DELETE ON post_favorites
  FOR EACH ROW EXECUTE FUNCTION update_post_favorite_count();

-- Create trigger to update updated_at timestamp for community_posts
CREATE OR REPLACE FUNCTION update_community_post_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_community_post_updated_at_trigger
  BEFORE UPDATE ON community_posts
  FOR EACH ROW EXECUTE FUNCTION update_community_post_updated_at();

-- Create trigger to update updated_at timestamp for post_comments
CREATE OR REPLACE FUNCTION update_post_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_post_comment_updated_at_trigger
  BEFORE UPDATE ON post_comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comment_updated_at();