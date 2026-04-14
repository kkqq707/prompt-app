"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

export default function ChangePasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setLoading(false);
    }

    checkUser();
  }, [supabase, router]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // Clear message when user starts typing
    if (message) setMessage(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validation
    if (form.newPassword !== form.confirmPassword) {
      setMessage({ type: "error", text: "两次输入的新密码不一致" });
      return;
    }

    if (form.newPassword.length < 6) {
      setMessage({ type: "error", text: "新密码至少需要 6 位" });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      // First, verify current password by signing in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        throw new Error("无法获取用户信息");
      }

      // Attempt to sign in with current password to verify
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: form.currentPassword,
      });

      if (signInError) {
        if (signInError.message.includes("Invalid login credentials")) {
          throw new Error("当前密码错误");
        }
        throw signInError;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: form.newPassword,
      });

      if (updateError) throw updateError;

      setMessage({ type: "success", text: "密码修改成功！" });
      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      // Refresh auth state
      router.refresh();
    } catch (error: any) {
      console.error("Error changing password:", error);
      setMessage({ type: "error", text: `修改失败：${error.message}` });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 p-6">
        <div className="mx-auto max-w-md">
          <div className="rounded-3xl bg-card border border-border p-8 shadow-lg shadow-primary/10">
            <div className="flex items-center justify-center py-12">
              <div className="loading-spinner h-8 w-8 border-3 border-primary"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 p-4 sm:p-6">
      <div className="mx-auto max-w-md space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/profile"
            className="group inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-5 py-3 text-sm font-medium transition-all hover:border-primary hover:bg-primary/5 hover:text-primary hover:shadow-md"
          >
            <span className="transition-transform group-hover:-translate-x-0.5">←</span>
            返回资料页
          </Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            修改密码
          </h1>
        </div>

        {/* Password Form */}
        <div className="rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-2xl shadow-primary/10">
          {/* Message Alert */}
          {message && (
            <div className={`mb-6 rounded-2xl p-4 ${message.type === "success" ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"}`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{message.type === "success" ? "✅" : "❌"}</span>
                <span className="text-sm font-medium">{message.text}</span>
              </div>
            </div>
          )}

          {/* Security Note */}
          <div className="mb-8 rounded-2xl bg-gradient-to-r from-background to-primary/5 border border-primary/20 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <span className="text-sm">🔒</span>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-card-foreground">安全提示</h4>
                <p className="mt-1 text-xs text-muted">
                  为了您的账户安全，请定期修改密码，并避免使用过于简单的密码。
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Password */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-card-foreground">
                当前密码
              </label>
              <input
                type="password"
                name="currentPassword"
                value={form.currentPassword}
                onChange={handleInputChange}
                placeholder="请输入当前密码"
                required
                className="w-full rounded-2xl border border-border bg-background px-5 py-3.5 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* New Password */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-card-foreground">
                新密码
              </label>
              <input
                type="password"
                name="newPassword"
                value={form.newPassword}
                onChange={handleInputChange}
                placeholder="请输入新密码（至少 6 位）"
                required
                minLength={6}
                className="w-full rounded-2xl border border-border bg-background px-5 py-3.5 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-xs text-muted">建议使用字母、数字和符号的组合</p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-card-foreground">
                确认新密码
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleInputChange}
                placeholder="请再次输入新密码"
                required
                minLength={6}
                className="w-full rounded-2xl border border-border bg-background px-5 py-3.5 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Password Strength */}
            {form.newPassword && (
              <div className="rounded-2xl bg-gradient-to-r from-background to-secondary/5 border border-border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-card-foreground">密码强度</span>
                  <span className={`text-xs font-bold ${
                    form.newPassword.length < 6 ? "text-red-600" :
                    form.newPassword.length < 8 ? "text-amber-600" :
                    "text-green-600"
                  }`}>
                    {form.newPassword.length < 6 ? "弱" :
                     form.newPassword.length < 8 ? "中" : "强"}
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-border overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      form.newPassword.length < 6 ? "bg-red-500 w-1/4" :
                      form.newPassword.length < 8 ? "bg-amber-500 w-2/3" :
                      "bg-green-500 w-full"
                    }`}
                  />
                </div>
                <p className="mt-2 text-xs text-muted">
                  {form.newPassword.length < 6 ? "密码太短，至少需要6位" :
                   form.newPassword.length < 8 ? "可以考虑增加长度和复杂度" :
                   "密码强度不错"}
                </p>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex flex-wrap gap-4 pt-6">
              <button
                type="submit"
                disabled={saving}
                className="rounded-2xl bg-gradient-to-r from-primary to-primary-dark px-8 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:shadow-primary/30 disabled:opacity-60"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="loading-spinner h-4 w-4 border-2 border-white"></span>
                    修改中...
                  </span>
                ) : "确认修改"}
              </button>

              <Link
                href="/profile"
                className="rounded-2xl border border-border bg-card px-8 py-3.5 text-sm font-medium transition-all hover:border-border hover:bg-background"
              >
                取消
              </Link>
            </div>
          </form>

          {/* Additional Options */}
          <div className="mt-8 pt-6 border-t border-border/50">
            <div className="space-y-3">
              <Link
                href="/forgot-password"
                className="flex items-center gap-2 text-sm text-primary transition-all hover:text-primary-dark"
              >
                <span>🔑</span>
                忘记密码？
              </Link>
              <p className="text-xs text-muted">
                如果您忘记了当前密码，请使用"忘记密码"功能通过邮箱重置。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}