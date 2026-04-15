"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

interface LikeButtonProps {
  postId: string;
  currentUserId?: string;
  initialLiked: boolean;
  likeCount: number;
}

export default function LikeButton({
  postId,
  currentUserId,
  initialLiked,
  likeCount,
}: LikeButtonProps) {
  const supabase = createClient();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(likeCount);
  const [loading, setLoading] = useState(false);

  const handleLike = async () => {
    if (!currentUserId) {
      alert("请先登录后再点赞");
      return;
    }

    setLoading(true);
    const wasLiked = liked;

    // Optimistic update
    setLiked(!wasLiked);
    setCount(wasLiked ? Math.max(0, count - 1) : count + 1);

    try {
      if (wasLiked) {
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("user_id", currentUserId)
          .eq("post_id", postId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("post_likes")
          .insert([{ user_id: currentUserId, post_id: postId }]);

        if (error) throw error;
      }
    } catch (error) {
      console.error("点赞操作失败:", error);
      alert("操作失败，请重试");

      // Revert optimistic update
      setLiked(wasLiked);
      setCount(wasLiked ? count + 1 : Math.max(0, count - 1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={loading || !currentUserId}
      className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all ${
        liked
          ? "border-red-500 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300"
          : "border border-border bg-white text-card-foreground hover:bg-surface dark:bg-card"
      } ${!currentUserId ? "cursor-not-allowed opacity-50" : ""}`}
    >
      {loading ? (
        <>
          <span className="loading-spinner h-4 w-4"></span>
          <span>处理中</span>
        </>
      ) : liked ? (
        <>
          <span>❤️</span>
          <span>已点赞 ({count})</span>
        </>
      ) : (
        <>
          <span>🤍</span>
          <span>点赞 ({count})</span>
        </>
      )}
    </button>
  );
}