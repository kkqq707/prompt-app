"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import PostCard from "./post-card";

interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  description?: string;
  tags?: string[];
  view_count: number;
  like_count: number;
  comment_count: number;
  favorite_count: number;
  created_at: string;
  profiles?: {
    id: string;
    display_name?: string;
    avatar_url?: string;
  };
}

interface PostListProps {
  posts: Post[];
  currentUserId?: string;
}

export default function PostList({ posts, currentUserId }: PostListProps) {
  const supabase = createClient();
  const [keyword, setKeyword] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "popular">("newest");
  const [data, setData] = useState<Post[]>(posts);
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [favoritedPosts, setFavoritedPosts] = useState<string[]>([]);

  // Extract all unique tags from posts
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    posts.forEach((post) => {
      post.tags?.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags);
  }, [posts]);

  const filteredPosts = useMemo(() => {
    let filtered = [...data];

    // Filter by keyword
    if (keyword.trim()) {
      const lowerKeyword = keyword.toLowerCase().trim();
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(lowerKeyword) ||
          post.description?.toLowerCase().includes(lowerKeyword) ||
          post.content.toLowerCase().includes(lowerKeyword) ||
          post.tags?.some((tag) => tag.toLowerCase().includes(lowerKeyword)) ||
          post.profiles?.display_name?.toLowerCase().includes(lowerKeyword)
      );
    }

    // Filter by tag
    if (selectedTag) {
      filtered = filtered.filter(
        (post) => post.tags?.includes(selectedTag)
      );
    }

    // Sort
    if (sortBy === "newest") {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      filtered.sort((a, b) => (b.like_count + b.comment_count) - (a.like_count + a.comment_count));
    }

    return filtered;
  }, [keyword, selectedTag, sortBy, data]);

  const handleLike = async (postId: string) => {
    if (!currentUserId) {
      alert("请先登录后再点赞");
      return;
    }

    const isLiked = likedPosts.includes(postId);
    setLikedPosts((prev) =>
      isLiked ? prev.filter((id) => id !== postId) : [...prev, postId]
    );

    try {
      if (isLiked) {
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("user_id", currentUserId)
          .eq("post_id", postId);

        if (error) throw error;

        // Update local data
        setData((prev) =>
          prev.map((post) =>
            post.id === postId
              ? { ...post, like_count: Math.max(0, post.like_count - 1) }
              : post
          )
        );
      } else {
        const { error } = await supabase
          .from("post_likes")
          .insert([{ user_id: currentUserId, post_id: postId }]);

        if (error) throw error;

        // Update local data
        setData((prev) =>
          prev.map((post) =>
            post.id === postId
              ? { ...post, like_count: post.like_count + 1 }
              : post
          )
        );
      }
    } catch (error) {
      console.error("点赞操作失败:", error);
      alert("操作失败，请重试");
      // Revert UI state
      setLikedPosts((prev) =>
        isLiked ? [...prev, postId] : prev.filter((id) => id !== postId)
      );
    }
  };

  const handleFavorite = async (postId: string) => {
    if (!currentUserId) {
      alert("请先登录后再收藏");
      return;
    }

    const isFavorited = favoritedPosts.includes(postId);
    setFavoritedPosts((prev) =>
      isFavorited ? prev.filter((id) => id !== postId) : [...prev, postId]
    );

    try {
      if (isFavorited) {
        const { error } = await supabase
          .from("post_favorites")
          .delete()
          .eq("user_id", currentUserId)
          .eq("post_id", postId);

        if (error) throw error;

        // Update local data
        setData((prev) =>
          prev.map((post) =>
            post.id === postId
              ? { ...post, favorite_count: Math.max(0, post.favorite_count - 1) }
              : post
          )
        );
      } else {
        const { error } = await supabase
          .from("post_favorites")
          .insert([{ user_id: currentUserId, post_id: postId }]);

        if (error) throw error;

        // Update local data
        setData((prev) =>
          prev.map((post) =>
            post.id === postId
              ? { ...post, favorite_count: post.favorite_count + 1 }
              : post
          )
        );
      }
    } catch (error) {
      console.error("收藏操作失败:", error);
      alert("操作失败，请重试");
      // Revert UI state
      setFavoritedPosts((prev) =>
        isFavorited ? [...prev, postId] : prev.filter((id) => id !== postId)
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Section */}
      <div className="rounded-xl border border-border bg-gradient-to-r from-primary/5 to-secondary/5 p-6 shadow-sm">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-card-foreground">搜索与筛选</h3>
          <p className="mt-1 text-sm text-muted">通过关键词和标签快速找到感兴趣的帖子</p>
        </div>

        <div className="space-y-4">
          {/* Search Input */}
          <div>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="h-5 w-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索帖子标题、内容、标签或作者..."
                className="w-full rounded-lg border border-border bg-white py-3 pl-10 pr-4 text-sm text-card-foreground placeholder-muted transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-card"
              />
            </div>
          </div>

          {/* Tags Filter */}
          {allTags.length > 0 && (
            <div>
              <div className="mb-2 text-sm font-medium text-card-foreground">按标签筛选</div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedTag(null)}
                  className={`rounded-full px-4 py-1.5 text-sm transition-all ${
                    !selectedTag
                      ? "bg-primary text-white"
                      : "bg-surface text-muted hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  全部
                </button>
                {allTags.slice(0, 10).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                    className={`rounded-full px-4 py-1.5 text-sm transition-all ${
                      tag === selectedTag
                        ? "bg-primary text-white"
                        : "bg-surface text-muted hover:bg-primary/10 hover:text-primary"
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sort Options */}
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-card-foreground">排序方式</div>
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy("newest")}
                className={`rounded-lg px-4 py-2 text-sm transition-all ${
                  sortBy === "newest"
                    ? "bg-primary text-white"
                    : "border border-border bg-white text-card-foreground hover:bg-surface dark:bg-card"
                }`}
              >
                最新发布
              </button>
              <button
                onClick={() => setSortBy("popular")}
                className={`rounded-lg px-4 py-2 text-sm transition-all ${
                  sortBy === "popular"
                    ? "bg-primary text-white"
                    : "border border-border bg-white text-card-foreground hover:bg-surface dark:bg-card"
                }`}
              >
                最受欢迎
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <div className="text-sm text-muted">
            找到 <span className="font-semibold text-primary">{filteredPosts.length}</span> 个帖子
          </div>
          {(keyword || selectedTag) && (
            <button
              onClick={() => {
                setKeyword("");
                setSelectedTag(null);
              }}
              className="text-sm text-primary hover:text-primary-dark"
            >
              清除筛选
            </button>
          )}
        </div>
      </div>

      {/* Posts Grid */}
      {filteredPosts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              isLiked={likedPosts.includes(post.id)}
              isFavorited={favoritedPosts.includes(post.id)}
              onLike={() => handleLike(post.id)}
              onFavorite={() => handleFavorite(post.id)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
          <div className="mx-auto max-w-md">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <span className="text-2xl">🔍</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-card-foreground">
              未找到匹配的帖子
            </h3>
            <p className="mb-6 text-sm text-muted">
              尝试调整搜索关键词或筛选条件，或浏览全部帖子
            </p>
            <button
              onClick={() => {
                setKeyword("");
                setSelectedTag(null);
              }}
              className="inline-flex items-center justify-center rounded-lg border border-border bg-white px-5 py-2.5 text-sm font-medium text-card-foreground transition-all hover:bg-surface hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-card"
            >
              重置所有筛选
            </button>
          </div>
        </div>
      )}
    </div>
  );
}