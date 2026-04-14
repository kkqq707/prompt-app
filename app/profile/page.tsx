"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";

interface Profile {
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  location: string | null;
}

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile>({
    display_name: "",
    avatar_url: "",
    bio: "",
    website: "",
    location: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function fetchUserAndProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }
        setUser(user);

        // Fetch profile
        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("display_name, avatar_url, bio, website, location")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          // Set default values if profile doesn't exist
          setProfile({
            display_name: user.user_metadata?.username ||
              user.user_metadata?.name ||
              user.email?.split("@")[0] ||
              "",
            avatar_url: user.user_metadata?.avatar_url || "",
            bio: "",
            website: "",
            location: "",
          });
        } else {
          setProfile(profileData || {
            display_name: "",
            avatar_url: "",
            bio: "",
            website: "",
            location: "",
          });
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserAndProfile();
  }, [supabase, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage(null);

    try {
      // Update profile
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          display_name: profile.display_name || null,
          avatar_url: profile.avatar_url || null,
          bio: profile.bio || null,
          website: profile.website || null,
          location: profile.location || null,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Update user metadata if needed
      if (profile.display_name) {
        await supabase.auth.updateUser({
          data: {
            username: profile.display_name,
            name: profile.display_name,
            avatar_url: profile.avatar_url
          }
        });
      }

      setMessage({ type: "success", text: "资料更新成功！" });
      router.refresh(); // Refresh to update user menu
    } catch (error: any) {
      console.error("Error updating profile:", error);
      setMessage({ type: "error", text: `更新失败：${error.message}` });
    } finally {
      setSaving(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 p-6">
        <div className="mx-auto max-w-2xl">
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
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-5 py-3 text-sm font-medium transition-all hover:border-primary hover:bg-primary/5 hover:text-primary hover:shadow-md"
          >
            <span className="transition-transform group-hover:-translate-x-0.5">←</span>
            返回首页
          </Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            编辑资料
          </h1>
        </div>

        {/* Profile Form */}
        <div className="rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-2xl shadow-primary/10">
          {/* Avatar Preview */}
          <div className="mb-8 flex flex-col items-center">
            <div className="relative h-32 w-32">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="头像"
                  className="h-full w-full rounded-full object-cover border-4 border-primary/20 shadow-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const parent = target.parentElement;
                    if (parent) {
                      const fallback = document.createElement("div");
                      fallback.className = "h-full w-full rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-2xl";
                      fallback.textContent = (profile.display_name || "用户").charAt(0).toUpperCase();
                      parent.appendChild(fallback);
                    }
                  }}
                />
              ) : (
                <div className="h-full w-full rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-2xl">
                    {(profile.display_name || "用户").charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <p className="mt-4 text-sm text-muted">头像预览</p>
          </div>

          {/* Message Alert */}
          {message && (
            <div className={`mb-6 rounded-2xl p-4 ${message.type === "success" ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"}`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{message.type === "success" ? "✅" : "❌"}</span>
                <span className="text-sm font-medium">{message.text}</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Display Name */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-card-foreground">
                昵称
              </label>
              <input
                type="text"
                name="display_name"
                value={profile.display_name || ""}
                onChange={handleInputChange}
                placeholder="请输入昵称"
                className="w-full rounded-2xl border border-border bg-background px-5 py-3.5 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                maxLength={30}
              />
              <p className="text-xs text-muted">昵称将显示在您的个人资料和评论中</p>
            </div>

            {/* Avatar URL */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-card-foreground">
                头像链接
              </label>
              <input
                type="url"
                name="avatar_url"
                value={profile.avatar_url || ""}
                onChange={handleInputChange}
                placeholder="https://example.com/avatar.jpg"
                className="w-full rounded-2xl border border-border bg-background px-5 py-3.5 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-xs text-muted">支持 Gravatar、QQ 头像等第三方头像服务链接</p>
            </div>

            {/* Bio */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-card-foreground">
                个人简介
              </label>
              <textarea
                name="bio"
                value={profile.bio || ""}
                onChange={handleInputChange}
                placeholder="介绍一下你自己..."
                rows={3}
                className="w-full rounded-2xl border border-border bg-background px-5 py-3.5 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                maxLength={200}
              />
              <p className="text-xs text-muted">最多 200 字</p>
            </div>

            {/* Website */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-card-foreground">
                个人网站
              </label>
              <input
                type="url"
                name="website"
                value={profile.website || ""}
                onChange={handleInputChange}
                placeholder="https://example.com"
                className="w-full rounded-2xl border border-border bg-background px-5 py-3.5 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Location */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-card-foreground">
                所在地
              </label>
              <input
                type="text"
                name="location"
                value={profile.location || ""}
                onChange={handleInputChange}
                placeholder="例如：北京、上海"
                className="w-full rounded-2xl border border-border bg-background px-5 py-3.5 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Email (readonly) */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-card-foreground">
                邮箱
              </label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full rounded-2xl border border-border bg-muted/30 px-5 py-3.5 text-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted">邮箱不可修改</p>
            </div>

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
                    保存中...
                  </span>
                ) : "保存资料"}
              </button>

              <Link
                href="/change-password"
                className="rounded-2xl border border-border bg-card px-8 py-3.5 text-sm font-medium transition-all hover:border-primary hover:bg-primary/5 hover:text-primary"
              >
                修改密码
              </Link>

              <Link
                href="/"
                className="rounded-2xl border border-border bg-card px-8 py-3.5 text-sm font-medium transition-all hover:border-border hover:bg-background"
              >
                取消
              </Link>
            </div>
          </form>

          {/* Tips */}
          <div className="mt-8 rounded-2xl bg-gradient-to-r from-background to-primary/5 border border-primary/20 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <span className="text-sm">💡</span>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-card-foreground">温馨提示</h4>
                <ul className="space-y-1 text-xs text-muted">
                  <li>• 昵称和头像将显示在您的个人资料中</li>
                  <li>• 个人网站和所在地信息可选填</li>
                  <li>• 修改密码请点击上方"修改密码"按钮</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}