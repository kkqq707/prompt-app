"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { notFound } from "next/navigation";

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient();
  const router = useRouter();
  const [postId, setPostId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notFoundError, setNotFoundError] = useState(false);

  useEffect(() => {
    async function loadPost() {
      const { id } = await params;
      setPostId(id);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("请先登录后再编辑帖子");
        router.push("/login");
        return;
      }

      // Fetch post data
      const { data: post, error } = await supabase
        .from("community_posts")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !post) {
        setNotFoundError(true);
        return;
      }

      // Check if user is the author
      if (post.user_id !== user.id) {
        alert("您没有权限编辑此帖子");
        router.push(`/community/posts/${id}`);
        return;
      }

      // Populate form fields
      setTitle(post.title);
      setDescription(post.description || "");
      setContent(post.content);
      setTags(post.tags ? post.tags.join(", ") : "");
      setLoading(false);
    }

    loadPost();
  }, [params, router, supabase]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!postId) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("请先登录后再更新帖子");
      router.push("/login");
      return;
    }

    if (!title.trim()) {
      alert("帖子标题不能为空");
      return;
    }

    if (!content.trim()) {
      alert("帖子内容不能为空");
      return;
    }

    setSubmitting(true);

    const tagArray = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const { error } = await supabase
        .from("community_posts")
        .update({
          title: title.trim(),
          description: description.trim(),
          content: content.trim(),
          tags: tagArray.length > 0 ? tagArray : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", postId)
        .eq("user_id", user.id); // Ensure user is the author

      if (error) throw error;

      alert("帖子更新成功！");
      router.push(`/community/posts/${postId}`);
      router.refresh();
    } catch (error: any) {
      console.error("更新失败:", error);
      alert(`更新失败：${error.message || "请重试"}`);
    } finally {
      setSubmitting(false);
    }
  }

  if (notFoundError) {
    return notFound();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 p-4 sm:p-6">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-center py-12">
            <div className="loading-spinner h-8 w-8"></div>
            <span className="ml-3 text-sm text-muted">加载中...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 p-4 sm:p-6">
      <div className="mx-auto max-w-3xl">
        {/* Navigation */}
        <div className="mb-6 flex flex-wrap gap-3">
          <Link
            href={`/community/posts/${postId}`}
            className="rounded-2xl border border-border bg-card px-5 py-2.5 text-sm font-medium transition-all hover:border-primary hover:bg-primary/5 hover:text-primary"
          >
            ← 返回帖子
          </Link>
          <Link
            href="/community"
            className="rounded-2xl border border-border bg-card px-5 py-2.5 text-sm font-medium transition-all hover:border-primary hover:bg-primary/5 hover:text-primary"
          >
            返回社区
          </Link>
        </div>

        {/* Form Container */}
        <div className="rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-lg shadow-primary/5">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            编辑帖子
          </h1>
          <p className="mt-2 text-sm text-muted">
            更新你的帖子内容
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-card-foreground">
                帖子标题 <span className="text-red-500">*</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：分享一个超好用的ChatGPT提示词编写技巧"
                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-card-foreground placeholder-muted transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-card"
                required
                maxLength={200}
              />
              <div className="text-xs text-muted">
                简洁明了地概括帖子内容，最多200字符
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-card-foreground">
                简要描述（可选）
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="简要说明帖子的主要内容，帮助用户快速了解"
                rows={3}
                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-card-foreground placeholder-muted transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-card"
                maxLength={500}
              />
              <div className="text-xs text-muted">
                可选，用于在帖子列表中显示，最多500字符
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-card-foreground">
                帖子内容 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="详细分享你的经验、技巧或提问。可以包括：
• 具体的提示词示例
• 使用场景说明
• 效果对比
• 遇到的问题和解决方案
• 任何你想分享的内容"
                rows={12}
                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-card-foreground placeholder-muted transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-card"
                required
              />
              <div className="text-xs text-muted">
                详细分享你的经验，支持Markdown格式
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-card-foreground">
                标签（可选，逗号分隔）
              </label>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="例如：ChatGPT, 提示词技巧, 写作, 营销"
                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-card-foreground placeholder-muted transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-card"
              />
              <div className="text-xs text-muted">
                添加相关标签，方便其他用户发现你的帖子
              </div>
            </div>

            {/* Tips */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <h3 className="mb-2 text-sm font-semibold text-primary">
                📝 编辑指南
              </h3>
              <ul className="space-y-1 text-xs text-muted">
                <li>• 确保更新后的内容仍然符合社区规范</li>
                <li>• 可以修正错别字或补充更多信息</li>
                <li>• 更新标签可以帮助更多用户发现你的帖子</li>
              </ul>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-gradient-to-r from-primary to-primary-dark py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:shadow-primary/30 disabled:opacity-50"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="loading-spinner h-5 w-5 border-2"></span>
                    更新中...
                  </span>
                ) : (
                  "更新帖子"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}