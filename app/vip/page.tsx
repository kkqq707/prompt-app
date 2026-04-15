import Link from "next/link";

export default function VipPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 p-6 flex items-center justify-center">
      <div className="max-w-md rounded-3xl bg-card border border-border p-8 text-center shadow-xl">
        <div className="mb-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary">
            <span className="text-2xl text-white">🎉</span>
          </div>
          <h1 className="text-2xl font-bold text-card-foreground">VIP功能已升级</h1>
          <p className="mt-2 text-muted">
            感谢您一直以来的支持！我们已将VIP功能升级为完全免费的社区功能。
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <h3 className="font-semibold text-primary">🚀 全新社区功能</h3>
            <p className="mt-1 text-sm text-muted">
              现在所有用户都可以免费使用所有提示词，并参与社区讨论。
            </p>
          </div>

          <div className="rounded-xl border border-secondary/20 bg-secondary/5 p-4">
            <h3 className="font-semibold text-secondary">💬 社区互动</h3>
            <p className="mt-1 text-sm text-muted">
              分享你的AI提示词经验，与社区成员交流互动。
            </p>
          </div>

          <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
            <h3 className="font-semibold text-accent">❤️ 完全免费</h3>
            <p className="mt-1 text-sm text-muted">
              所有内容现在都免费开放，无需会员或付费解锁。
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/community"
            className="rounded-2xl bg-gradient-to-r from-primary to-primary-dark px-6 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg"
          >
            探索社区
          </Link>
          <Link
            href="/"
            className="rounded-2xl border border-border bg-card px-6 py-3 text-sm font-medium hover:bg-surface"
          >
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}