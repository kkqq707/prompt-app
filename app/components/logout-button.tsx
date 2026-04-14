"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useState } from "react";

export default function LogoutButton() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);

    const { error } = await supabase.auth.signOut();

    setLoading(false);

    if (error) {
      alert("退出登录失败：" + error.message);
      return;
    }

    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="rounded-2xl border border-border bg-card px-5 py-2.5 text-sm font-medium text-red-600 transition-all hover:border-red-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="loading-spinner h-4 w-4 border-2 border-red-600"></span>
          退出中...
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          退出登录
        </span>
      )}
    </button>
  );
}