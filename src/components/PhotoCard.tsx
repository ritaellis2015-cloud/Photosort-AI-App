"use client";

import Image from "next/image";
import { Heart, Users } from "lucide-react";
import clsx from "clsx";
import { usePhotoUrl } from "@/hooks/usePhotoUrl";
import type { PhotoRecord } from "@/lib/types";
import { useLibraryStore } from "@/store/library";

interface PhotoCardProps {
  photo: PhotoRecord;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onOpen?: (id: string) => void;
  badge?: string;
  showFavorite?: boolean;
}

export function PhotoCard({ photo, selected, onSelect, onOpen, badge, showFavorite = true }: PhotoCardProps) {
  const url = usePhotoUrl(photo.id);
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);

  return (
    <div
      className={clsx(
        "group relative aspect-square overflow-hidden rounded-xl border bg-bg-card",
        selected ? "border-accent ring-2 ring-accent" : "border-border-soft",
      )}
    >
      <button
        type="button"
        onClick={() => (onOpen ? onOpen(photo.id) : onSelect?.(photo.id))}
        className="absolute inset-0"
      >
        {url ? (
          <Image
            src={url}
            alt={photo.name}
            fill
            unoptimized
            sizes="(max-width: 768px) 33vw, 200px"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full animate-pulse bg-bg-elevated" />
        )}
      </button>

      {onSelect && (
        <button
          type="button"
          onClick={() => onSelect(photo.id)}
          className={clsx(
            "absolute left-2 top-2 h-5 w-5 rounded-md border-2 backdrop-blur transition-colors",
            selected ? "border-accent bg-accent" : "border-white/70 bg-black/20 opacity-0 group-hover:opacity-100",
          )}
        />
      )}

      {badge && (
        <span className="absolute left-2 bottom-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur">
          {badge}
        </span>
      )}

      {photo.faces && photo.faces.length > 0 && (
        <span className="absolute right-2 bottom-2 flex items-center gap-0.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] text-white backdrop-blur">
          <Users size={10} /> {photo.faces.length}
        </span>
      )}

      {showFavorite && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(photo.id);
          }}
          className="absolute right-2 top-2 rounded-full bg-black/40 p-1.5 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
        >
          <Heart
            size={13}
            className={photo.favorite ? "fill-danger text-danger" : "text-white"}
          />
        </button>
      )}
    </div>
  );
}
