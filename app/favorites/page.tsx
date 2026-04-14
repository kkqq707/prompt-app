import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import FavoritePromptList from "./favorite-prompt-list";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const supabase = await createClient();
  const adminEmails = ["399569499@qq.com"];

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: favorites }, { data: membership }] = await Promise.all([
    supabase
      .from("favorites")
      .select("prompts(*)")
      .eq("user_id", user.id),

    supabase
      .from("user_memberships")
      .select("id")
      .eq("user_id", user.id)
      .gt("end_at", new Date().toISOString())
      .order("end_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const promptList =
    favorites
      ?.map((item) => item.prompts)
      .filter(Boolean) ?? [];

  let canAccessPaid = !!membership;

  // 管理员账户自动拥有永久会员
  if (adminEmails.includes(user.email ?? "")) {
    canAccessPaid = true;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 p-6 text-foreground">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-wrap gap-4">
          <Link
            href="/"
            className="rounded-2xl border border-border bg-card px-5 py-2.5 text-sm font-medium transition-all hover:border-primary hover:bg-primary/5 hover:text-primary"
          >
            ← 返回首页
          </Link>

          <Link
            href="/vip"
            className="rounded-2xl border border-border bg-card px-5 py-2.5 text-sm font-medium text-secondary transition-all hover:border-secondary hover:bg-secondary/5 hover:text-secondary"
          >
            👑 开通权益
          </Link>
        </div>

        <FavoritePromptList
          initialData={promptList as any[]}
          canAccessPaid={canAccessPaid}
        />
      </div>
    </div>
  );
}