import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import PromptList from "@/app/components/prompt-list";
import LogoutButton from "@/app/components/logout-button";

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
    <div className="min-h-screen bg-gradient-to-b from-background to-slate-100/50 p-6 text-foreground dark:from-background dark:to-slate-900/50">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl bg-card border border-border p-8 shadow-lg shadow-primary/5">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                AI Prompt
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
                AI提示词库 - 收集高质量AI提示词模板，支持搜索、分类筛选、收藏、付费解锁与会员查看。
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {!user ? (
                <>
                  <Link
                    href="/login"
                    className="rounded-2xl border border-border bg-card px-5 py-2.5 text-sm font-medium transition-all hover:border-primary hover:bg-primary/5 hover:text-primary"
                  >
                    登录
                  </Link>

                  <Link
                    href="/signup"
                    className="rounded-2xl bg-gradient-to-r from-primary to-primary-dark px-5 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg hover:shadow-primary/30"
                  >
                    注册
                  </Link>

                  <Link
                    href="/vip"
                    className="rounded-2xl border border-border bg-card px-5 py-2.5 text-sm font-medium text-secondary transition-all hover:border-secondary hover:bg-secondary/5 hover:text-secondary"
                  >
                    开通权益
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/vip"
                    className="rounded-2xl border border-border bg-card px-5 py-2.5 text-sm font-medium text-secondary transition-all hover:border-secondary hover:bg-secondary/5 hover:text-secondary"
                  >
                    开通权益
                  </Link>

                  <Link
                    href="/favorites"
                    className="rounded-2xl border border-border bg-card px-5 py-2.5 text-sm font-medium transition-all hover:border-primary hover:bg-primary/5 hover:text-primary"
                  >
                    我的收藏
                  </Link>

                  <LogoutButton />

                  {canManage && (
                    <Link
                      href="/prompts/new"
                      className="rounded-2xl bg-gradient-to-r from-primary to-primary-dark px-5 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg hover:shadow-primary/30"
                    >
                      新增提示词
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>

          {user && (
            <div className="mt-5 flex flex-wrap gap-3 text-sm text-muted">
              <span className="rounded-full bg-primary/10 px-4 py-1.5 text-primary">
                👤 当前用户：{user.email}
              </span>

              {canAccessPaid ? (
                <>
                  <span className="rounded-full bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-1.5 text-white shadow-sm">
                    🎉 会员有效中
                  </span>
                  {membershipEndAt && (
                    <span className="rounded-full bg-blue-500/10 px-4 py-1.5 text-blue-600 dark:text-blue-400">
                      ⏰ 到期时间：{formatDateTime(membershipEndAt)}
                    </span>
                  )}
                </>
              ) : (
                <span className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-1.5 text-white shadow-sm">
                  🔒 当前未开通会员
                </span>
              )}
            </div>
          )}
        </section>

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