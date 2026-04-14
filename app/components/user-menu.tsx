"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";

interface Profile {
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

interface UserMenuProps {
  user: User;
}

export default function UserMenu({ user }: UserMenuProps) {
  const supabase = createClient();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch user profile
  useEffect(() => {
    async function fetchProfile() {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("display_name, avatar_url, bio")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          // If profile doesn't exist, create a default one
          const defaultProfile = {
            display_name: user.user_metadata?.username ||
              user.user_metadata?.name ||
              user.email?.split("@")[0] ||
              "用户",
            avatar_url: user.user_metadata?.avatar_url || null,
            bio: null,
          };
          setProfile(defaultProfile);
        } else {
          setProfile(data);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [user, supabase]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const displayName = profile?.display_name ||
    user.user_metadata?.username ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "用户";

  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url;

  if (loading) {
    return (
      <div className="h-10 w-10 animate-pulse rounded-full bg-muted"></div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-2.5 transition-all hover:border-primary hover:shadow-md"
      >
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative h-9 w-9">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-full w-full rounded-full object-cover border-2 border-primary/20"
                onError={(e) => {
                  // Fallback to initials if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  const parent = target.parentElement;
                  if (parent) {
                    const fallback = document.createElement("div");
                    fallback.className = "h-full w-full rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm";
                    fallback.textContent = displayName.charAt(0).toUpperCase();
                    parent.appendChild(fallback);
                  }
                }}
              />
            ) : (
              <div className="h-full w-full rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* User info - hidden on mobile */}
          <div className="hidden md:block text-left">
            <div className="text-sm font-medium text-card-foreground line-clamp-1">
              {displayName}
            </div>
            <div className="text-xs text-muted line-clamp-1">
              {user.email}
            </div>
          </div>
        </div>

        {/* Dropdown icon */}
        <svg
          className={`h-4 w-4 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-border bg-card p-2 shadow-2xl shadow-primary/10 animate-fadeIn">
          {/* User summary */}
          <div className="px-4 py-3 border-b border-border/50">
            <div className="text-sm font-medium text-card-foreground">{displayName}</div>
            <div className="text-xs text-muted truncate">{user.email}</div>
          </div>

          {/* Menu items */}
          <div className="py-2">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm text-card-foreground transition-all hover:bg-primary/5 hover:text-primary rounded-xl"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              编辑资料
            </Link>

            <Link
              href="/change-password"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm text-card-foreground transition-all hover:bg-primary/5 hover:text-primary rounded-xl"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              修改密码
            </Link>

            {user.email === "399569499@qq.com" && (
              <Link
                href="/prompts/new"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-card-foreground transition-all hover:bg-primary/5 hover:text-primary rounded-xl"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                新增提示词
              </Link>
            )}
          </div>

          {/* Logout */}
          <div className="border-t border-border/50 pt-2">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-600 transition-all hover:bg-red-50 hover:text-red-700 rounded-xl"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              退出登录
            </button>
          </div>
        </div>
      )}
    </div>
  );
}