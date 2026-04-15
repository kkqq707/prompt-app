"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { type PromptItem } from "@/data/prompts";

export default function FavoritePromptList({
  initialData,
}: {
  initialData: PromptItem[];
}) {
  const supabase = createClient();
  const router = useRouter();

  const [data, setData] = useState<PromptItem[]>(initialData);
  const [removingId, setRemovingId] = useState<string | null>(null);


  async function handleRemoveFavorite(promptId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("请先登录");
      router.push("/login");
      return;
    }

    setRemovingId(promptId);

    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("prompt_id", promptId);

    if (error) {
      alert("取消收藏失败：" + error.message);
      setRemovingId(null);
      return;
    }

    setData((prev) => prev.filter((item) => item.id !== promptId));
    setRemovingId(null);
  }

  if (data.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">我的收藏</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          你还没有收藏任何提示词，先去首页逛逛吧。
        </p>

        <Link
          href="/"
          className="mt-6 inline-block rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white"
        >
          去首页看看
        </Link>
      </div>
    );
  }

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {data.map((item) => {

        return (
          <article key={item.id} className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="text-xs text-slate-500">
              {item.category} · {item.model}
            </div>

            <h2 className="mt-1 text-xl font-semibold text-slate-900">
              {item.title}
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {item.description}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {item.tags?.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
              <pre className="whitespace-pre-wrap font-sans leading-6">
                {item.prompt}
              </pre>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={() => handleRemoveFavorite(item.id)}
                disabled={removingId === item.id}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium"
              >
                {removingId === item.id ? "处理中..." : "取消收藏"}
              </button>

              <button
                onClick={() => navigator.clipboard.writeText(item.prompt)}
                className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
              >
                复制提示词
              </button>

              <Link
                href={`/prompts/${item.id}`}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium"
              >
                查看详情
              </Link>
            </div>
          </article>
        );
      })}
    </section>
  );
}