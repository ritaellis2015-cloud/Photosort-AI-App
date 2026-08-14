"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, Menu } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";
import { NAV_ITEMS } from "@/lib/nav";
import { useLibraryStore } from "@/store/library";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const photoCount = useLibraryStore((s) => s.photos.length);

  return (
    <div className="flex min-h-screen">
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-30 w-64 shrink-0 border-r border-border bg-bg-elevated transition-transform lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          <Link
            href="/"
            className="flex items-center gap-2 px-5 py-5 border-b border-border-soft"
            onClick={() => setMobileOpen(false)}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
              <Camera size={17} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">PhotoSort AI</p>
              <p className="text-[11px] text-text-faint leading-tight">
                {photoCount} photo{photoCount === 1 ? "" : "s"}
              </p>
            </div>
          </Link>

          <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.path || pathname.startsWith(item.path + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={clsx(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-accent-soft text-accent-strong font-medium"
                      : "text-text-muted hover:bg-bg-card hover:text-text",
                  )}
                >
                  <Icon size={17} className="shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-border-soft px-5 py-4">
            <p className="text-[11px] text-text-faint leading-relaxed">
              Photos are processed and stored locally in your browser. Nothing
              is uploaded unless you use an AI-powered export.
            </p>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border-soft bg-bg/80 backdrop-blur px-4 py-3 lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg border border-border p-2 text-text-muted"
          >
            <Menu size={18} />
          </button>
          <span className="text-sm font-semibold">PhotoSort AI</span>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
