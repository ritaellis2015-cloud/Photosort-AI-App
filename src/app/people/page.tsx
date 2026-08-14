"use client";

import { useState } from "react";
import Image from "next/image";
import { Users, Pencil, ArrowLeft, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { PhotoGrid } from "@/components/PhotoGrid";
import { usePhotoUrl } from "@/hooks/usePhotoUrl";
import { useLibraryStore } from "@/store/library";

function PersonCover({ photoId }: { photoId: string }) {
  const url = usePhotoUrl(photoId);
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-bg-elevated">
      {url && <Image src={url} alt="Person" fill unoptimized className="object-cover" />}
    </div>
  );
}

export default function PeoplePage() {
  const photos = useLibraryStore((s) => s.photos);
  const people = useLibraryStore((s) => s.people);
  const rebuildPeople = useLibraryStore((s) => s.rebuildPeople);
  const savePerson = useLibraryStore((s) => s.savePerson);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [rebuilding, setRebuilding] = useState(false);

  const active = people.find((p) => p.id === activeId);

  if (active) {
    const activePhotos = photos.filter((p) => active.photoIds.includes(p.id) && !p.trashed);
    return (
      <div>
        <button
          onClick={() => setActiveId(null)}
          className="mb-4 flex items-center gap-1.5 text-sm text-text-muted hover:text-text"
        >
          <ArrowLeft size={15} /> All people
        </button>
        <PageHeader
          icon={Users}
          title={active.name}
          description={`${activePhotos.length} photo${activePhotos.length === 1 ? "" : "s"} together`}
          actions={
            <button
              onClick={() => {
                const name = prompt("Rename this person/group", active.name);
                if (name) savePerson({ ...active, name });
              }}
              className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm text-text-muted hover:text-text"
            >
              <Pencil size={14} /> Rename
            </button>
          }
        />
        <PhotoGrid photos={activePhotos} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        icon={Users}
        title="Friend & Family Collections"
        description="Faces are automatically clustered across your library so you can revisit everyone who matters, without manual tagging."
        actions={
          <button
            onClick={async () => {
              setRebuilding(true);
              await rebuildPeople();
              setRebuilding(false);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm text-text-muted hover:text-text disabled:opacity-50"
            disabled={rebuilding}
          >
            <RefreshCw size={14} className={rebuilding ? "animate-spin" : ""} /> Re-scan faces
          </button>
        }
      />

      {photos.length === 0 ? (
        <EmptyState icon={Users} title="No photos yet" description="Upload photos to start grouping people automatically." />
      ) : people.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No people found"
          description="We couldn't detect recurring faces yet. Try re-scanning or add more photos with people in them."
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {[...people]
            .sort((a, b) => b.photoIds.length - a.photoIds.length)
            .map((person) => (
              <button key={person.id} onClick={() => setActiveId(person.id)} className="text-left">
                <PersonCover photoId={person.coverPhotoId} />
                <p className="mt-2 truncate text-sm font-medium">{person.name}</p>
                <p className="text-xs text-text-faint">
                  {person.photoIds.length} photo{person.photoIds.length === 1 ? "" : "s"}
                </p>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
