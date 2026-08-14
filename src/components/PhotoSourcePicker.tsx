"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageOff, Repeat } from "lucide-react";
import { usePhotoUrl } from "@/hooks/usePhotoUrl";
import { useLibraryStore } from "@/store/library";
import { UploadZone } from "./UploadZone";
import { PhotoGrid } from "./PhotoGrid";

interface PhotoSourcePickerProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function PhotoSourcePicker({ selectedId, onSelect }: PhotoSourcePickerProps) {
  const photos = useLibraryStore((s) => s.photos);
  const url = usePhotoUrl(selectedId);
  const [picking, setPicking] = useState(false);

  if (selectedId && !picking) {
    return (
      <div className="space-y-3">
        <div className="relative mx-auto flex max-h-[420px] w-full items-center justify-center overflow-hidden rounded-2xl border border-border-soft bg-bg-card">
          {url ? (
            <Image
              src={url}
              alt="Selected"
              width={800}
              height={600}
              unoptimized
              className="max-h-[420px] w-auto object-contain"
            />
          ) : (
            <div className="flex h-64 items-center justify-center text-text-faint">
              <ImageOff size={24} />
            </div>
          )}
        </div>
        <button
          onClick={() => setPicking(true)}
          className="flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
        >
          <Repeat size={12} /> Choose a different photo
        </button>
      </div>
    );
  }

  if (photos.length === 0) {
    return <UploadZone />;
  }

  return (
    <div className="max-h-[420px] overflow-y-auto scrollbar-thin rounded-2xl border border-border-soft bg-bg-card p-3">
      <PhotoGrid
        photos={[...photos].sort((a, b) => b.addedAt - a.addedAt)}
        onOpen={(id) => {
          onSelect(id);
          setPicking(false);
        }}
      />
    </div>
  );
}
