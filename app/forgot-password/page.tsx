"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const redirectTo = `${window.location.origin}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    setLoading(false);

    if (error) {
      alert("发送失败：" + error.message);
      return;
    }

    alert("重置密码邮件已发送，请检查邮箱");
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold">找回密码</h1>
        <p className="mt-2 text-sm text-slate-600">
          输入注册邮箱，我们会发送重置密码链接。
        </p>

        <form onSubmit={handleResetPassword} className="mt-6 space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="邮箱"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-white disabled:opacity-60"
          >
            {loading ? "发送中..." : "发送重置邮件"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-slate-600">
          想起密码了？
          <Link href="/login" className="ml-1 font-medium text-slate-900">
            返回登录
          </Link>
        </div>
      </div>
    </div>
  );
}