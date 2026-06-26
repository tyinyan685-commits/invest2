"use client";

import { Search } from "lucide-react";
import { usePathname } from "next/navigation";

export function SiteStockSearch() {
  const pathname = usePathname();
  if (!pathname.startsWith("/research/")) return null;

  return (
    <form className="header-stock-search" action="/" method="get" role="search">
      <Search size={15} />
      <input name="symbol" placeholder="输入代码" aria-label="股票代码" maxLength={12} />
      <input type="hidden" name="run" value="1" />
      <button type="submit">分析</button>
    </form>
  );
}
