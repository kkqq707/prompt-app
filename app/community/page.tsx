import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import PostList from "./components/post-list";

export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch community posts with user profiles
  const { data: posts } = await supabase
    .from("community_posts")
    .select(`
      *,
      profiles:user_id (
        id,
        display_name,
        avatar_url
      )
    `)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Community Header */}
        <div className="rounded-3xl bg-gradient-to-br from-card via-card to-primary/5 border border-border p-8 shadow-xl shadow-primary/10">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent sm:text-5xl">
                社区
              </h1>
              <p className="mt-4 text-lg leading-8 text-muted">
                分享你的AI提示词经验，与社区成员交流互动，共同探索AI创作的无限可能。
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <span className="rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                  💬 自由讨论
                </span>
                <span className="rounded-full bg-secondary/10 px-4 py-1.5 text-sm font-medium text-secondary">
                  👍 点赞互动
                </span>
                <span className="rounded-full bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent">
                  ❤️ 收藏分享
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-4">
              {user ? (
                <Link
                  href="/community/posts/new"
                  className="inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-primary to-primary-dark px-6 py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:shadow-primary/30"
                >
                  <span className="text-xl">✍️</span>
                  发布新帖子
                </Link>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted">登录后即可发布帖子和参与讨论</p>
                  <div className="flex gap-3">
                    <Link
                      href="/login"
                      className="rounded-2xl border border-border bg-white px-5 py-2.5 text-sm font-medium text-card-foreground transition-all hover:bg-surface hover:shadow-sm dark:bg-card"
                    >
                      登录
                    </Link>
                    <Link
                      href="/signup"
                      className="rounded-2xl bg-gradient-to-r from-primary to-primary-dark px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:shadow-primary/30"
                    >
                      注册
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="text-3xl font-bold text-primary">
              {posts?.length || 0}
            </div>
            <div className="mt-2 text-sm text-muted">社区帖子</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="text-3xl font-bold text-secondary">
              {posts?.reduce((sum, post) => sum + (post.like_count || 0), 0) || 0}
            </div>
            <div className="mt-2 text-sm text-muted">累计点赞</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="text-3xl font-bold text-accent">
              {posts?.reduce((sum, post) => sum + (post.comment_count || 0), 0) || 0}
            </div>
            <div className="mt-2 text-sm text-muted">累计评论</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="text-3xl font-bold text-primary">
              {new Set(posts?.map((post) => post.user_id) || []).size}
            </div>
            <div className="mt-2 text-sm text-muted">活跃作者</div>
          </div>
        </div>

        {/* Posts List */}
        <div className="rounded-3xl bg-card border border-border p-6 shadow-lg shadow-primary/5">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-card-foreground">
              最新帖子
            </h2>
            <div className="flex gap-3">
              <button className="rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-card-foreground transition-all hover:bg-surface dark:bg-card">
                热门
              </button>
              <button className="rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-card-foreground transition-all hover:bg-surface dark:bg-card">
                最新
              </button>
            </div>
          </div>

          {posts && posts.length > 0 ? (
            <PostList
              posts={posts}
              currentUserId={user?.id}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
              <div className="mx-auto max-w-md">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-2xl">💬</span>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-card-foreground">
                  社区还没有帖子
                </h3>
                <p className="mb-6 text-sm text-muted">
                  {user
                    ? "成为第一个分享者，发布你的第一个帖子吧！"
                    : "登录后即可发布帖子，分享你的AI提示词经验。"}
                </p>
                {user ? (
                  <Link
                    href="/community/posts/new"
                    className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-primary to-primary-dark px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:shadow-primary/30"
                  >
                    发布第一个帖子
                  </Link>
                ) : (
                  <div className="flex justify-center gap-3">
                    <Link
                      href="/login"
                      className="rounded-2xl border border-border bg-white px-5 py-2.5 text-sm font-medium text-card-foreground transition-all hover:bg-surface dark:bg-card"
                    >
                      登录
                    </Link>
                    <Link
                      href="/signup"
                      className="rounded-2xl bg-gradient-to-r from-primary to-primary-dark px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:shadow-primary/30"
                    >
                      注册
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}