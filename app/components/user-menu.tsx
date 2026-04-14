import { createClient } from "@/utils/supabase/server";

export default async function UserMenu() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const username =
    user.user_metadata?.username ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "用户";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <div className="text-sm font-medium text-slate-900">{username}</div>
      <div className="text-xs text-slate-500">{user.email}</div>
    </div>
  );
}