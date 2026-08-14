"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Plus, Wand2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { PhotoGrid } from "@/components/PhotoGrid";
import { PhotoCard } from "@/components/PhotoCard";
import { useLibraryStore } from "@/store/library";
import type { CollectionRecord } from "@/lib/types";
import { v4 as uuid } from "uuid";

const VAULT_TAG = "brand-vault";
const DEFAULT_COLORS = ["#7c5cff", "#0b0c10", "#f2f2f5"];

function BrandKitEditor({
  kit,
  onSave,
}: {
  kit: CollectionRecord | undefined;
  onSave: (overrides: Partial<{ name: string; tagline: string; colors: string[] }>) => void;
}) {
  const [name, setName] = useState((kit?.meta?.name as string) ?? "");
  const [tagline, setTagline] = useState((kit?.meta?.tagline as string) ?? "");
  const colors = (kit?.meta?.colors as string[]) ?? DEFAULT_COLORS;

  return (
    <div className="mb-8 rounded-2xl border border-border-soft bg-bg-card p-5">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-text-faint">Brand kit</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs text-text-faint">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => onSave({ name })}
            placeholder="Your name or brand"
            className="mt-1 w-full rounded-xl border border-border bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="text-xs text-text-faint">Tagline</label>
          <input
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            onBlur={() => onSave({ tagline })}
            placeholder="What you're known for"
            className="mt-1 w-full rounded-xl border border-border bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
      </div>
      <div className="mt-4">
        <label className="text-xs text-text-faint">Brand colors</label>
        <div className="mt-1.5 flex gap-2">
          {colors.map((color, i) => (
            <input
              key={i}
              type="color"
              value={color}
              onChange={(e) => {
                const next = [...colors];
                next[i] = e.target.value;
                onSave({ colors: next });
              }}
              className="h-9 w-9 cursor-pointer rounded-lg border border-border-soft bg-transparent"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function VaultPage() {
  const photos = useLibraryStore((s) => s.photos);
  const collections = useLibraryStore((s) => s.collections);
  const saveCollection = useLibraryStore((s) => s.saveCollection);
  const addTag = useLibraryStore((s) => s.addTag);
  const removeTag = useLibraryStore((s) => s.removeTag);
  const [picking, setPicking] = useState(false);

  const kit = collections.find((c) => c.kind === "brand-vault");

  const vaultPhotos = useMemo(() => photos.filter((p) => p.tags.includes(VAULT_TAG)), [photos]);
  const nonVaultPhotos = useMemo(() => photos.filter((p) => !p.tags.includes(VAULT_TAG)), [photos]);

  function persistKit(overrides: Partial<{ name: string; tagline: string; colors: string[] }>) {
    const meta = kit?.meta ?? {};
    saveCollection({
      id: kit?.id ?? uuid(),
      kind: "brand-vault",
      title: "Brand Kit",
      photoIds: [],
      createdAt: kit?.createdAt ?? Date.now(),
      meta: {
        name: meta.name ?? "",
        tagline: meta.tagline ?? "",
        colors: meta.colors ?? DEFAULT_COLORS,
        ...overrides,
      },
    });
  }

  return (
    <div>
      <PageHeader
        icon={BadgeCheck}
        title="Personal Brand Vault"
        description="Curate your best headshots and on-brand photos in one place, with a brand kit you can reuse everywhere."
      />

      <BrandKitEditor key={kit?.id ?? "new"} kit={kit} onSave={persistKit} />

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium text-text-muted">
          Vault assets <span className="text-text-faint">· {vaultPhotos.length}</span>
        </p>
        <button
          onClick={() => setPicking((v) => !v)}
          className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-sm text-text-muted hover:text-text"
        >
          <Plus size={14} /> {picking ? "Done adding" : "Add photos"}
        </button>
      </div>

      {picking && (
        <div className="mb-6 max-h-80 overflow-y-auto scrollbar-thin rounded-2xl border border-border-soft bg-bg-card p-3">
          {nonVaultPhotos.length === 0 ? (
            <p className="p-4 text-center text-sm text-text-faint">Every photo is already in your vault.</p>
          ) : (
            <PhotoGrid photos={nonVaultPhotos} onOpen={(id) => addTag(id, VAULT_TAG)} />
          )}
        </div>
      )}

      {vaultPhotos.length === 0 ? (
        <EmptyState
          icon={BadgeCheck}
          title="Your vault is empty"
          description="Add your strongest headshots and on-brand photos so they're always one click away."
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {vaultPhotos.map((photo) => (
            <div key={photo.id} className="space-y-2">
              <PhotoCard photo={photo} showFavorite={false} />
              <div className="flex gap-1.5">
                <Link
                  href={`/studio?photo=${photo.id}`}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-border py-1 text-[11px] text-text-muted hover:text-text"
                >
                  <Wand2 size={11} /> Studio
                </Link>
                <button
                  onClick={() => removeTag(photo.id, VAULT_TAG)}
                  className="flex-1 rounded-lg border border-border py-1 text-[11px] text-text-faint hover:text-danger"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
