"use client";

import { useMemo, useState } from "react";
import { CopyX, Sparkles, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { PhotoCard } from "@/components/PhotoCard";
import { useLibraryStore } from "@/store/library";
import { groupByHash } from "@/lib/hash";
import { formatBytes } from "@/lib/image";
import type { PhotoRecord } from "@/lib/types";

function pickBest(items: PhotoRecord[]): PhotoRecord {
  return [...items].sort((a, b) => {
    const areaA = a.width * a.height;
    const areaB = b.width * b.height;
    if (areaA !== areaB) return areaB - areaA;
    return b.size - a.size;
  })[0];
}

export default function DuplicatesPage() {
  const photos = useLibraryStore((s) => s.photos);
  const deletePhotos = useLibraryStore((s) => s.deletePhotos);
  const [keepOverrides, setKeepOverrides] = useState<Record<number, string>>({});
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  const groups = useMemo(() => {
    const active = photos.filter((p) => !p.trashed);
    return groupByHash(active, (p) => p.aHash, 6);
  }, [photos]);

  const visibleGroups = groups
    .map((g, idx) => ({ ...g, idx }))
    .filter((g) => !dismissed.has(g.idx));

  const totalReclaimable = visibleGroups.reduce((sum, group) => {
    const keepId = keepOverrides[group.idx] ?? pickBest(group.items).id;
    return sum + group.items.filter((p) => p.id !== keepId).reduce((s, p) => s + p.size, 0);
  }, 0);

  async function cleanGroup(idx: number, items: PhotoRecord[]) {
    const keepId = keepOverrides[idx] ?? pickBest(items).id;
    const toDelete = items.filter((p) => p.id !== keepId).map((p) => p.id);
    await deletePhotos(toDelete);
    setDismissed((prev) => new Set(prev).add(idx));
  }

  async function cleanAll() {
    for (const group of visibleGroups) {
      await cleanGroup(group.idx, group.items);
    }
  }

  return (
    <div>
      <PageHeader
        icon={CopyX}
        title="Duplicate & Storage Cleaner"
        description="Near-identical shots are grouped using perceptual image hashing. Pick the best one to keep — we'll suggest it for you."
        actions={
          visibleGroups.length > 0 ? (
            <button
              onClick={cleanAll}
              className="flex items-center gap-1.5 rounded-xl bg-accent px-3.5 py-2 text-sm font-medium text-white hover:bg-accent-strong"
            >
              <Sparkles size={14} /> Clean all ({formatBytes(totalReclaimable)})
            </button>
          ) : undefined
        }
      />

      {photos.length === 0 ? (
        <EmptyState icon={CopyX} title="Nothing to scan yet" description="Upload photos in the Library to detect duplicates." />
      ) : visibleGroups.length === 0 ? (
        <EmptyState icon={Sparkles} title="No duplicates found" description="Your library looks clean — nice and tidy." />
      ) : (
        <div className="space-y-6">
          <p className="text-sm text-text-muted">
            Found <strong className="text-text">{visibleGroups.length}</strong> duplicate group
            {visibleGroups.length === 1 ? "" : "s"} — reclaim up to{" "}
            <strong className="text-success">{formatBytes(totalReclaimable)}</strong> of storage.
          </p>

          {visibleGroups.map((group) => {
            const keepId = keepOverrides[group.idx] ?? pickBest(group.items).id;
            const wasted = group.items
              .filter((p) => p.id !== keepId)
              .reduce((s, p) => s + p.size, 0);
            return (
              <div key={group.idx} className="rounded-2xl border border-border-soft bg-bg-card p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">
                    {group.items.length} similar photos ·{" "}
                    <span className="text-text-faint">save {formatBytes(wasted)}</span>
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDismissed((prev) => new Set(prev).add(group.idx))}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-muted hover:text-text"
                    >
                      Keep all
                    </button>
                    <button
                      onClick={() => cleanGroup(group.idx, group.items)}
                      className="flex items-center gap-1.5 rounded-lg bg-danger/15 px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/25"
                    >
                      <Trash2 size={12} /> Keep best, delete rest
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                  {group.items.map((photo) => (
                    <button
                      key={photo.id}
                      onClick={() =>
                        setKeepOverrides((prev) => ({ ...prev, [group.idx]: photo.id }))
                      }
                      className="text-left"
                    >
                      <PhotoCard
                        photo={photo}
                        selected={photo.id === keepId}
                        badge={photo.id === keepId ? "Keep" : formatBytes(photo.size)}
                        showFavorite={false}
                      />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
