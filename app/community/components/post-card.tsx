import Link from "next/link";

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

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  isLiked: boolean;
  isFavorited: boolean;
  onLike: () => void;
  onFavorite: () => void;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds}秒前`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}分钟前`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}小时前`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays}天前`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}个月前`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears}年前`;
}

export default function PostCard({
  post,
  currentUserId,
  isLiked,
  isFavorited,
  onLike,
  onFavorite,
}: PostCardProps) {
  const authorName = post.profiles?.display_name || "匿名用户";
  const timeAgo = formatTimeAgo(post.created_at);

  const excerpt = post.description || post.content.slice(0, 100) + "...";

  return (
    <article className="group flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
      {/* Card Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Author Avatar */}
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10">
            {post.profiles?.avatar_url ? (
              <img
                src={post.profiles.avatar_url}
                alt={authorName}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-lg font-semibold text-primary">
                {authorName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <div className="font-medium text-card-foreground">{authorName}</div>
            <div className="text-xs text-muted">{timeAgo}</div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-muted">
          <div className="flex items-center gap-1">
            <span>👁️</span>
            <span>{post.view_count}</span>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="mb-4 flex-1">
        <h3 className="mb-2 text-lg font-semibold text-card-foreground line-clamp-2">
          <Link
            href={`/community/posts/${post.id}`}
            className="hover:text-primary"
          >
            {post.title}
          </Link>
        </h3>
        <p className="mb-4 text-sm text-muted line-clamp-2">
          {excerpt}
        </p>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-surface px-2.5 py-1 text-xs text-muted border border-border"
              >
                #{tag}
              </span>
            ))}
            {post.tags.length > 3 && (
              <span className="rounded-full bg-surface px-2.5 py-1 text-xs text-muted border border-border">
                +{post.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer - Actions */}
      <div className="mt-auto pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          {/* Interaction Stats */}
          <div className="flex items-center gap-4 text-sm">
            <button
              onClick={onLike}
              disabled={!currentUserId}
              className={`flex items-center gap-1.5 transition-all ${
                !currentUserId
                  ? "cursor-not-allowed text-muted"
                  : isLiked
                  ? "text-red-500 hover:text-red-600"
                  : "text-muted hover:text-red-500"
              }`}
            >
              <span className="text-lg">{isLiked ? "❤️" : "🤍"}</span>
              <span>{post.like_count}</span>
            </button>

            <Link
              href={`/community/posts/${post.id}#comments`}
              className="flex items-center gap-1.5 text-muted hover:text-primary"
            >
              <span className="text-lg">💬</span>
              <span>{post.comment_count}</span>
            </Link>

            <button
              onClick={onFavorite}
              disabled={!currentUserId}
              className={`flex items-center gap-1.5 transition-all ${
                !currentUserId
                  ? "cursor-not-allowed text-muted"
                  : isFavorited
                  ? "text-yellow-500 hover:text-yellow-600"
                  : "text-muted hover:text-yellow-500"
              }`}
            >
              <span className="text-lg">{isFavorited ? "⭐" : "☆"}</span>
              <span>{post.favorite_count}</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Link
              href={`/community/posts/${post.id}`}
              className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-card-foreground transition-all hover:bg-surface hover:shadow-sm dark:bg-card"
            >
              查看详情
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}