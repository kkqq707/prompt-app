"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { getAuthErrorMessage } from "@/utils/auth-errors";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(getAuthErrorMessage(error));
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="w-full max-w-md rounded-3xl bg-card border border-border p-8 shadow-2xl shadow-primary/10">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">登录</h1>
        <p className="mt-3 text-base text-muted">
          登录后可收藏提示词、发布社区帖子和参与讨论。
        </p>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
            <div className="flex items-center">
              <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">登录失败</span>
            </div>
            <p className="mt-2 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="mt-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-card-foreground">
              邮箱
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              placeholder="请输入邮箱"
              className="mt-2 w-full rounded-2xl border border-border bg-background px-5 py-3.5 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-card-foreground">
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              placeholder="请输入密码"
              className="mt-2 w-full rounded-2xl border border-border bg-background px-5 py-3.5 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-2xl bg-gradient-to-r from-primary to-primary-dark py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:shadow-primary/30 disabled:opacity-60"
          >
            {loading ? "⏳ 登录中..." : "🚀 登录"}
          </button>
        </form>

        <div className="mt-8 flex items-center justify-between text-sm">
          <Link href="/" className="text-muted transition-all hover:text-primary">
            ← 返回首页
          </Link>

          <Link
            href="/signup"
            className="font-semibold text-primary transition-all hover:text-primary-dark"
          >
            没有账号？去注册 →
          </Link>
        </div>
      </div>
    </div>
  );
}