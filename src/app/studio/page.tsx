"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, Wand2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { PhotoSourcePicker } from "@/components/PhotoSourcePicker";
import { CropStudio, type CropStudioHandle } from "@/components/CropStudio";
import { usePhotoUrl } from "@/hooks/usePhotoUrl";
import { SOCIAL_PRESETS } from "@/lib/presets";

function groupPresets() {
  const groups = new Map<string, typeof SOCIAL_PRESETS>();
  for (const preset of SOCIAL_PRESETS) {
    if (!groups.has(preset.group)) groups.set(preset.group, []);
    groups.get(preset.group)!.push(preset);
  }
  return Array.from(groups.entries());
}

function StudioContent() {
  const searchParams = useSearchParams();
  const [photoId, setPhotoId] = useState<string | null>(searchParams.get("photo"));
  const [presetId, setPresetId] = useState(searchParams.get("preset") ?? SOCIAL_PRESETS[0].id);
  const [exporting, setExporting] = useState(false);
  const cropRef = useRef<CropStudioHandle>(null);
  const url = usePhotoUrl(photoId);

  const preset = SOCIAL_PRESETS.find((p) => p.id === presetId) ?? SOCIAL_PRESETS[0];
  const groups = useMemo(() => groupPresets(), []);

  async function handleExport() {
    if (!cropRef.current) return;
    setExporting(true);
    try {
      const blob = await cropRef.current.exportBlob(preset.width, preset.height);
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${preset.id}.jpg`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <PageHeader
        icon={Wand2}
        title="Social Media Studio"
        description="Reframe any photo to the exact dimensions each platform expects, then export in one click."
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <PhotoSourcePicker selectedId={photoId} onSelect={setPhotoId} />

          {photoId && url && (
            <div className="mt-6">
              <CropStudio ref={cropRef} imageUrl={url} aspectRatio={preset.width / preset.height} />
            </div>
          )}
        </div>

        <div className="space-y-5">
          {groups.map(([group, presets]) => (
            <div key={group}>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-faint">{group}</p>
              <div className="space-y-1.5">
                {presets.map((p) => (
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
          ))}

          <button
            onClick={handleExport}
            disabled={!photoId || exporting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-strong disabled:opacity-40"
          >
            <Download size={15} /> {exporting ? "Exporting…" : `Export ${preset.width}×${preset.height}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StudioPage() {
  return (
    <Suspense>
      <StudioContent />
    </Suspense>
  );
}
