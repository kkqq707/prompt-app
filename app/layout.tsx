import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/app/components/header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Prompt",
  description: "AI提示词库 - 收集高质量AI提示词模板，支持搜索、分类筛选、收藏和社区分享",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="flex-1 pt-16">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-border/40 py-6 mt-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center gap-2 md:justify-start">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-primary to-secondary">
                    <span className="text-xs font-bold text-white">AI</span>
                  </div>
                  <span className="text-sm font-medium">AI Prompt</span>
                </div>
                <p className="mt-2 text-xs text-muted">
                  AI提示词库 - 收集高质量AI提示词模板
                </p>
              </div>
              <div className="text-xs text-muted">
                © {new Date().getFullYear()} AI Prompt. 保留所有权利。
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
