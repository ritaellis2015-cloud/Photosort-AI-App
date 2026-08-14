"use client";

import { Suspense, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, IdCard, Info, Printer } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { PhotoSourcePicker } from "@/components/PhotoSourcePicker";
import { CropStudio, type CropStudioHandle } from "@/components/CropStudio";
import { usePhotoUrl } from "@/hooks/usePhotoUrl";
import { ID_PHOTO_PRESETS, mmToPx } from "@/lib/presets";
import { buildPrintSheet } from "@/lib/printSheet";

function PassportContent() {
  const searchParams = useSearchParams();
  const [photoId, setPhotoId] = useState<string | null>(searchParams.get("photo"));
  const [presetId, setPresetId] = useState(ID_PHOTO_PRESETS[0].id);
  const [busy, setBusy] = useState<"single" | "sheet" | null>(null);
  const cropRef = useRef<CropStudioHandle>(null);
  const url = usePhotoUrl(photoId);

  const preset = ID_PHOTO_PRESETS.find((p) => p.id === presetId) ?? ID_PHOTO_PRESETS[0];
  const widthPx = mmToPx(preset.widthMm);
  const heightPx = mmToPx(preset.heightMm);
  const guideInset = 100 - preset.headHeightPct[1];

  function download(blob: Blob, filename: string) {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  async function handleExportSingle() {
    if (!cropRef.current) return;
    setBusy("single");
    try {
      const blob = await cropRef.current.exportBlob(widthPx, heightPx);
      download(blob, `${preset.id}-photo.jpg`);
    } finally {
      setBusy(null);
    }
  }

  async function handleExportSheet() {
    if (!cropRef.current) return;
    setBusy("sheet");
    try {
      const blob = await cropRef.current.exportBlob(widthPx, heightPx);
      const sheet = await buildPrintSheet(blob, widthPx, heightPx);
      download(sheet, `${preset.id}-print-sheet.jpg`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <PageHeader
        icon={IdCard}
        title="Passport & Visa Photos"
        description="Crop and size a compliant ID photo for the country you need — plus a ready-to-print 4×6 photo sheet."
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
        <div>
          <PhotoSourcePicker selectedId={photoId} onSelect={setPhotoId} />

          {photoId && url && (
            <div className="mt-6">
              <CropStudio
                ref={cropRef}
                imageUrl={url}
                aspectRatio={preset.widthMm / preset.heightMm}
                guide="oval"
                guideInsetPct={Math.max(6, guideInset)}
              />
            </div>
          )}

          <div className="mt-4 flex gap-2 rounded-xl border border-border-soft bg-bg-card p-3 text-xs text-text-muted">
            <Info size={15} className="mt-0.5 shrink-0 text-accent" />
            <p>
              Fit your head between the guide lines, look straight at the camera with a neutral
              expression, and use a plain white or light-colored background. Requirements shown
              are general guidance — always confirm current rules with the issuing authority
              before submitting.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-faint">Country / Document</p>
            <div className="space-y-1.5">
              {ID_PHOTO_PRESETS.map((p) => (
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
                    {p.widthMm}×{p.heightMm}mm
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleExportSingle}
            disabled={!photoId || busy !== null}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-strong disabled:opacity-40"
          >
            <Download size={15} /> {busy === "single" ? "Exporting…" : "Export photo"}
          </button>
          <button
            onClick={handleExportSheet}
            disabled={!photoId || busy !== null}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-muted hover:text-text disabled:opacity-40"
          >
            <Printer size={15} /> {busy === "sheet" ? "Building…" : "Export 4×6 print sheet"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PassportPage() {
  return (
    <Suspense>
      <PassportContent />
    </Suspense>
  );
}
