"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Download, Palette, Wand2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { PhotoSourcePicker } from "@/components/PhotoSourcePicker";
import { usePhotoUrl } from "@/hooks/usePhotoUrl";
import { applyStyle, STYLE_OPTIONS, type StyleId } from "@/lib/stylize";
import { loadHtmlImage } from "@/lib/image";
import { getPhotoBlob } from "@/lib/db";

function CartoonContent() {
  const searchParams = useSearchParams();
  const [photoId, setPhotoId] = useState<string | null>(searchParams.get("photo"));
  const [style, setStyle] = useState<StyleId>("cartoon");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const url = usePhotoUrl(photoId);

  async function handleGenerate() {
    if (!photoId) return;
    setProcessing(true);
    setResultUrl(null);
    try {
      const blob = await getPhotoBlob(photoId);
      if (!blob) return;
      const img = await loadHtmlImage(blob);
      await new Promise((r) => setTimeout(r, 30));
      const styled = await applyStyle(img, style);
      setResultUrl(URL.createObjectURL(styled));
    } finally {
      setProcessing(false);
    }
  }

  function download() {
    if (!resultUrl) return;
    const link = document.createElement("a");
    link.href = resultUrl;
    link.download = `${style}-art.jpg`;
    link.click();
  }

  return (
    <div>
      <PageHeader
        icon={Palette}
        title="AI Cartoon & Art Styles"
        description="Turn any photo into cartoon, sketch, pop art or watercolor-style art, rendered right in your browser."
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]">
        <div>
          <PhotoSourcePicker selectedId={photoId} onSelect={(id) => { setPhotoId(id); setResultUrl(null); }} />

          {(url || resultUrl) && (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {url && (
                <div>
                  <p className="mb-2 text-xs font-medium text-text-faint">Original</p>
                  <div className="relative aspect-square overflow-hidden rounded-2xl border border-border-soft bg-bg-card">
                    <Image src={url} alt="Original" fill unoptimized className="object-cover" />
                  </div>
                </div>
              )}
              <div>
                <p className="mb-2 text-xs font-medium text-text-faint">
                  {STYLE_OPTIONS.find((s) => s.id === style)?.label}
                </p>
                <div className="relative aspect-square overflow-hidden rounded-2xl border border-accent/40 bg-bg-card">
                  {resultUrl ? (
                    <Image src={resultUrl} alt="Styled" fill unoptimized className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-text-faint">
                      {processing ? "Rendering…" : "Click Generate"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-faint">Style</p>
            <div className="space-y-1.5">
              {STYLE_OPTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStyle(s.id)}
                  className={`w-full rounded-xl border px-3 py-2.5 text-left transition-colors ${
                    s.id === style
                      ? "border-accent bg-accent-soft text-accent-strong"
                      : "border-border-soft text-text-muted hover:text-text"
                  }`}
                >
                  <p className="text-sm font-medium">{s.label}</p>
                  <p className="text-xs text-text-faint">{s.description}</p>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!photoId || processing}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-strong disabled:opacity-40"
          >
            <Wand2 size={15} /> {processing ? "Rendering…" : "Generate"}
          </button>

          {resultUrl && (
            <button
              onClick={download}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-muted hover:text-text"
            >
              <Download size={15} /> Download
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CartoonPage() {
  return (
    <Suspense>
      <CartoonContent />
    </Suspense>
  );
}
