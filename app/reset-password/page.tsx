"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { getAuthErrorMessage } from "@/utils/auth-errors";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function initRecoverySession() {
      // 先看看当前是否已经有 session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setReady(true);
        return;
      }

      // Supabase 默认会把 token 放在 URL hash 里
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : "";

      const params = new URLSearchParams(hash);

      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      const type = params.get("type");

      // 只有 recovery 类型才是重置密码流程
      if (type === "recovery" && access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (error) {
          setInitError(getAuthErrorMessage(error));
          setTimeout(() => router.push("/forgot-password"), 2000);
          return;
        }

        // 清掉地址栏里的 token，避免暴露
        window.history.replaceState({}, document.title, "/reset-password");
        setReady(true);
        return;
      }

      setInitError("重置链接无效或已过期，请重新发送重置邮件");
      setTimeout(() => router.push("/forgot-password"), 2000);
    }

    initRecoverySession();
  }, [router, supabase]);

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setPasswordError("两次输入的密码不一致");
      return;
    }

    if (password.length < 6) {
      setPasswordError("密码至少 6 位");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      setPasswordError(getAuthErrorMessage(error));
      return;
    }

    setSuccess("密码重置成功，请重新登录");
    setTimeout(() => {
      router.push("/login");
      router.refresh();
    }, 1500);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 sm:p-6">
      <div className="mx-auto max-w-md rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-2xl shadow-primary/10">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">重置密码</h1>
        <p className="mt-3 text-base text-muted">
          请输入您的新密码。
        </p>

        {initError && (
          <div className="mt-6 mb-2 rounded-2xl border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
            <div className="flex items-center">
              <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">验证失败</span>
            </div>
            <p className="mt-2 text-sm">{initError}</p>
            <p className="mt-2 text-xs opacity-80">正在跳转到忘记密码页...</p>
          </div>
        )}

        {passwordError && (
          <div className="mt-6 mb-2 rounded-2xl border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
            <div className="flex items-center">
              <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">重置失败</span>
            </div>
            <p className="mt-2 text-sm">{passwordError}</p>
          </div>
        )}

        {success && (
          <div className="mt-6 mb-2 rounded-2xl border border-green-300 bg-green-50 p-4 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
            <div className="flex items-center">
              <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">重置成功</span>
            </div>
            <p className="mt-2 text-sm">{success}</p>
            <p className="mt-2 text-xs opacity-80">正在跳转到登录页...</p>
          </div>
        )}

        {!ready && !loading ? (
          <div className="mt-6 flex items-center justify-center py-12">
            <div className="text-center">
              <div className="loading-spinner h-12 w-12 border-3 border-primary mx-auto"></div>
              <p className="mt-4 text-sm text-muted">正在验证重置链接...</p>
            </div>
          </div>
        ) : (
          <>
            <form onSubmit={handleUpdatePassword} className="mt-6 space-y-5">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-card-foreground">
                  新密码
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setPasswordError(null); setSuccess(null); }}
                  placeholder="请输入新密码"
                  className="w-full rounded-2xl border border-border bg-background px-5 py-3.5 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  required
                  minLength={6}
                  disabled={loading}
                />
                <p className="text-xs text-muted">至少6位字符</p>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-card-foreground">
                  确认新密码
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(null); setSuccess(null); }}
                  placeholder="请再次输入新密码"
                  className="w-full rounded-2xl border border-border bg-background px-5 py-3.5 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  required
                  minLength={6}
                  disabled={loading}
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
                    提交中...
                  </span>
                ) : "更新密码"}
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

            {/* Security Tips */}
            <div className="mt-8 rounded-2xl bg-gradient-to-r from-background to-primary/5 border border-primary/20 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-sm">🔐</span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-card-foreground">密码安全建议</h4>
                  <ul className="mt-1 space-y-1 text-xs text-muted">
                    <li>• 使用至少8位字符的密码</li>
                    <li>• 结合大小写字母、数字和符号</li>
                    <li>• 避免使用个人信息或常见单词</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}