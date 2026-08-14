"use client";

import type { PhotoRecord } from "@/lib/types";
import { PhotoCard } from "./PhotoCard";

interface PhotoGridProps {
  photos: PhotoRecord[];
  selectedIds?: Set<string>;
  onSelect?: (id: string) => void;
  onOpen?: (id: string) => void;
  getBadge?: (photo: PhotoRecord) => string | undefined;
}

export function PhotoGrid({ photos, selectedIds, onSelect, onOpen, getBadge }: PhotoGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {photos.map((photo) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          selected={selectedIds?.has(photo.id)}
          onSelect={onSelect}
          onOpen={onOpen}
          badge={getBadge?.(photo)}
        />
      ))}
    </div>
  );
}
