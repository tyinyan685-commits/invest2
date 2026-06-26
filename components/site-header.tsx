import Link from "next/link";
import { Activity } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="研究台首页">
        <span className="brand-mark"><Activity size={17} strokeWidth={2.4} /></span>
        <span>研究台</span>
        <span className="brand-beta">BETA</span>
      </Link>
      <nav className="nav-links" aria-label="主导航">
        <Link href="/">个股研究</Link>
        <Link href="/admin">生成记录</Link>
      </nav>
    </header>
  );
}
