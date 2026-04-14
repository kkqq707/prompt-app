"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export const dynamic = "force-dynamic";

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

function VipContent() {
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
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-10">
        {/* 返回按钮 */}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-5 py-3 text-sm font-medium transition-all hover:border-primary hover:bg-primary/5 hover:text-primary hover:shadow-md"
          >
            <span className="transition-transform group-hover:-translate-x-0.5">←</span>
            返回首页
          </Link>
        </div>

        {/* 标题区域 */}
        <div className="rounded-3xl bg-gradient-to-br from-card via-card to-primary/5 border border-border p-8 shadow-2xl shadow-primary/10">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent sm:text-5xl">
              开通权益
            </h1>
            <p className="mt-4 text-lg leading-8 text-muted">
              选择最适合你的解锁方式。<span className="font-medium text-card-foreground">单条适合低门槛体验</span>，<span className="font-medium text-card-foreground">会员适合高频使用</span>。
            </p>

            {/* 会员状态提示 */}
            {!checkingMembership && hasActiveMembership && (
              <div className="mt-8 animate-fadeIn">
                <div className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 p-5 text-white shadow-lg">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                    <span className="text-2xl">🎉</span>
                  </div>
                  <div>
                    <div className="font-bold text-lg">当前会员有效中</div>
                    <div className="text-sm opacity-95">到期时间：{formatDateTime(membershipEndAt)}</div>
                    <div className="mt-1 text-xs opacity-80">感谢您的支持！</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 套餐卡片区域 */}
        <section className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            const isMain = plan.type === "half_year";
            const membershipLocked =
              hasActiveMembership && plan.type !== "single";

            return (
              <article
                key={plan.type}
                className={`group relative rounded-3xl border-2 bg-card p-7 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                  isMain
                    ? "border-primary shadow-primary/20 hover:border-primary"
                    : "border-border/80 hover:border-primary/60"
                } ${membershipLocked ? "opacity-90" : ""}`}
              >
                {/* 主推标签 */}
                {isMain && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <div className="rounded-full bg-gradient-to-r from-primary to-accent px-5 py-2 text-xs font-bold text-white shadow-lg">
                      ⭐ 最受欢迎
                    </div>
                  </div>
                )}

                {/* 内容 */}
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-card-foreground">
                      {plan.title}
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-muted">
                      {plan.desc}
                    </p>
                  </div>

                  {/* 价格 */}
                  <div className="relative">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        ¥{plan.price}
                      </span>
                      {plan.type !== "single" && (
                        <span className="text-sm text-muted">/ {plan.type === "month" ? "月" : plan.type === "half_year" ? "半年" : "年"}</span>
                      )}
                    </div>
                    {plan.type === "half_year" && (
                      <div className="mt-2 text-sm font-medium text-green-600 dark:text-green-400">
                        💰 平均每月仅 ¥{((plan.price / 6).toFixed(2))}
                      </div>
                    )}
                    {plan.type === "year" && (
                      <div className="mt-2 text-sm font-medium text-green-600 dark:text-green-400">
                        💰 平均每月仅 ¥{((plan.price / 12).toFixed(2))}
                      </div>
                    )}
                  </div>

                  {/* 按钮 */}
                  <button
                    onClick={() => handlePurchase(plan.type, plan.price)}
                    disabled={loadingPlan === plan.type || membershipLocked}
                    className={`mt-2 w-full rounded-2xl py-4 text-sm font-bold transition-all duration-300 ${
                      membershipLocked
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md"
                        : loadingPlan === plan.type
                        ? "bg-gradient-to-r from-primary/80 to-primary-dark/80 text-white shadow-inner"
                        : "bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg hover:shadow-xl hover:shadow-primary/40"
                    } disabled:cursor-not-allowed`}
                  >
                    {loadingPlan === plan.type ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="loading-spinner h-4 w-4 border-2"></span>
                        处理中...
                      </span>
                    ) : membershipLocked ? (
                      <span className="flex items-center justify-center gap-2">
                        <span>✅</span>
                        当前会员有效中
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <span>🚀</span>
                        立即购买
                      </span>
                    )}
                  </button>

                  {/* 附加信息 */}
                  {plan.type === "single" && (
                    <div className="mt-3 text-xs text-muted text-center">
                      💡 仅解锁当前提示词
                    </div>
                  )}
                  {plan.type === "month" && (
                    <div className="mt-3 text-xs text-muted text-center">
                      📅 30天无限访问
                    </div>
                  )}
                  {plan.type === "half_year" && (
                    <div className="mt-3 text-xs text-muted text-center">
                      ⭐ 性价比最高
                    </div>
                  )}
                  {plan.type === "year" && (
                    <div className="mt-3 text-xs text-muted text-center">
                      👑 全年无忧
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </section>

        {/* 权益说明区域 */}
        <section className="rounded-3xl bg-gradient-to-br from-card via-card to-secondary/5 border border-border p-8 shadow-xl shadow-primary/5">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-card-foreground">权益说明</h2>
            <p className="mt-3 text-lg text-muted">
              了解不同解锁方式的优势，选择最适合你的方案
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {/* 单条解锁 */}
            <div className="group rounded-3xl bg-gradient-to-br from-background via-background to-primary/10 border border-border p-7 transition-all hover:border-primary/50 hover:shadow-lg">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                <span className="text-3xl">🔓</span>
              </div>
              <h3 className="text-xl font-bold text-card-foreground">单条解锁</h3>
              <p className="mt-3 text-sm leading-7 text-muted">
                仅对当前提示词生效，解锁后可永久查看该条内容。适合只想体验特定提示词的用户。
              </p>
              <div className="mt-5 text-xs font-medium text-primary">
                💡 推荐给：初次体验用户
              </div>
            </div>

            {/* 会员权益 */}
            <div className="group rounded-3xl bg-gradient-to-br from-background via-background to-secondary/10 border border-border p-7 transition-all hover:border-secondary/50 hover:shadow-lg">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary/20 to-secondary/10">
                <span className="text-3xl">👑</span>
              </div>
              <h3 className="text-xl font-bold text-card-foreground">会员权益</h3>
              <p className="mt-3 text-sm leading-7 text-muted">
                有效期内可查看全部付费提示词，无需逐条购买。适合经常使用提示词的用户。
              </p>
              <div className="mt-5 text-xs font-medium text-secondary">
                💡 推荐给：高频使用用户
              </div>
            </div>

            {/* 防重复购买 */}
            <div className="group rounded-3xl bg-gradient-to-br from-background via-background to-accent/10 border border-border p-7 transition-all hover:border-accent/50 hover:shadow-lg">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-accent/10">
                <span className="text-3xl">🛡️</span>
              </div>
              <h3 className="text-xl font-bold text-card-foreground">防重复购买</h3>
              <p className="mt-3 text-sm leading-7 text-muted">
                已有有效会员时，系统会阻止重复购买，避免重复付费。保护您的消费权益。
              </p>
              <div className="mt-5 text-xs font-medium text-accent">
                💡 智能保护机制
              </div>
            </div>
          </div>

          {/* 温馨提示 */}
          <div className="mt-10 rounded-2xl bg-gradient-to-r from-background to-primary/5 border border-primary/20 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <span className="text-lg">💡</span>
              </div>
              <div>
                <h4 className="font-bold text-card-foreground">温馨提示</h4>
                <ul className="mt-2 space-y-2 text-sm text-muted">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>购买后请在会员有效期内使用，过期后需要续费</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>单条解锁为永久权限，仅针对当前提示词</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>如有任何问题，请联系客服 support@example.com</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function VipPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-primary/5 p-6">加载中...</div>}>
      <VipContent />
    </Suspense>
  );
}