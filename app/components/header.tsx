import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import UserMenu from "./user-menu";

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-3 text-xl font-bold transition-all hover:opacity-80"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary">
              <span className="text-lg font-bold text-white">AI</span>
            </div>
            <span className="hidden bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent sm:inline">
              Prompt
            </span>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium text-muted transition-colors hover:text-primary"
          >
            首页
          </Link>
          <Link
            href="/vip"
            className="text-sm font-medium text-muted transition-colors hover:text-primary"
          >
            开通会员
          </Link>
          {user && (
            <Link
              href="/favorites"
              className="text-sm font-medium text-muted transition-colors hover:text-primary"
            >
              我的收藏
            </Link>
          )}
        </nav>

        {/* User Menu & Auth Buttons */}
        <div className="flex items-center gap-4">
          {user ? (
            <UserMenu user={user} />
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="rounded-2xl border border-border bg-card px-5 py-2.5 text-sm font-medium transition-all hover:border-primary hover:bg-primary/5 hover:text-primary"
              >
                登录
              </Link>
              <Link
                href="/signup"
                className="rounded-2xl bg-gradient-to-r from-primary to-primary-dark px-5 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg hover:shadow-primary/30"
              >
                注册
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}