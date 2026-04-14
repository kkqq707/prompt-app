"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { type PromptItem } from "@/data/prompts";

export default function PromptList({
  initialData,
  canManage,
  initialFavoriteIds = [],
  showFavoriteButton = false,
  canAccessPaid = false,
  isLoggedIn = false,
}: {
  initialData: PromptItem[];
  canManage: boolean;
  initialFavoriteIds?: string[];
  showFavoriteButton?: boolean;
  canAccessPaid?: boolean;
  isLoggedIn?: boolean;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("全部分类");
  const [model, setModel] = useState("全部模型");

  const [data, setData] = useState<PromptItem[]>(initialData);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [favoriteIds, setFavoriteIds] = useState<string[]>(initialFavoriteIds);
  const [togglingFavoriteId, setTogglingFavoriteId] = useState<string | null>(
    null
  );

  function handlePaidAction(promptId: string) {
    const ok = window.confirm(
      "该提示词为付费内容。\n\n你可以：\n1. 开通会员查看全部付费提示词\n2. 支付 0.99 元解锁当前提示词\n\n点击“确定”前往解锁页面。"
    );

    if (ok) {
      router.push(`/vip?promptId=${promptId}`);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("确定要删除这条提示词吗？");
    if (!confirmed) return;

    setDeletingId(id);

    const { error } = await supabase.from("prompts").delete().eq("id", id);

    if (error) {
      alert("删除失败：" + error.message);
      setDeletingId(null);
      return;
    }

    setData((prev) => prev.filter((item) => item.id !== id));
    setDeletingId(null);
  }

  async function handleToggleFavorite(promptId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("请先登录后再收藏");
      router.push("/login");
      return;
    }

    const isFavorited = favoriteIds.includes(promptId);
    setTogglingFavoriteId(promptId);

    if (isFavorited) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("prompt_id", promptId);

      if (error) {
        alert("取消收藏失败：" + error.message);
        setTogglingFavoriteId(null);
        return;
      }

      setFavoriteIds((prev) => prev.filter((id) => id !== promptId));
    } else {
      const { error } = await supabase.from("favorites").insert([
        {
          user_id: user.id,
          prompt_id: promptId,
        },
      ]);

      if (error) {
        alert("收藏失败：" + error.message);
        setTogglingFavoriteId(null);
        return;
      }

      setFavoriteIds((prev) => [...prev, promptId]);
    }

    setTogglingFavoriteId(null);
  }

  const filteredPrompts = useMemo(() => {
    return data.filter((item) => {
      const matchKeyword =
        keyword.trim() === "" ||
        item.title.includes(keyword) ||
        item.description.includes(keyword) ||
        item.category.includes(keyword) ||
        item.model.includes(keyword) ||
        item.tags?.some((tag) => tag.includes(keyword)) ||
        item.prompt.includes(keyword);

      const matchCategory =
        category === "全部分类" || item.category === category;

      const matchModel = model === "全部模型" || item.model === model;

      return matchKeyword && matchCategory && matchModel;
    });
  }, [keyword, category, model, data]);

  return (
    <>
      <section className="rounded-3xl bg-card border border-border p-6 shadow-lg shadow-primary/5">
        <div className="grid gap-4 md:grid-cols-4">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="rounded-2xl border border-border bg-background px-5 py-3 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 md:col-span-2"
            placeholder="🔍 搜索提示词"
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-2xl border border-border bg-background px-5 py-3 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option>全部分类</option>
            <option>写作</option>
            <option>营销</option>
            <option>编程</option>
            <option>办公</option>
            <option>会议</option>
            <option>通用</option>
          </select>

          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="rounded-2xl border border-border bg-background px-5 py-3 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option>全部模型</option>
            <option>ChatGPT</option>
            <option>Claude</option>
            <option>Gemini</option>
            <option>chatgpt</option>
          </select>
        </div>

        <p className="mt-4 text-sm text-muted">
          共找到 <span className="font-semibold text-primary">{filteredPrompts.length}</span> 条提示词
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredPrompts.map((item) => {
          const isLocked = item.is_paid && !canAccessPaid;

          return (
            <article
              key={item.id}
              className="group rounded-3xl bg-card border border-border p-6 shadow-md transition-all hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1"
            >
              <div className="text-xs font-medium text-muted">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">
                  {item.category}
                </span>
                <span className="mx-2">·</span>
                <span className="rounded-full bg-secondary/10 px-2.5 py-1 text-secondary">
                  {item.model}
                </span>
              </div>

              <h2 className="mt-3 text-xl font-semibold text-card-foreground">
                {item.title}
                {item.is_paid && (
                  <span className="ml-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-xs font-semibold text-white">
                    💎 付费
                  </span>
                )}
              </h2>

              <p className="mt-3 text-sm leading-7 text-muted line-clamp-2">
                {item.description}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {item.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-primary/5 border border-primary/10 px-3 py-1 text-xs text-primary"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="mt-4 rounded-2xl bg-gradient-to-br from-background to-slate-100/50 border border-border p-5">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-card-foreground">
                  {isLocked
                    ? (item.prompt?.slice(0, 100) ?? "") +
                      "\n\n🔒 付费内容，开通会员或 0.99 解锁本条后可查看完整提示词"
                    : item.prompt}
                </pre>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                {showFavoriteButton && (
                  <button
                    onClick={() => handleToggleFavorite(item.id)}
                    disabled={togglingFavoriteId === item.id}
                    className="rounded-2xl border border-border bg-card px-5 py-2.5 text-sm font-medium transition-all hover:border-primary hover:bg-primary/5 hover:text-primary disabled:opacity-60"
                  >
                    {togglingFavoriteId === item.id
                      ? "⏳ 处理中..."
                      : favoriteIds.includes(item.id)
                      ? "❤️ 取消收藏"
                      : "🤍 收藏"}
                  </button>
                )}

                {isLocked ? (
                  <>
                    <button
                      onClick={() => handlePaidAction(item.id)}
                      className="rounded-2xl bg-gradient-to-r from-primary to-primary-dark px-5 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg hover:shadow-primary/30"
                    >
                      🔓 解锁查看
                    </button>

                    <button
                      onClick={() => handlePaidAction(item.id)}
                      className="rounded-2xl border border-border bg-card px-5 py-2.5 text-sm font-medium text-secondary transition-all hover:border-secondary hover:bg-secondary/5 hover:text-secondary"
                    >
                      💎 开通会员
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(item.prompt);
                        alert("已复制提示词");
                      }}
                      className="rounded-2xl bg-gradient-to-r from-primary to-primary-dark px-5 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg hover:shadow-primary/30"
                    >
                      📋 复制提示词
                    </button>

                    <Link
                      href={`/prompts/${item.id}`}
                      className="rounded-2xl border border-border bg-card px-5 py-2.5 text-sm font-medium transition-all hover:border-primary hover:bg-primary/5 hover:text-primary"
                    >
                      🔍 查看详情
                    </Link>
                  </>
                )}

                {canManage && (
                  <>
                    <Link
                      href={`/prompts/${item.id}/edit`}
                      className="rounded-2xl border border-border bg-card px-5 py-2.5 text-sm font-medium transition-all hover:border-primary hover:bg-primary/5 hover:text-primary"
                    >
                      ✏️ 编辑
                    </Link>

                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="rounded-2xl border border-red-300 bg-red-50 px-5 py-2.5 text-sm font-medium text-red-600 transition-all hover:border-red-500 hover:bg-red-100 disabled:opacity-60"
                    >
                      {deletingId === item.id ? "⏳ 删除中..." : "🗑️ 删除"}
                    </button>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </>
  );
}