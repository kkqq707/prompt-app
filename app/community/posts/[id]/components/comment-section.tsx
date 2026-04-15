"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

interface Comment {
  id: string;
  user_id: string;
  post_id: string;
  parent_id: string | null;
  content: string;
  depth: number;
  created_at: string;
  profiles?: {
    id: string;
    display_name?: string;
    avatar_url?: string;
  };
  replies?: Comment[];
}

interface CommentSectionProps {
  postId: string;
  currentUserId?: string;
}

export default function CommentSection({ postId, currentUserId }: CommentSectionProps) {
  const supabase = createClient();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const { data: commentsData, error } = await supabase
        .from("post_comments")
        .select(`
          *,
          profiles:user_id (
            id,
            display_name,
            avatar_url
          )
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Organize comments into nested structure
      const commentMap = new Map<string, Comment>();
      const rootComments: Comment[] = [];

      // First pass: create map and identify root comments
      commentsData?.forEach((comment) => {
        const commentWithReplies = { ...comment, replies: [] };
        commentMap.set(comment.id, commentWithReplies);

        if (!comment.parent_id) {
          rootComments.push(commentWithReplies);
        }
      });

      // Second pass: nest replies under their parents
      commentsData?.forEach((comment) => {
        if (comment.parent_id && commentMap.has(comment.parent_id)) {
          const parent = commentMap.get(comment.parent_id)!;
          parent.replies = parent.replies || [];
          parent.replies.push(commentMap.get(comment.id)!);
        }
      });

      setComments(rootComments);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) {
      alert("请先登录后再发表评论");
      return;
    }

    if (!newComment.trim()) {
      alert("评论内容不能为空");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("post_comments").insert([
        {
          user_id: currentUserId,
          post_id: postId,
          content: newComment.trim(),
          parent_id: null,
          depth: 0,
        },
      ]);

      if (error) throw error;

      setNewComment("");
      await fetchComments(); // Refresh comments
    } catch (error) {
      console.error("Failed to submit comment:", error);
      alert("评论发表失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!currentUserId) {
      alert("请先登录后再回复");
      return;
    }

    if (!replyContent.trim()) {
      alert("回复内容不能为空");
      return;
    }

    setSubmitting(true);
    try {
      // Get parent comment to determine depth
      const { data: parentComment } = await supabase
        .from("post_comments")
        .select("depth")
        .eq("id", parentId)
        .single();

      const depth = parentComment ? Math.min(parentComment.depth + 1, 1) : 1;

      const { error } = await supabase.from("post_comments").insert([
        {
          user_id: currentUserId,
          post_id: postId,
          content: replyContent.trim(),
          parent_id: parentId,
          depth,
        },
      ]);

      if (error) throw error;

      setReplyContent("");
      setReplyingTo(null);
      await fetchComments(); // Refresh comments
    } catch (error) {
      console.error("Failed to submit reply:", error);
      alert("回复发表失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  const renderComment = (comment: Comment, level = 0) => {
    const timeAgo = formatDistanceToNow(new Date(comment.created_at), {
      addSuffix: true,
      locale: zhCN,
    });

    return (
      <div key={comment.id} className={`${level > 0 ? "ml-6 sm:ml-8 mt-4" : "mt-6"}`}>
        <div className="rounded-xl border border-border bg-white p-4 dark:bg-card">
          {/* Comment Header */}
          <div className="mb-3 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10">
                {comment.profiles?.avatar_url ? (
                  <img
                    src={comment.profiles.avatar_url}
                    alt={comment.profiles.display_name || "匿名用户"}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-semibold text-primary">
                    {(comment.profiles?.display_name || "匿名用户").charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <div className="text-sm font-medium text-card-foreground">
                  {comment.profiles?.display_name || "匿名用户"}
                </div>
                <div className="text-xs text-muted">{timeAgo}</div>
              </div>
            </div>
          </div>

          {/* Comment Content */}
          <div className="mb-3">
            <p className="text-sm leading-6 text-card-foreground">
              {comment.content}
            </p>
          </div>

          {/* Comment Actions */}
          <div className="flex items-center gap-3">
            {level < 1 && (
              <button
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="text-xs text-primary hover:text-primary-dark"
              >
                {replyingTo === comment.id ? "取消回复" : "回复"}
              </button>
            )}
            {level >= 1 && (
              <span className="text-xs text-muted">最多回复两层</span>
            )}
          </div>

          {/* Reply Form */}
          {replyingTo === comment.id && (
            <div className="mt-4">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="写下你的回复..."
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-card-foreground placeholder-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-card"
                rows={2}
              />
              <div className="mt-2 flex justify-end gap-2">
                <button
                  onClick={() => setReplyingTo(null)}
                  className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-card-foreground transition-all hover:bg-surface dark:bg-card"
                >
                  取消
                </button>
                <button
                  onClick={() => handleSubmitReply(comment.id)}
                  disabled={submitting}
                  className="rounded-lg bg-gradient-to-r from-primary to-primary-dark px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:shadow-md disabled:opacity-50"
                >
                  {submitting ? "提交中..." : "提交回复"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Nested Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4">
            {comment.replies.map((reply) => renderComment(reply, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="loading-spinner h-8 w-8"></div>
        <span className="ml-2 text-sm text-muted">加载评论中...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Comment Form */}
      {currentUserId ? (
        <form onSubmit={handleSubmitComment} className="mb-8">
          <div className="mb-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="分享你的想法..."
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-card-foreground placeholder-muted transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-card"
              rows={3}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="rounded-xl bg-gradient-to-r from-primary to-primary-dark px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:shadow-primary/30 disabled:opacity-50"
            >
              {submitting ? "提交中..." : "发表评论"}
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-8 rounded-xl border border-border bg-gradient-to-r from-primary/5 to-secondary/5 p-6 text-center">
          <p className="mb-3 text-sm text-muted">
            登录后即可参与讨论，分享你的想法
          </p>
          <div className="flex justify-center gap-3">
            <a
              href="/login"
              className="rounded-xl border border-border bg-white px-4 py-2 text-sm font-medium text-card-foreground transition-all hover:bg-surface dark:bg-card"
            >
              登录
            </a>
            <a
              href="/signup"
              className="rounded-xl bg-gradient-to-r from-primary to-primary-dark px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:shadow-primary/30"
            >
              注册
            </a>
          </div>
        </div>
      )}

      {/* Comments List */}
      {comments.length > 0 ? (
        <div>{comments.map((comment) => renderComment(comment))}</div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center">
          <div className="mx-auto max-w-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <span className="text-xl">💬</span>
            </div>
            <h3 className="mb-2 text-sm font-semibold text-card-foreground">
              还没有评论
            </h3>
            <p className="text-xs text-muted">
              {currentUserId
                ? "成为第一个评论者，分享你的想法吧！"
                : "登录后即可发表评论"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}