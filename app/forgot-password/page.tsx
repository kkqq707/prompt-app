"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { getAuthErrorMessage } from "@/utils/auth-errors";

export default function ForgotPasswordPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const redirectTo = `${window.location.origin}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    setLoading(false);

    if (error) {
      setError(getAuthErrorMessage(error));
      return;
    }

    setSuccess("重置密码邮件已发送，请检查您的邮箱");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 sm:p-6">
      <div className="mx-auto max-w-md rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-2xl shadow-primary/10">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">找回密码</h1>
        <p className="mt-3 text-base text-muted">
          输入注册邮箱，我们会发送重置密码链接到您的邮箱。
        </p>

        {error && (
          <div className="mt-6 mb-2 rounded-2xl border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
            <div className="flex items-center">
              <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">发送失败</span>
            </div>
            <p className="mt-2 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-6 mb-2 rounded-2xl border border-green-300 bg-green-50 p-4 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
            <div className="flex items-center">
              <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">发送成功</span>
            </div>
            <p className="mt-2 text-sm">{success}</p>
          </div>
        )}

        <form onSubmit={handleResetPassword} className="mt-6 space-y-5">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-card-foreground">
              注册邮箱
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); setSuccess(null); }}
              placeholder="请输入注册邮箱"
              className="w-full rounded-2xl border border-border bg-background px-5 py-3.5 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-2xl bg-gradient-to-r from-primary to-primary-dark py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:shadow-primary/30 disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="loading-spinner h-4 w-4 border-2 border-white"></span>
                发送中...
              </span>
            ) : "发送重置邮件"}
          </button>
        </form>

        <div className="mt-8 flex items-center justify-between text-sm">
          <Link href="/login" className="text-muted transition-all hover:text-primary">
            ← 返回登录
          </Link>
          <Link
            href="/signup"
            className="font-semibold text-primary transition-all hover:text-primary-dark"
          >
            没有账号？去注册 →
          </Link>
        </div>

        {/* Help Note */}
        <div className="mt-8 rounded-2xl bg-gradient-to-r from-background to-primary/5 border border-primary/20 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <span className="text-sm">📧</span>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-card-foreground">注意事项</h4>
              <ul className="mt-1 space-y-1 text-xs text-muted">
                <li>• 请检查垃圾邮件文件夹</li>
                <li>• 重置链接通常在5分钟内送达</li>
                <li>• 链接有效期为24小时</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}