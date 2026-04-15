"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

interface DeleteButtonProps {
  postId: string;
  postTitle?: string;
}

export default function DeleteButton({ postId, postTitle }: DeleteButtonProps) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    if (!postId) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("请先登录后再删除帖子");
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      // First check if user is the author
      const { data: post, error: fetchError } = await supabase
        .from("community_posts")
        .select("user_id")
        .eq("id", postId)
        .single();

      if (fetchError) throw fetchError;

      if (post.user_id !== user.id) {
        alert("您没有权限删除此帖子");
        return;
      }

      // Delete the post
      const { error } = await supabase
        .from("community_posts")
        .delete()
        .eq("id", postId)
        .eq("user_id", user.id);

      if (error) throw error;

      alert("帖子删除成功！");
      router.push("/community");
      router.refresh();
    } catch (error: any) {
      console.error("删除失败:", error);
      alert(`删除失败：${error.message || "请重试"}`);
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-3xl bg-card border border-border p-6 shadow-2xl">
          <h3 className="text-lg font-bold text-card-foreground">确认删除</h3>
          <p className="mt-2 text-sm text-muted">
            确定要删除帖子"{postTitle || "此帖子"}"吗？此操作不可恢复。
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setShowConfirm(false)}
              disabled={loading}
              className="rounded-2xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-card-foreground transition-all hover:bg-surface dark:bg-card"
            >
              取消
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 transition-all hover:bg-red-100 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
            >
              {loading ? "删除中..." : "确认删除"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      disabled={loading}
      className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 transition-all hover:bg-red-100 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
    >
      {loading ? "处理中..." : "🗑️ 删除"}
    </button>
  );
}