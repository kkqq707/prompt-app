import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import CopyPromptButton from "./copy-prompt-button";
import FavoriteButton from "./favorite-button";

export const dynamic = "force-dynamic";

export default async function PromptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: prompt, error } = await supabase
    .from("prompts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !prompt) {
    notFound();
  }

  let initialFavorited = false;

  if (user) {
    const { data: favorite } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("prompt_id", prompt.id)
      .maybeSingle();

    initialFavorited = !!favorite;
  }

  // 所有内容现在都免费

  const { data: relatedPrompts } = await supabase
    .from("prompts")
    .select("id, title, description, category, model")
    .eq("category", prompt.category)
    .neq("id", prompt.id)
    .limit(6);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 p-6 text-foreground">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-2xl border border-border bg-card px-5 py-2.5 text-sm font-medium transition-all hover:border-primary hover:bg-primary/5 hover:text-primary"
          >
            ← 返回首页
          </Link>

          {user && (
            <Link
              href="/favorites"
              className="rounded-2xl border border-border bg-card px-5 py-2.5 text-sm font-medium transition-all hover:border-secondary hover:bg-secondary/5 hover:text-secondary"
            >
              ❤️ 我的收藏
            </Link>
          )}
        </div>

        <article className="rounded-3xl bg-card border border-border p-8 shadow-lg shadow-primary/5">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-primary/10 px-4 py-1.5 font-medium text-primary">
              {prompt.category}
            </span>
            <span className="rounded-full bg-secondary/10 px-4 py-1.5 font-medium text-secondary">
              {prompt.model}
            </span>
          </div>

          <h1 className="mt-6 text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {prompt.title}
          </h1>

          <p className="mt-6 text-lg leading-8 text-muted">
            {prompt.description}
          </p>

          {!!prompt.tags?.length && (
            <div className="mt-6 flex flex-wrap gap-3">
              {prompt.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="rounded-full bg-primary/5 border border-primary/10 px-4 py-1.5 text-sm font-medium text-primary"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-card-foreground">提示词正文</h2>

              <div className="flex flex-wrap gap-3">
                <FavoriteButton
                  promptId={prompt.id}
                  initialFavorited={initialFavorited}
                />

                <CopyPromptButton prompt={prompt.prompt} />
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-background to-slate-100/50 border border-border p-6">
              <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-8 text-card-foreground">
                {prompt.prompt}
              </pre>
            </div>
          </div>

        </article>

        <section className="rounded-3xl bg-card border border-border p-8 shadow-lg shadow-primary/5">
          <h2 className="text-2xl font-bold text-card-foreground">使用示例</h2>

          <div className="mt-6 grid gap-6">
            <div className="rounded-2xl bg-gradient-to-br from-background to-primary/5 border border-border p-6">
              <h3 className="text-lg font-semibold text-card-foreground">使用建议</h3>
              <div className="mt-4 text-sm leading-8 text-muted">
                <pre className="whitespace-pre-wrap break-words font-sans">
                  {prompt.usage_tips?.trim()
                    ? prompt.usage_tips
                    : "建议先补充身份、目标人群、输出风格、字数和场景，这样生成结果会更稳定。"}
                </pre>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl bg-gradient-to-br from-background to-secondary/5 border border-border p-6">
                <h3 className="text-lg font-semibold text-card-foreground">示例输入</h3>
                <div className="mt-4 text-sm leading-8 text-muted">
                  <pre className="whitespace-pre-wrap break-words font-sans">
                    {prompt.example_input?.trim()
                      ? prompt.example_input
                      : "请根据这个提示词，输入你的具体需求，例如目标用户、发布平台、内容风格、语气要求等。"}
                  </pre>
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-background to-accent/5 border border-border p-6">
                <h3 className="text-lg font-semibold text-card-foreground">示例输出</h3>
                <div className="mt-4 text-sm leading-8 text-muted">
                  <pre className="whitespace-pre-wrap break-words font-sans">
                    {prompt.example_output?.trim()
                      ? prompt.example_output
                      : "这里会展示一个参考输出结果，帮助用户更快理解这个提示词的实际效果。"}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-card border border-border p-8 shadow-lg shadow-primary/5">
          <h2 className="text-2xl font-bold text-card-foreground">相关推荐</h2>

          {relatedPrompts && relatedPrompts.length > 0 ? (
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {relatedPrompts.map((item) => (
                <Link
                  key={item.id}
                  href={`/prompts/${item.id}`}
                  className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">
                      {item.category}
                    </span>
                    <span className="rounded-full bg-secondary/10 px-3 py-1 text-secondary">
                      {item.model}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-card-foreground group-hover:text-primary">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-muted line-clamp-2">
                    {item.description}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted">暂无相关推荐</p>
          )}
        </section>
      </div>
    </div>
  );
}