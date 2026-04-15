"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { getAuthErrorMessage } from "@/utils/auth-errors";

export default function SignupPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    if (password.length < 6) {
      setError("密码至少需要 6 位");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(getAuthErrorMessage(error));
      return;
    }

    setError("注册成功，请登录");
    // 延迟跳转，让用户看到成功消息
    setTimeout(() => {
      router.push("/login");
      router.refresh();
    }, 1500);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-secondary/5 p-6">
      <div className="w-full max-w-md rounded-3xl bg-card border border-border p-8 shadow-2xl shadow-primary/10">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">注册</h1>
        <p className="mt-3 text-base text-muted">
          注册后可收藏提示词、发布社区帖子和参与讨论。
        </p>

        {error && (
          <div className={`mt-6 mb-2 rounded-2xl border p-4 ${
            error.includes("成功")
              ? "border-green-300 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300"
              : "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
          }`}>
            <div className="flex items-center">
              <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                {error.includes("成功") ? (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                )}
              </svg>
              <span className="font-medium">{error.includes("成功") ? "注册成功" : "注册失败"}</span>
            </div>
            <p className="mt-2 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSignup} className="mt-6 space-y-5">
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
              placeholder="请输入密码（至少 6 位）"
              className="mt-2 w-full rounded-2xl border border-border bg-background px-5 py-3.5 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-card-foreground">
              确认密码
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
              placeholder="请再次输入密码"
              className="mt-2 w-full rounded-2xl border border-border bg-background px-5 py-3.5 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-2xl bg-gradient-to-r from-primary to-primary-dark py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:shadow-primary/30 disabled:opacity-60"
          >
            {loading ? "⏳ 注册中..." : "🚀 注册"}
          </button>
        </form>

        <div className="mt-8 flex items-center justify-between text-sm">
          <Link href="/" className="text-muted transition-all hover:text-primary">
            ← 返回首页
          </Link>

          <Link
            href="/login"
            className="font-semibold text-primary transition-all hover:text-primary-dark"
          >
            已有账号？去登录 →
          </Link>
        </div>
      </div>
    </div>
  );
}