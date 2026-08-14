"use client";

import { Suspense, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, Info, UserRound } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { PhotoSourcePicker } from "@/components/PhotoSourcePicker";
import { CropStudio, type CropStudioHandle } from "@/components/CropStudio";
import { usePhotoUrl } from "@/hooks/usePhotoUrl";
import { HEADSHOT_PRESETS } from "@/lib/presets";

function HeadshotsContent() {
  const searchParams = useSearchParams();
  const isLinkedIn = searchParams.get("target") === "linkedin";
  const [photoId, setPhotoId] = useState<string | null>(searchParams.get("photo"));
  const [presetId, setPresetId] = useState(isLinkedIn ? "linkedin" : HEADSHOT_PRESETS[0].id);
  const [exporting, setExporting] = useState(false);
  const cropRef = useRef<CropStudioHandle>(null);
  const url = usePhotoUrl(photoId);

  const preset = HEADSHOT_PRESETS.find((p) => p.id === presetId) ?? HEADSHOT_PRESETS[0];

  async function handleExport() {
    if (!cropRef.current) return;
    setExporting(true);
    try {
      const blob = await cropRef.current.exportBlob(preset.width, preset.height);
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `headshot-${preset.id}.jpg`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <PageHeader
        icon={UserRound}
        title="Professional Headshots"
        description="Frame and export a polished headshot for LinkedIn, resumes, or a company directory — sized exactly right, every time."
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
        <div>
          <PhotoSourcePicker selectedId={photoId} onSelect={setPhotoId} />

          {photoId && url && (
            <div className="mt-6">
              <CropStudio
                ref={cropRef}
                imageUrl={url}
                aspectRatio={preset.width / preset.height}
                guide="oval"
                guideInsetPct={14}
              />
            </div>
          )}

          <div className="mt-4 flex gap-2 rounded-xl border border-border-soft bg-bg-card p-3 text-xs text-text-muted">
            <Info size={15} className="mt-0.5 shrink-0 text-accent" />
            <p>
              Align your face within the oval guide, with eyes near the top third. For the most
              professional result, start from a photo with even lighting and a plain, uncluttered
              background.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-faint">Format</p>
            <div className="space-y-1.5">
              {HEADSHOT_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPresetId(p.id)}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                    p.id === presetId
                      ? "border-accent bg-accent-soft text-accent-strong"
                      : "border-border-soft text-text-muted hover:text-text"
                  }`}
                >
                  <span>{p.label}</span>
                  <span className="text-xs text-text-faint">
                    {p.width}×{p.height}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleExport}
            disabled={!photoId || exporting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-strong disabled:opacity-40"
          >
            <Download size={15} /> {exporting ? "Exporting…" : "Export headshot"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HeadshotsPage() {
  return (
    <Suspense>
      <HeadshotsContent />
    </Suspense>
  );
}
