"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Dashboard" },
  { href: "/accounts", label: "Accounts" },
  { href: "/transactions", label: "Transactions" },
  { href: "/assets-liabilities", label: "Assets & Liabilities" },
  { href: "/documents", label: "Documents" },
  { href: "/chat", label: "Chat" },
  { href: "/tax-insights", label: "Tax Insights" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#0b1729_0%,#050812_55%,#020409_100%)] text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-[1440px] grid-cols-1 gap-6 px-4 py-5 lg:grid-cols-[250px_1fr]">
        <aside className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-emerald-300">Private Banker</p>
          <h1 className="mt-2 text-xl font-semibold">Dashboard</h1>
          <nav className="mt-8 space-y-1">
            {nav.map((item) => {
              const active = path === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "block rounded-lg px-3 py-2 text-sm transition",
                    active ? "bg-emerald-400 text-slate-900" : "text-slate-300 hover:bg-white/10 hover:text-white",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="overflow-x-hidden rounded-2xl border border-white/10 bg-slate-950/55 p-5">{children}</main>
      </div>
    </div>
  );
}
