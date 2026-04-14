"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

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
          alert("恢复重置会话失败：" + error.message);
          router.push("/forgot-password");
          return;
        }

        // 清掉地址栏里的 token，避免暴露
        window.history.replaceState({}, document.title, "/reset-password");
        setReady(true);
        return;
      }

      alert("重置链接无效或已过期，请重新发送重置邮件");
      router.push("/forgot-password");
    }

    initRecoverySession();
  }, [router, supabase]);

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("两次输入的密码不一致");
      return;
    }

    if (password.length < 6) {
      alert("密码至少 6 位");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      alert("重置失败：" + error.message);
      return;
    }

    alert("密码重置成功，请重新登录");
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold">重置密码</h1>
        <p className="mt-2 text-sm text-slate-600">
          请输入你的新密码。
        </p>

        <form onSubmit={handleUpdatePassword} className="mt-6 space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="新密码"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            required
            disabled={!ready || loading}
          />

          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="确认新密码"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            required
            disabled={!ready || loading}
          />

          <button
            type="submit"
            disabled={!ready || loading}
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-white disabled:opacity-60"
          >
            {loading ? "提交中..." : ready ? "更新密码" : "正在验证链接..."}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-slate-600">
          <Link href="/login" className="font-medium text-slate-900">
            返回登录
          </Link>
        </div>
      </div>
    </div>
  );
}