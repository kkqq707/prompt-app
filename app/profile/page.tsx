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
  location: string | null;
  website: string | null;
}

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile>({
    display_name: "",
    avatar_url: "",
    bio: "",
    location: "",
    website: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
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
          .select("display_name, avatar_url, bio, location, website")
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
            location: "",
            website: "",
          });
        } else {
          // 将数据库中的null值转换为空字符串用于表单显示
          const formattedProfile = {
            display_name: profileData?.display_name || "",
            avatar_url: profileData?.avatar_url || "",
            bio: profileData?.bio || "",
            location: profileData?.location || "",
            website: profileData?.website || "",
          };
          setProfile(formattedProfile);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserAndProfile();
  }, [supabase, router]);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // 检查文件类型
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "请选择图片文件（JPEG、PNG等）" });
      return;
    }

    // 检查文件大小（限制为5MB）
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "图片大小不能超过5MB" });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      // 生成唯一文件名
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // 上传文件到Supabase存储
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // 获取公共URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // 更新本地状态
      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));

      // 更安全的头像保存逻辑：先检查profile是否存在
      // 避免upsert的RLS策略冲突问题
      const { data: existingProfile, error: checkError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();  // 使用maybeSingle避免"未找到行"的错误

      if (checkError) throw checkError;

      if (existingProfile) {
        // 已存在profile，使用update更新头像
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ avatar_url: publicUrl })
          .eq("id", user.id);

        if (updateError) throw updateError;
      } else {
        // 不存在profile，创建新的profile记录
        const { error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            display_name: profile.display_name ||
              user.user_metadata?.username ||
              user.user_metadata?.name ||
              user.email?.split("@")[0] ||
              "",
            avatar_url: publicUrl,
            bio: profile.bio || null,
            website: profile.website || null,
            location: profile.location || null,
          });

        if (insertError) throw insertError;
      }

      // 更新用户元数据
      await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      setMessage({ type: "success", text: "头像上传成功！" });
      router.refresh(); // 刷新页面以更新用户菜单
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      let errorMessage = error.message;

      // 提供更详细的错误信息
      if (error.message.includes("Bucket not found")) {
        errorMessage = "存储桶不存在。请在Supabase控制台中创建名为 'avatars' 的存储桶，并设置公共访问权限。";
      } else if (error.message.includes("display_name") || error.message.includes("schema cache")) {
        errorMessage = "数据库表结构问题。请确保已运行数据库迁移：执行 migrations/001_create_profiles_table.sql 中的SQL语句。";
      }

      setMessage({ type: "error", text: `头像上传失败：${errorMessage}` });
    } finally {
      setUploading(false);
      // 清空文件输入，允许选择相同文件再次上传
      e.target.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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
          location: profile.location || null,
          website: profile.website || null,
        });

      if (error) throw error;

      // Update user metadata if needed
      if (profile.display_name) {
        await supabase.auth.updateUser({
          data: {
            username: profile.display_name,
            name: profile.display_name,
            avatar_url: profile.avatar_url || null
          }
        });
      }

      setMessage({ type: "success", text: "资料更新成功！" });
      router.refresh(); // Refresh to update user menu
    } catch (error: any) {
      console.error("Error updating profile:", error);
      let errorMessage = error.message;

      // 提供更详细的错误信息
      if (error.message.includes("display_name") || error.message.includes("schema cache") || error.message.includes("column")) {
        errorMessage = "数据库表结构问题。请确保已运行数据库迁移：执行 migrations/001_create_profiles_table.sql 中的SQL语句到Supabase数据库。";
      } else if (error.message.includes("profiles")) {
        errorMessage = "profiles表问题。请检查数据库表是否存在，或运行迁移脚本。";
      }

      setMessage({ type: "error", text: `更新失败：${errorMessage}` });
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
          <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
            <div className="flex items-center justify-center py-12">
              <div className="loading-spinner h-8 w-8 border-2 border-primary"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface p-4 sm:p-6">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-medium text-card-foreground transition-all hover:bg-surface hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-card"
          >
            <span className="transition-transform group-hover:-translate-x-0.5">←</span>
            返回首页
          </Link>
          <h1 className="text-xl font-semibold text-card-foreground sm:text-2xl">
            编辑个人资料
          </h1>
        </div>

        {/* Profile Form */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
          {/* Avatar Preview */}
          <div className="mb-8 flex flex-col items-center">
            <input
              type="file"
              id="avatar-upload"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={uploading}
            />
            <label htmlFor="avatar-upload" className="cursor-pointer group">
              <div className="relative h-32 w-32">
                {profile.avatar_url ? (
                  <>
                    <img
                      src={profile.avatar_url}
                      alt="头像"
                      className="h-full w-full rounded-full object-cover border-4 border-primary/20 shadow-lg group-hover:opacity-90 transition-opacity"
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
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white font-bold text-sm bg-black/60 rounded-full p-2">
                        {uploading ? "上传中..." : "更换头像"}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="h-full w-full rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg group-hover:opacity-90 transition-opacity">
                    <div className="text-center">
                      <span className="text-white font-bold text-2xl block">
                        {(profile.display_name || "用户").charAt(0).toUpperCase()}
                      </span>
                      <span className="text-white/80 text-xs mt-1 block">
                        {uploading ? "上传中..." : "点击上传"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </label>
            <p className="mt-4 text-sm text-muted">
              {uploading ? "头像上传中..." : "点击头像上传或更换"}
            </p>
          </div>

          {/* Message Alert */}
          {message && (
            <div className={`mb-6 rounded-lg p-4 ${message.type === "success" ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"}`}>
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
                className="w-full rounded-lg border border-border bg-white dark:bg-card px-5 py-3.5 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                maxLength={30}
              />
              <p className="text-xs text-muted">昵称将显示在您的个人资料和评论中</p>
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
                className="w-full rounded-lg border border-border bg-white dark:bg-card px-5 py-3.5 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                maxLength={200}
              />
              <p className="text-xs text-muted">最多 200 字</p>
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
                className="w-full rounded-lg border border-border bg-white dark:bg-card px-5 py-3.5 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted">邮箱不可修改</p>
            </div>

            {/* Form Actions */}
            <div className="flex flex-wrap gap-4 pt-6">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-gradient-to-r from-primary to-primary-dark px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
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
                className="rounded-lg border border-border bg-white px-6 py-3 text-sm font-medium text-card-foreground transition-all hover:bg-surface hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-card"
              >
                修改密码
              </Link>

              <Link
                href="/"
                className="rounded-lg border border-border bg-white px-6 py-3 text-sm font-medium text-card-foreground transition-all hover:bg-surface hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-card"
              >
                取消
              </Link>
            </div>
          </form>

          {/* Tips */}
          <div className="mt-8 rounded-xl border border-border bg-surface p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <span className="text-sm">💡</span>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-card-foreground">温馨提示</h4>
                <ul className="space-y-1 text-xs text-muted">
                  <li>• 昵称和头像将显示在您的个人资料中</li>
                  <li>• 所在地信息可选填</li>
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