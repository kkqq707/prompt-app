"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function FavoriteButton({
  promptId,
  initialFavorited,
}: {
  promptId: string;
  initialFavorited: boolean;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  async function handleToggleFavorite() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("请先登录后再收藏");
      router.push("/login");
      return;
    }

    setLoading(true);

    if (favorited) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("prompt_id", promptId);

      setLoading(false);

      if (error) {
        alert("取消收藏失败：" + error.message);
        return;
      }

      setFavorited(false);
      router.refresh();
      return;
    }

    const { error } = await supabase.from("favorites").insert([
      {
        user_id: user.id,
        prompt_id: promptId,
      },
    ]);

    setLoading(false);

    if (error) {
      alert("收藏失败：" + error.message);
      return;
    }

    setFavorited(true);
    router.refresh();
  }

  return (
    <button
      onClick={handleToggleFavorite}
      disabled={loading}
      className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium disabled:opacity-60"
    >
      {loading ? "处理中..." : favorited ? "取消收藏" : "收藏"}
    </button>
  );
}