"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

interface FavoriteButtonProps {
  postId: string;
  currentUserId?: string;
  initialFavorited: boolean;
  favoriteCount: number;
}

export default function FavoriteButton({
  postId,
  currentUserId,
  initialFavorited,
  favoriteCount,
}: FavoriteButtonProps) {
  const supabase = createClient();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [count, setCount] = useState(favoriteCount);
  const [loading, setLoading] = useState(false);

  const handleFavorite = async () => {
    if (!currentUserId) {
      alert("请先登录后再收藏");
      return;
    }

    setLoading(true);
    const wasFavorited = favorited;

    // Optimistic update
    setFavorited(!wasFavorited);
    setCount(wasFavorited ? Math.max(0, count - 1) : count + 1);

    try {
      if (wasFavorited) {
        const { error } = await supabase
          .from("post_favorites")
          .delete()
          .eq("user_id", currentUserId)
          .eq("post_id", postId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("post_favorites")
          .insert([{ user_id: currentUserId, post_id: postId }]);

        if (error) throw error;
      }
    } catch (error) {
      console.error("收藏操作失败:", error);
      alert("操作失败，请重试");

      // Revert optimistic update
      setFavorited(wasFavorited);
      setCount(wasFavorited ? count + 1 : Math.max(0, count - 1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleFavorite}
      disabled={loading || !currentUserId}
      className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all ${
        favorited
          ? "border-yellow-500 bg-yellow-50 text-yellow-600 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300"
          : "border border-border bg-white text-card-foreground hover:bg-surface dark:bg-card"
      } ${!currentUserId ? "cursor-not-allowed opacity-50" : ""}`}
    >
      {loading ? (
        <>
          <span className="loading-spinner h-4 w-4"></span>
          <span>处理中</span>
        </>
      ) : favorited ? (
        <>
          <span>⭐</span>
          <span>已收藏 ({count})</span>
        </>
      ) : (
        <>
          <span>☆</span>
          <span>收藏 ({count})</span>
        </>
      )}
    </button>
  );
}