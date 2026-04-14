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
      className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:shadow-amber-500/30"
    >
      <span className="flex items-center justify-center gap-2">
        <span>👑</span>
        {text}
      </span>
    </button>
  );
}