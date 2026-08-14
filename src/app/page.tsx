"use client";

import Link from "next/link";
import { ArrowRight, Camera } from "lucide-react";
import { CommandBar } from "@/components/CommandBar";
import { UploadZone } from "@/components/UploadZone";
import { PhotoGrid } from "@/components/PhotoGrid";
import { NAV_ITEMS } from "@/lib/nav";
import { useLibraryStore } from "@/store/library";

export default function HomePage() {
  const photos = useLibraryStore((s) => s.photos);
  const recent = [...photos].sort((a, b) => b.addedAt - a.addedAt).slice(0, 12);

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-border bg-gradient-to-br from-bg-elevated to-bg-card px-6 py-10 sm:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent">
            <Camera size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-semibold sm:text-3xl">
            Stop scrolling. Start finding.
          </h1>
          <p className="mt-2 text-sm text-text-muted sm:text-base">
            PhotoSort AI organizes your camera roll and turns it into content —
            best selfies, travel albums, social posts, headshots and more, all
            in a couple of words.
          </p>
          <div className="mt-6">
            <CommandBar autoFocus />
          </div>
        </div>
      </section>

      {photos.length === 0 ? (
        <UploadZone />
      ) : (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-text-muted">Recently added</h2>
            <Link href="/library" className="flex items-center gap-1 text-xs text-accent hover:underline">
              View library <ArrowRight size={12} />
            </Link>
          </div>
          <PhotoGrid photos={recent} />
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-medium text-text-muted">Everything you can do</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {NAV_ITEMS.filter((item) => item.path !== "/library").map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className="group flex items-start gap-3 rounded-2xl border border-border-soft bg-bg-card p-4 transition-colors hover:border-accent/50 hover:bg-bg-elevated"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-strong">
                  <Icon size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="mt-0.5 text-xs text-text-faint">{item.description}</p>
                </div>
                <ArrowRight
                  size={14}
                  className="ml-auto mt-2 shrink-0 text-text-faint opacity-0 transition-opacity group-hover:opacity-100"
                />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
