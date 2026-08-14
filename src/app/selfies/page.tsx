"use client";

import { useMemo } from "react";
import Image from "next/image";
import { Sparkles, Trophy } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { PhotoGrid } from "@/components/PhotoGrid";
import { usePhotoUrl } from "@/hooks/usePhotoUrl";
import { useLibraryStore } from "@/store/library";

function TopPick({ photoId, score }: { photoId: string; score: number }) {
  const url = usePhotoUrl(photoId);
  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-accent/40 bg-gradient-to-br from-accent-soft to-transparent">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-xl border border-border-soft mx-auto sm:mx-0">
          {url && <Image src={url} alt="Top selfie" fill unoptimized className="object-cover" />}
        </div>
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-white">
            <Trophy size={12} /> Top pick
          </span>
          <p className="mt-2 text-sm text-text-muted">
            AI selfie score: <strong className="text-text">{Math.round(score * 100)}/100</strong>{" "}
            — well-lit, sharp, and nicely framed.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SelfiesPage() {
  const photos = useLibraryStore((s) => s.photos);

  const ranked = useMemo(
    () =>
      photos
        .filter((p) => !p.trashed && p.selfieScore != null && (p.faces?.length ?? 0) > 0)
        .sort((a, b) => (b.selfieScore ?? 0) - (a.selfieScore ?? 0)),
    [photos],
  );

  return (
    <div>
      <PageHeader
        icon={Sparkles}
        title="Best Selfie Finder"
        description="Every photo with a face is scored on framing, sharpness and confidence so your best shots rise to the top."
      />

      {photos.length === 0 ? (
        <EmptyState icon={Sparkles} title="No photos yet" description="Upload photos in the Library to find your best selfies." />
      ) : ranked.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No faces detected"
          description="We couldn't find faces in your library yet. Try uploading a few photos with people in them."
        />
      ) : (
        <>
          <TopPick photoId={ranked[0].id} score={ranked[0].selfieScore ?? 0} />
          <PhotoGrid
            photos={ranked}
            getBadge={(p) => `${Math.round((p.selfieScore ?? 0) * 100)}`}
          />
        </>
      )}
    </div>
  );
}
