"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type PlanType = "single" | "month" | "half_year" | "year";

function addDays(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function VipPage() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const adminEmails = ["399569499@qq.com"];

  const promptId = searchParams.get("promptId");
  const [loadingPlan, setLoadingPlan] = useState<PlanType | null>(null);
  const [membershipEndAt, setMembershipEndAt] = useState<string | null>(null);
  const [checkingMembership, setCheckingMembership] = useState(true);

  const hasActiveMembership = !!membershipEndAt;

  const plans = useMemo(() => {
    const base = [
      {
        type: "month" as const,
        title: "月卡会员",
        price: 9.9,
        desc: "30 天内查看全部付费提示词",
      },
      {
        type: "half_year" as const,
        title: "半年会员",
        price: 49.9,
        desc: "180 天内查看全部付费提示词",
      },
      {
        type: "year" as const,
        title: "年卡会员",
        price: 99,
        desc: "365 天内查看全部付费提示词",
      },
    ];

    if (promptId) {
      return [
        {
          type: "single" as const,
          title: "解锁当前提示词",
          price: 0.99,
          desc: "永久查看当前这条提示词",
        },
        ...base,
      ];
    }

    return base;
  }, [promptId]);

  useEffect(() => {
    async function fetchMembership() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setCheckingMembership(false);
        return;
      }

      // 管理员账户自动拥有永久会员
      if (adminEmails.includes(user.email ?? "")) {
        setMembershipEndAt(new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString());
        setCheckingMembership(false);
        return;
      }

      const { data: membership } = await supabase
        .from("user_memberships")
        .select("end_at")
        .eq("user_id", user.id)
        .gt("end_at", new Date().toISOString())
        .order("end_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setMembershipEndAt(membership?.end_at ?? null);
      setCheckingMembership(false);
    }

    fetchMembership();
  }, [supabase]);

  async function handlePurchase(planType: PlanType, price: number) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("请先登录");
      router.push("/login");
      return;
    }

    // 管理员账户已拥有永久会员，无需购买
    if (adminEmails.includes(user.email ?? "")) {
      alert("管理员账户已拥有永久会员，无需购买");
      return;
    }

    setLoadingPlan(planType);

    try {
      if (planType === "single") {
        if (!promptId) {
          alert("缺少 promptId，无法解锁当前提示词");
          setLoadingPlan(null);
          return;
        }

        const { error } = await supabase.from("user_prompt_unlocks").insert([
          {
            user_id: user.id,
            prompt_id: promptId,
            price,
          },
        ]);

        if (error) {
          if (error.message.includes("duplicate key")) {
            alert("你已经解锁过这条提示词了");
            router.push(`/prompts/${promptId}`);
            router.refresh();
            return;
          }

          alert("解锁失败：" + error.message);
          return;
        }

        alert("解锁成功");
        router.push(`/prompts/${promptId}`);
        router.refresh();
        return;
      }

      const { data: activeMembership } = await supabase
        .from("user_memberships")
        .select("id, end_at")
        .eq("user_id", user.id)
        .gt("end_at", new Date().toISOString())
        .order("end_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeMembership) {
        alert(
          `你当前已有有效会员，到期时间：${formatDateTime(
            activeMembership.end_at
          )}`
        );
        setMembershipEndAt(activeMembership.end_at);
        return;
      }

      let endAt = "";
      if (planType === "month") endAt = addDays(30);
      if (planType === "half_year") endAt = addDays(180);
      if (planType === "year") endAt = addDays(365);

      const { error } = await supabase.from("user_memberships").insert([
        {
          user_id: user.id,
          plan_type: planType,
          price,
          start_at: new Date().toISOString(),
          end_at: endAt,
        },
      ]);

      if (error) {
        alert("开通失败：" + error.message);
        return;
      }

      setMembershipEndAt(endAt);
      alert("会员开通成功");

      if (promptId) {
        router.push(`/prompts/${promptId}`);
      } else {
        router.push("/");
      }
      router.refresh();
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 p-6">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-wrap gap-4">
          <Link
            href="/"
            className="rounded-2xl border border-border bg-card px-5 py-2.5 text-sm font-medium transition-all hover:border-primary hover:bg-primary/5 hover:text-primary"
          >
            ← 返回首页
          </Link>
        </div>

        <div className="rounded-3xl bg-card border border-border p-8 shadow-lg shadow-primary/10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">开通权益</h1>
          <p className="mt-4 text-lg text-muted">
            选择最适合你的解锁方式。单条适合低门槛体验，会员适合高频使用。
          </p>

          {!checkingMembership && hasActiveMembership && (
            <div className="mt-6 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 p-5 text-white shadow-md">
              <div className="flex items-center gap-3">
                <span className="text-xl">🎉</span>
                <div>
                  <div className="font-semibold">当前会员有效中</div>
                  <div className="text-sm opacity-90">到期时间：{formatDateTime(membershipEndAt)}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => {
            const isMain = plan.type === "half_year";
            const membershipLocked =
              hasActiveMembership && plan.type !== "single";

            return (
              <article
                key={plan.type}
                className={`group rounded-3xl border bg-card p-6 shadow-lg transition-all hover:shadow-xl hover:-translate-y-1 ${
                  isMain
                    ? "border-primary shadow-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {isMain && (
                  <div className="mb-4 inline-block rounded-full bg-gradient-to-r from-primary to-accent px-4 py-1.5 text-xs font-semibold text-white shadow-md">
                    ⭐ 主推
                  </div>
                )}

                <h2 className="text-xl font-bold text-card-foreground">
                  {plan.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-muted">
                  {plan.desc}
                </p>

                <div className="mt-6">
                  <span className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    ¥{plan.price}
                  </span>
                </div>

                <button
                  onClick={() => handlePurchase(plan.type, plan.price)}
                  disabled={loadingPlan === plan.type || membershipLocked}
                  className="mt-6 w-full rounded-2xl bg-gradient-to-r from-primary to-primary-dark py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:shadow-primary/30 disabled:opacity-60"
                >
                  {loadingPlan === plan.type
                    ? "⏳ 处理中..."
                    : membershipLocked
                    ? "🎉 当前会员有效中"
                    : "🚀 立即购买"}
                </button>
              </article>
            );
          })}
        </section>

        <section className="rounded-3xl bg-card border border-border p-8 shadow-lg shadow-primary/5">
          <h2 className="text-2xl font-bold text-card-foreground">权益说明</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-gradient-to-br from-background to-primary/5 border border-border p-6">
              <div className="mb-3 text-2xl">🔓</div>
              <h3 className="font-semibold text-card-foreground">单条解锁</h3>
              <p className="mt-2 text-sm leading-7 text-muted">
                仅对当前提示词生效，解锁后可永久查看该条内容。
              </p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-background to-secondary/5 border border-border p-6">
              <div className="mb-3 text-2xl">👑</div>
              <h3 className="font-semibold text-card-foreground">会员权益</h3>
              <p className="mt-2 text-sm leading-7 text-muted">
                有效期内可查看全部付费提示词，无需逐条购买。
              </p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-background to-accent/5 border border-border p-6">
              <div className="mb-3 text-2xl">🛡️</div>
              <h3 className="font-semibold text-card-foreground">防重复购买</h3>
              <p className="mt-2 text-sm leading-7 text-muted">
                已有有效会员时，系统会阻止重复购买，避免重复付费。
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}