import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import CommentSection from "./components/comment-section";
import LikeButton from "./components/like-button";
import FavoriteButton from "./components/favorite-button";
import DeleteButton from "./components/delete-button";

export const dynamic = "force-dynamic";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch post with author profile
  const { data: post, error } = await supabase
    .from("community_posts")
    .select(`
      *,
      profiles:user_id (
        id,
        display_name,
        avatar_url,
        bio
      )
    `)
    .eq("id", id)
    .single();

  if (error || !post) {
    notFound();
  }

  // Fetch user's like and favorite status
  let isLiked = false;
  let isFavorited = false;

  if (user) {
    const [{ data: like }, { data: favorite }] = await Promise.all([
      supabase
        .from("post_likes")
        .select("id")
        .eq("user_id", user.id)
        .eq("post_id", post.id)
        .maybeSingle(),
      supabase
        .from("post_favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("post_id", post.id)
        .maybeSingle(),
    ]);

    isLiked = !!like;
    isFavorited = !!favorite;
  }

  // Update view count (increment by 1)
  await supabase
    .from("community_posts")
    .update({ view_count: (post.view_count || 0) + 1 })
    .eq("id", post.id);

  function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds}秒前`;
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}分钟前`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}小时前`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays}天前`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths}个月前`;
    }

    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears}年前`;
  }

  const timeAgo = formatTimeAgo(post.created_at);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 p-4 sm:p-6">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Navigation */}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/community"
            className="rounded-2xl border border-border bg-card px-5 py-2.5 text-sm font-medium transition-all hover:border-primary hover:bg-primary/5 hover:text-primary"
          >
            ← 返回社区
          </Link>
          {user && (
            <Link
              href="/community/posts/new"
              className="rounded-2xl border border-border bg-card px-5 py-2.5 text-sm font-medium text-secondary transition-all hover:border-secondary hover:bg-secondary/5 hover:text-secondary"
            >
              ✍️ 发布新帖子
            </Link>
          )}
        </div>

        {/* Post Content */}
        <article className="rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-lg shadow-primary/5">
          {/* Post Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between gap-4">
              {/* Author Info */}
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10">
                  {post.profiles?.avatar_url ? (
                    <img
                      src={post.profiles.avatar_url}
                      alt={post.profiles.display_name || "匿名用户"}
                      className="h-14 w-14 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-primary">
                      {(post.profiles?.display_name || "匿名用户").charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-card-foreground">
                    {post.profiles?.display_name || "匿名用户"}
                  </h2>
                  <p className="mt-1 text-sm text-muted">{timeAgo}</p>
                  {post.profiles?.bio && (
                    <p className="mt-2 text-sm text-muted line-clamp-1">
                      {post.profiles.bio}
                    </p>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm">
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">{post.view_count}</div>
                  <div className="text-xs text-muted">浏览</div>
                </div>
              </div>
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {post.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="rounded-full bg-primary/5 border border-primary/10 px-4 py-1.5 text-sm font-medium text-primary"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Post Title and Description */}
          <div className="mb-8">
            <h1 className="mb-4 text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent sm:text-4xl">
              {post.title}
            </h1>
            {post.description && (
              <p className="text-lg leading-8 text-muted">
                {post.description}
              </p>
            )}
          </div>

          {/* Post Content */}
          <div className="mb-8">
            <div className="rounded-2xl bg-gradient-to-br from-background to-slate-100/50 border border-border p-6">
              <div className="prose prose-sm max-w-none text-card-foreground">
                <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-8">
                  {post.content}
                </pre>
              </div>
            </div>
          </div>

          {/* Interaction Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
            <div className="flex items-center gap-4">
              <LikeButton
                postId={post.id}
                currentUserId={user?.id}
                initialLiked={isLiked}
                likeCount={post.like_count}
              />

              <Link
                href="#comments"
                className="flex items-center gap-2 rounded-2xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-card-foreground transition-all hover:bg-surface dark:bg-card"
              >
                <span>💬</span>
                评论 ({post.comment_count || 0})
              </Link>

              <FavoriteButton
                postId={post.id}
                currentUserId={user?.id}
                initialFavorited={isFavorited}
                favoriteCount={post.favorite_count || 0}
              />
            </div>

            {/* Action Buttons for Author */}
            {user?.id === post.user_id && (
              <div className="flex items-center gap-3">
                <Link
                  href={`/community/posts/${post.id}/edit`}
                  className="rounded-2xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-card-foreground transition-all hover:bg-surface dark:bg-card"
                >
                  ✏️ 编辑
                </Link>
                <DeleteButton postId={post.id} postTitle={post.title} />
              </div>
            )}
          </div>
        </article>

        {/* Comments Section */}
        <section id="comments" className="rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-lg shadow-primary/5">
          <h2 className="mb-6 text-2xl font-bold text-card-foreground">
            评论 ({post.comment_count || 0})
          </h2>
          <CommentSection
            postId={post.id}
            currentUserId={user?.id}
          />
        </section>
      </div>
    </div>
  );
}