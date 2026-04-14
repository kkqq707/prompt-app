"use client";

import { useState } from "react";

export default function CopyPromptButton({
  prompt,
}: {
  prompt: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      alert("复制失败，请手动复制");
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
    >
      {copied ? "已复制" : "复制提示词"}
    </button>
  );
}