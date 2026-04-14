"use client";

export default function VipLockedButton({
  text = "VIP专属",
}: {
  text?: string;
}) {
  function handleClick() {
    alert("该内容需开通 VIP 后查看");
  }

  return (
    <button
      onClick={handleClick}
      className="rounded-2xl bg-slate-300 px-4 py-2 text-sm font-medium text-white"
    >
      {text}
    </button>
  );
}