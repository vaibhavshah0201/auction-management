"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Gavel,
  Users,
  Shield,
  BarChart3,
  Menu,
  X,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/auction", label: "Live Auction", icon: Gavel, live: true },
  { href: "/players", label: "Players", icon: Users },
  { href: "/teams", label: "Teams", icon: Shield },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-slate-200 p-2 text-slate-900 shadow-lg lg:hidden"
        aria-label="Toggle menu"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white/95 backdrop-blur-xl transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-6">
          <div className="relative">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 shadow-lg shadow-gold-500/30">
              <Trophy className="h-6 w-6 text-slate-900" />
            </div>
            <span className="absolute -right-1 -top-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pitch-500 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-pitch-500" />
            </span>
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight text-slate-900">
              OECL Mega
            </h1>
            <p className="gradient-text text-xs font-bold">AUCTION 7.0</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-pitch-500/15 text-pitch-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {item.live && (
                  <span className="ml-auto flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-600">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                    LIVE
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 px-6 py-4">
          <p className="text-[11px] text-slate-400">
            Starting Purse · ₹20,00,000
          </p>
          <p className="text-[11px] text-slate-400">Squad Size · 10</p>
          <p className="mt-2 border-t border-slate-200 pt-2 text-[11px] font-semibold text-slate-500">
            Created by Vaibhav Shah
          </p>
        </div>
      </aside>
    </>
  );
}
