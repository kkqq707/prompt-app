import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import PromptList from "@/app/components/prompt-list";

export const dynamic = "force-dynamic";


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

  if (user) {
    const { data: favorites } = await supabase
      .from("favorites")
      .select("prompt_id")
      .eq("user_id", user.id);

    favoriteIds = favorites?.map((item) => item.prompt_id) ?? [];
  }

  const adminEmails = ["399569499@qq.com"];
  const canManage = !!user && adminEmails.includes(user.email ?? "");

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


        {/* Guest CTA */}
        {!user && (
          <div className="mb-8 rounded-xl border border-border bg-gradient-to-r from-primary/5 to-secondary/5 p-8 text-center">
            <h2 className="text-2xl font-bold text-card-foreground">开始您的AI创作之旅</h2>
            <p className="mx-auto mt-2 max-w-2xl text-muted">
              注册账号即可收藏喜欢的提示词，参与社区讨论
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
        />
      </div>
    </div>
  );
}