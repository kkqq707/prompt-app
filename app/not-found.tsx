import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">页面不存在</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          你访问的提示词可能已被删除，或者链接有误。
        </p>

        <Link
          href="/"
          className="mt-6 inline-block rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}