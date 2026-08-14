"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Images, Search, Star, Trash2, Users, X } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { UploadZone } from "@/components/UploadZone";
import { PhotoGrid } from "@/components/PhotoGrid";
import { EmptyState } from "@/components/EmptyState";
import { useLibraryStore } from "@/store/library";
import type { PhotoRecord } from "@/lib/types";

function monthKey(ts: number | null): string {
  if (!ts) return "Undated";
  const date = new Date(ts);
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function matchesQuery(photo: PhotoRecord, query: string): boolean {
  const q = query.toLowerCase();
  return (
    photo.name.toLowerCase().includes(q) ||
    (photo.camera ?? "").toLowerCase().includes(q) ||
    photo.tags.some((t) => t.toLowerCase().includes(q))
  );
}

function LibraryContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const photos = useLibraryStore((s) => s.photos);
  const deletePhotos = useLibraryStore((s) => s.deletePhotos);

  const [query, setQuery] = useState(initialQuery);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [onlyFaces, setOnlyFaces] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return photos
      .filter((p) => !p.trashed)
      .filter((p) => (query ? matchesQuery(p, query) : true))
      .filter((p) => (onlyFavorites ? p.favorite : true))
      .filter((p) => (onlyFaces ? (p.faces?.length ?? 0) > 0 : true))
      .sort((a, b) => (b.takenAt ?? b.addedAt) - (a.takenAt ?? a.addedAt));
  }, [photos, query, onlyFavorites, onlyFaces]);

  const groups = useMemo(() => {
    const map = new Map<string, PhotoRecord[]>();
    for (const photo of filtered) {
      const key = monthKey(photo.takenAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(photo);
    }
    return Array.from(map.entries());
  }, [filtered]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div>
      <PageHeader
        icon={Images}
        title="Library"
        description="Every photo you've imported, auto-organized by date with search and quick filters."
      />

      <div className="mb-6 space-y-4">
        <UploadZone compact />

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-1 min-w-[200px] items-center gap-2 rounded-xl border border-border bg-bg-elevated px-3 py-2">
            <Search size={15} className="text-text-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, camera, or tag…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-text-faint"
            />
            {query && (
              <button onClick={() => setQuery("")}>
                <X size={14} className="text-text-faint" />
              </button>
            )}
          </div>
          <FilterChip active={onlyFavorites} onClick={() => setOnlyFavorites((v) => !v)} icon={Star}>
            Favorites
          </FilterChip>
          <FilterChip active={onlyFaces} onClick={() => setOnlyFaces((v) => !v)} icon={Users}>
            Has people
          </FilterChip>
        </div>

        {selected.size > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-accent/40 bg-accent-soft px-4 py-2.5">
            <span className="text-sm font-medium">{selected.size} selected</span>
            <button
              onClick={async () => {
                await deletePhotos(Array.from(selected));
                setSelected(new Set());
              }}
              className="ml-auto flex items-center gap-1.5 rounded-lg bg-danger/15 px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/25"
            >
              <Trash2 size={13} /> Delete
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs text-text-faint hover:text-text"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {photos.length === 0 ? (
        <EmptyState
          icon={Images}
          title="Your library is empty"
          description="Upload photos above to start organizing, searching and creating."
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Search} title="No matches" description="Try a different search or clear your filters." />
      ) : (
        <div className="space-y-8">
          {groups.map(([label, groupPhotos]) => (
            <section key={label}>
              <h2 className="mb-3 text-sm font-medium text-text-muted">
                {label} <span className="text-text-faint">· {groupPhotos.length}</span>
              </h2>
              <PhotoGrid
                photos={groupPhotos}
                selectedIds={selected}
                onSelect={toggleSelect}
                onOpen={toggleSelect}
              />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Star;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm transition-colors ${
        active ? "border-accent bg-accent-soft text-accent-strong" : "border-border text-text-muted hover:text-text"
      }`}
    >
      <Icon size={14} />
      {children}
    </button>
  );
}

export default function LibraryPage() {
  return (
    <Suspense>
      <LibraryContent />
    </Suspense>
  );
}
