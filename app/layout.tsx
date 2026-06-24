import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "研究台 | 有证据的投资研究", template: "%s | 研究台" },
  description: "结论先行、证据可展开、数据口径可审计的投资研究终端。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <SiteHeader />
        {children}
        <footer className="site-footer">
          <p>研究台 · 用事实约束判断</p>
          <p>仅供研究交流，不构成投资建议。数据可能延迟，请核对原始来源。</p>
        </footer>
      </body>
    </html>
  );
}
