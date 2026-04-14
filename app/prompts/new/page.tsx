"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function NewPromptPage() {
  const supabase = createClient();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [model, setModel] = useState("");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");

  const [usageTips, setUsageTips] = useState("");
  const [exampleInput, setExampleInput] = useState("");
  const [exampleOutput, setExampleOutput] = useState("");
  const [isPaid, setIsPaid] = useState(false);

  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("请先登录");
      router.push("/login");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("prompts").insert([
      {
        title,
        category,
        model,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        description,
        prompt,
        usage_tips: usageTips,
        example_input: exampleInput,
        example_output: exampleOutput,
        is_paid: isPaid,
        owner_id: user.id,
      },
    ]);

    setLoading(false);

    if (error) {
      alert("创建失败：" + error.message);
      return;
    }

    alert("创建成功");
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">新增提示词</h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">标题</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：小红书爆款种草文案生成器"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              required
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">分类</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="例如：写作 / 营销 / 编程"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">模型</label>
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="例如：ChatGPT / Claude / Gemini"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              标签（逗号分隔）
            </label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="例如：文案, 小红书, 种草"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简要说明这个提示词适合什么场景"
              rows={3}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              提示词正文
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="请输入完整 Prompt"
              rows={8}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">使用建议</label>
            <textarea
              value={usageTips}
              onChange={(e) => setUsageTips(e.target.value)}
              rows={4}
              placeholder="例如：建议补充目标用户、发布平台、文案风格、字数限制"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                示例输入
              </label>
              <textarea
                value={exampleInput}
                onChange={(e) => setExampleInput(e.target.value)}
                rows={5}
                placeholder="例如：请帮我写一条适合小红书发布的防晒霜种草文案，面向大学女生"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                示例输出
              </label>
              <textarea
                value={exampleOutput}
                onChange={(e) => setExampleOutput(e.target.value)}
                rows={5}
                placeholder="填写一个参考输出结果"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={isPaid}
              onChange={(e) => setIsPaid(e.target.checked)}
            />
            设为付费内容
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-slate-900 py-3 text-white disabled:opacity-60"
          >
            {loading ? "提交中..." : "提交"}
          </button>
        </form>
      </div>
    </div>
  );
}