import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import UserMenu from "./user-menu";

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-white/95 backdrop-blur-lg transition-all dark:bg-card/95">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-3 text-xl font-bold transition-all hover:opacity-80"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary shadow-sm">
              <span className="text-sm font-bold text-white">AI</span>
            </div>
            <span className="hidden font-semibold text-card-foreground sm:inline-block">
              Prompt
            </span>
          </Link>

          {/* Navigation Links - Desktop */}
          <nav className="hidden md:flex items-center gap-1 ml-6">
            <Link
              href="/"
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-all hover:bg-surface hover:text-primary"
            >
              首页
            </Link>
            <Link
              href="/community"
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-all hover:bg-surface hover:text-primary"
            >
              社区
            </Link>
            {user && (
              <Link
                href="/favorites"
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-all hover:bg-surface hover:text-primary"
              >
                收藏
              </Link>
            )}
          </nav>
        </div>


        {/* User Menu & Auth Buttons */}
        <div className="flex items-center gap-3">
          {user ? (
            <UserMenu user={user} />
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-card-foreground transition-all hover:bg-surface hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-card"
              >
                登录
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-gradient-to-r from-primary to-primary-dark px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                注册
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="border-t border-border bg-white px-4 py-3 md:hidden dark:bg-card">
        <nav className="flex items-center justify-around">
          <Link
            href="/"
            className="flex flex-col items-center px-3 py-2 text-xs font-medium text-muted hover:text-primary"
          >
            <span className="mb-1">🏠</span>
            首页
          </Link>
          <Link
            href="/community"
            className="flex flex-col items-center px-3 py-2 text-xs font-medium text-muted hover:text-primary"
          >
            <span className="mb-1">💬</span>
            社区
          </Link>
          {user && (
            <Link
              href="/favorites"
              className="flex flex-col items-center px-3 py-2 text-xs font-medium text-muted hover:text-primary"
            >
              <span className="mb-1">❤️</span>
              收藏
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}