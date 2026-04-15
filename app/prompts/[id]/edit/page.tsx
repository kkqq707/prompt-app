"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function EditPromptPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [model, setModel] = useState("");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");

  const [usageTips, setUsageTips] = useState("");
  const [exampleInput, setExampleInput] = useState("");
  const [exampleOutput, setExampleOutput] = useState("");

  useEffect(() => {
    async function fetchPrompt() {
      const { data, error } = await supabase
        .from("prompts")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        alert("加载失败");
        router.push("/");
        return;
      }

      setTitle(data.title ?? "");
      setCategory(data.category ?? "");
      setModel(data.model ?? "");
      setTags(data.tags?.join(",") || "");
      setDescription(data.description ?? "");
      setPrompt(data.prompt ?? "");
      setUsageTips(data.usage_tips ?? "");
      setExampleInput(data.example_input ?? "");
      setExampleOutput(data.example_output ?? "");
      setPageLoading(false);
    }

    fetchPrompt();
  }, [id, router, supabase]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from("prompts")
      .update({
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
      })
      .eq("id", id);

    setLoading(false);

    if (error) {
      alert("更新失败：" + error.message);
      return;
    }

    alert("更新成功");
    router.push(`/prompts/${id}`);
    router.refresh();
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-slate-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">编辑提示词</h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">标题</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="标题"
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
                placeholder="分类"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">模型</label>
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="例如：ChatGPT / Claude / Gemini / deepseek / 豆包 / kimi"
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
              placeholder="标签"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="描述"
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
              rows={8}
              placeholder="提示词正文"
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
              placeholder="使用建议"
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
                placeholder="示例输入"
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
                placeholder="示例输出"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
            </div>
          </div>


          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-slate-900 py-3 text-white disabled:opacity-60"
          >
            {loading ? "更新中..." : "更新"}
          </button>
        </form>
      </div>
    </div>
  );
}