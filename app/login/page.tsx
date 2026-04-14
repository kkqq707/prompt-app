"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      alert("登录失败：" + error.message);
      return;
    }

    alert("登录成功");
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="w-full max-w-md rounded-3xl bg-card border border-border p-8 shadow-2xl shadow-primary/10">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">登录</h1>
        <p className="mt-3 text-base text-muted">
          登录后可收藏提示词、购买单条内容或开通会员。
        </p>

        <form onSubmit={handleLogin} className="mt-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-card-foreground">
              邮箱
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              onChange={(e) => setPassword(e.target.value)}
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