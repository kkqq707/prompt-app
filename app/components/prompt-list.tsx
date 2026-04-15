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
}: {
  initialData: PromptItem[];
  canManage: boolean;
  initialFavoriteIds?: string[];
  showFavoriteButton?: boolean;
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
      const lowerKeyword = keyword.toLowerCase().trim();
      const modelStr = item.model || '';
      const categoryStr = item.category || '';
      const matchKeyword =
        keyword.trim() === "" ||
        item.title.toLowerCase().includes(lowerKeyword) ||
        item.description.toLowerCase().includes(lowerKeyword) ||
        categoryStr.toLowerCase().includes(lowerKeyword) ||
        modelStr.toLowerCase().includes(lowerKeyword) ||
        item.tags?.some((tag) => tag.toLowerCase().includes(lowerKeyword)) ||
        item.prompt.toLowerCase().includes(lowerKeyword);

      const targetCategory = category.toLowerCase().trim();
      const categoryParts = categoryStr.split(/[,/\s]+/).map(part => part.trim().toLowerCase()).filter(part => part.length > 0);
      const matchCategory = category === "全部分类" || categoryParts.some(part => part === targetCategory);

      const targetModel = model.toLowerCase().trim();
      const modelParts = modelStr.split(/[,/\s]+/).map(part => part.trim().toLowerCase()).filter(part => part.length > 0);
      const matchModel = model === "全部模型" || modelParts.some(part => part === targetModel);

      return matchKeyword && matchCategory && matchModel;
    });
  }, [keyword, category, model, data]);

  return (
    <>
      {/* Search & Filter Section */}
      <div className="mb-8">
        <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 p-8 shadow-lg">
          <div className="mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">搜索与筛选提示词</h2>
            <p className="mt-2 text-sm text-muted">通过关键词、分类和AI模型快速定位您需要的提示词</p>
          </div>

          <div className="space-y-4 md:space-y-0 md:flex md:items-end md:gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium text-card-foreground">
                关键词搜索
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full rounded-lg border border-border bg-white py-3 pl-10 pr-4 text-sm text-card-foreground placeholder-muted transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-card"
                  placeholder="搜索提示词标题、描述、标签..."
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium text-card-foreground">
                分类
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-border bg-white py-3 px-4 text-sm text-card-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-card"
              >
                <option>全部分类</option>
                <option>写作</option>
                <option>营销</option>
                <option>编程</option>
                <option>办公</option>
                <option>会议</option>
                <option>通用</option>
              </select>
            </div>

            {/* Model Filter */}
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium text-card-foreground">
                AI模型
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full rounded-lg border border-border bg-white py-3 px-4 text-sm text-card-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-card"
              >
                <option>全部模型</option>
                <option>ChatGPT</option>
                <option>Claude</option>
                <option>Gemini</option>
                <option>deepseek</option>
                <option>豆包</option>
                <option>kimi</option>
              </select>
            </div>

            {/* Reset Button */}
            <div className="pt-2">
              <button
                onClick={() => {
                  setKeyword("");
                  setCategory("全部分类");
                  setModel("全部模型");
                }}
                className="w-full rounded-lg border border-border bg-white py-3 px-4 text-sm font-medium text-card-foreground transition-all hover:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-card md:w-auto"
              >
                重置筛选
              </button>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-6 flex items-center justify-between border-t border-border pt-6">
            <div className="text-sm text-muted">
              找到 <span className="font-semibold text-primary">{filteredPrompts.length}</span> 条提示词
            </div>
            <div className="text-xs text-muted">
              共 <span className="font-medium">{data.length}</span> 条
            </div>
          </div>
        </div>
      </div>

      {/* Prompts Grid */}
      {filteredPrompts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPrompts.map((item) => {
            // 所有内容现在都免费，无需锁定逻辑

            return (
              <article
                key={item.id}
                className="group flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
              >
                {/* Card Header */}
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                      {item.category}
                    </span>
                    <span className="rounded-md bg-secondary/10 px-2.5 py-1 text-xs font-medium text-secondary">
                      {item.model}
                    </span>
                  </div>

                </div>

                {/* Card Content */}
                <div className="mb-4 flex-1">
                  <h3 className="mb-2 text-lg font-semibold text-card-foreground line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="mb-4 text-sm text-muted line-clamp-2">
                    {item.description}
                  </p>

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-1.5">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-surface px-2.5 py-1 text-xs text-muted border border-border"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Prompt Preview */}
                  <div className="rounded-lg bg-surface border border-border p-4">
                    <div className="relative">
                      <pre className="whitespace-pre-wrap break-words font-sans text-sm text-card-foreground line-clamp-3">
                        {item.prompt?.slice(0, 180)}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Card Footer - Actions */}
                <div className="mt-auto pt-4 border-t border-border">
                  <div className="flex flex-wrap gap-2">
                    {/* Favorite Button */}
                    {showFavoriteButton && (
                      <button
                        onClick={() => handleToggleFavorite(item.id)}
                        disabled={togglingFavoriteId === item.id}
                        className="inline-flex items-center justify-center rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-card-foreground transition-all hover:bg-surface hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60 dark:bg-card"
                      >
                        {togglingFavoriteId === item.id ? (
                          <>
                            <span className="loading-spinner mr-1.5 h-3 w-3"></span>
                            处理中
                          </>
                        ) : favoriteIds.includes(item.id) ? (
                          <>
                            <span className="mr-1.5 text-red-500">❤️</span>
                            已收藏
                          </>
                        ) : (
                          <>
                            <span className="mr-1.5">🤍</span>
                            收藏
                          </>
                        )}
                      </button>
                    )}

                    {/* Action Buttons */}
                    <Link
                      href={`/prompts/${item.id}`}
                      className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-primary to-primary-dark px-3 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      🔍 详情
                    </Link>

                    {/* Admin Actions */}
                    {canManage && (
                      <>
                        <Link
                          href={`/prompts/${item.id}/edit`}
                          className="inline-flex items-center justify-center rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-card-foreground transition-all hover:bg-surface hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-card"
                        >
                          ✏️ 编辑
                        </Link>
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-all hover:bg-red-100 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:opacity-60 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
                        >
                          {deletingId === item.id ? (
                            <>
                              <span className="loading-spinner mr-1.5 h-3 w-3 border-red-600"></span>
                              删除中
                            </>
                          ) : (
                            "🗑️ 删除"
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
          <div className="mx-auto max-w-md">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <span className="text-2xl">🔍</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-card-foreground">未找到匹配的提示词</h3>
            <p className="mb-6 text-sm text-muted">
              尝试调整搜索关键词或筛选条件，或浏览全部提示词
            </p>
            <button
              onClick={() => {
                setKeyword("");
                setCategory("全部分类");
                setModel("全部模型");
              }}
              className="inline-flex items-center justify-center rounded-lg border border-border bg-white px-5 py-2.5 text-sm font-medium text-card-foreground transition-all hover:bg-surface hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-card"
            >
              重置所有筛选
            </button>
          </div>
        </div>
      )}
    </>
  );
}