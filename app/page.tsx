import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import PromptList from "@/app/components/prompt-list";

export const dynamic = "force-dynamic";

function formatDateTime(value: string) {
  const date = new Date(value);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: prompts } = await supabase
    .from("prompts")
    .select("*")
    .order("created_at", { ascending: false });

  let favoriteIds: string[] = [];
  let canAccessPaid = false;
  let membershipEndAt: string | null = null;

  if (user) {
    const [{ data: favorites }, { data: membership }] = await Promise.all([
      supabase
        .from("favorites")
        .select("prompt_id")
        .eq("user_id", user.id),

      supabase
        .from("user_memberships")
        .select("id, end_at")
        .eq("user_id", user.id)
        .gt("end_at", new Date().toISOString())
        .order("end_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    favoriteIds = favorites?.map((item) => item.prompt_id) ?? [];
    canAccessPaid = !!membership;
    membershipEndAt = membership?.end_at ?? null;
  }

  const adminEmails = ["399569499@qq.com"];
  const canManage = !!user && adminEmails.includes(user.email ?? "");

  // 管理员账户自动拥有永久会员
  if (user && adminEmails.includes(user.email ?? "")) {
    canAccessPaid = true;
    membershipEndAt = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString(); // 100年后
  }

  return (
    <div className="min-h-screen bg-surface text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mb-10">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              <span className="block">AI Prompt</span>
              <span className="block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mt-2">
                智能提示词库
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted">
              专业级AI提示词模板库，助力您的创作、编程、营销与办公效率
            </p>

            {/* Stats */}
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <div className="rounded-xl bg-white border border-border px-5 py-3 text-center shadow-sm dark:bg-card">
                <div className="text-2xl font-bold text-primary">{prompts?.length || 0}</div>
                <div className="text-sm text-muted">提示词数量</div>
              </div>
              <div className="rounded-xl bg-white border border-border px-5 py-3 text-center shadow-sm dark:bg-card">
                <div className="text-2xl font-bold text-secondary">5+</div>
                <div className="text-sm text-muted">AI模型支持</div>
              </div>
              <div className="rounded-xl bg-white border border-border px-5 py-3 text-center shadow-sm dark:bg-card">
                <div className="text-2xl font-bold text-accent">6</div>
                <div className="text-sm text-muted">专业分类</div>
              </div>
            </div>
          </div>
        </div>

        {/* User Status & Actions */}
        {user && (
          <div className="mb-8 rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-semibold text-card-foreground">欢迎回来，{user.email?.split('@')[0] || '用户'}</h2>
                <div className="mt-2 flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                    <span className="h-2 w-2 rounded-full bg-primary"></span>
                    {user.email}
                  </span>

                  {canAccessPaid ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
                      <span className="h-2 w-2 rounded-full bg-green-500"></span>
                      会员有效中
                      {membershipEndAt && (
                        <span className="text-xs">· 到期: {formatDateTime(membershipEndAt)}</span>
                      )}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                      <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                      免费用户
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/favorites"
                  className="inline-flex items-center justify-center rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-medium text-card-foreground shadow-sm transition-all hover:bg-surface hover:shadow focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-card"
                >
                  <span className="mr-2">❤️</span>
                  我的收藏
                </Link>

                {!canAccessPaid && (
                  <Link
                    href="/vip"
                    className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-primary to-primary-dark px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <span className="mr-2">🚀</span>
                    升级会员
                  </Link>
                )}

                {canManage && (
                  <Link
                    href="/prompts/new"
                    className="inline-flex items-center justify-center rounded-lg border border-primary bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary shadow-sm transition-all hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <span className="mr-2">+</span>
                    新增提示词
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Guest CTA */}
        {!user && (
          <div className="mb-8 rounded-xl border border-border bg-gradient-to-r from-primary/5 to-secondary/5 p-8 text-center">
            <h2 className="text-2xl font-bold text-card-foreground">开始您的AI创作之旅</h2>
            <p className="mx-auto mt-2 max-w-2xl text-muted">
              注册账号即可收藏喜欢的提示词，开通会员解锁全部付费内容
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-primary to-primary-dark px-6 py-3 text-base font-semibold text-white shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                免费注册
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg border border-border bg-white px-6 py-3 text-base font-medium text-card-foreground shadow-sm transition-all hover:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-card"
              >
                已有账号登录
              </Link>
            </div>
          </div>
        )}

        <PromptList
          initialData={prompts ?? []}
          canManage={canManage}
          initialFavoriteIds={favoriteIds}
          showFavoriteButton={!!user}
          canAccessPaid={canAccessPaid}
          isLoggedIn={!!user}
        />
      </div>
    </div>
  );
}