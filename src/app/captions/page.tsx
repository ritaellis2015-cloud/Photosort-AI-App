"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Copy, MessageSquareText, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { PhotoSourcePicker } from "@/components/PhotoSourcePicker";
import { getPhotoBlob } from "@/lib/db";
import { blobToBase64 } from "@/lib/image";

const TONES = ["playful", "heartfelt", "professional", "minimal"];
const PLATFORMS = ["Instagram", "LinkedIn", "X / Twitter", "TikTok"];

interface CaptionResult {
  caption: string;
  hashtags: string[];
  altText: string;
  source: "ai" | "fallback";
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-text-muted hover:text-text"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copied" : "Copy"}
    </button>
  );
}

function CaptionsContent() {
  const searchParams = useSearchParams();
  const [photoId, setPhotoId] = useState<string | null>(searchParams.get("photo"));
  const [tone, setTone] = useState(TONES[0]);
  const [platform, setPlatform] = useState(PLATFORMS[0]);
  const [result, setResult] = useState<CaptionResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    if (!photoId) return;
    setLoading(true);
    setResult(null);
    try {
      const blob = await getPhotoBlob(photoId);
      if (!blob) return;
      const imageBase64 = await blobToBase64(blob);
      const res = await fetch("/api/caption", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ imageBase64, mimeType: blob.type || "image/jpeg", tone, platform }),
      });
      const data = await res.json();
      setResult(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        icon={MessageSquareText}
        title="AI Caption Generator"
        description="Generate a ready-to-post caption, hashtags and alt text for any photo, tuned to your platform and tone."
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <PhotoSourcePicker selectedId={photoId} onSelect={(id) => { setPhotoId(id); setResult(null); }} />

          {result && (
            <div className="space-y-3 rounded-2xl border border-border-soft bg-bg-card p-4">
              {result.source === "fallback" && (
                <p className="rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning">
                  No ANTHROPIC_API_KEY configured — showing a template caption. Set the environment
                  variable to enable real AI-generated captions.
                </p>
              )}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-xs font-medium text-text-faint">Caption</p>
                  <CopyButton text={result.caption} />
                </div>
                <p className="text-sm">{result.caption}</p>
              </div>
              {result.hashtags.length > 0 && (
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-xs font-medium text-text-faint">Hashtags</p>
                    <CopyButton text={result.hashtags.join(" ")} />
                  </div>
                  <p className="text-sm text-accent-strong">{result.hashtags.join(" ")}</p>
                </div>
              )}
              {result.altText && (
                <div>
                  <p className="mb-1 text-xs font-medium text-text-faint">Alt text</p>
                  <p className="text-sm text-text-muted">{result.altText}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-faint">Platform</p>
            <div className="grid grid-cols-2 gap-1.5">
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className={`rounded-xl border px-2.5 py-2 text-xs transition-colors ${
                    p === platform
                      ? "border-accent bg-accent-soft text-accent-strong"
                      : "border-border-soft text-text-muted hover:text-text"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-faint">Tone</p>
            <div className="grid grid-cols-2 gap-1.5">
              {TONES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`rounded-xl border px-2.5 py-2 text-xs capitalize transition-colors ${
                    t === tone
                      ? "border-accent bg-accent-soft text-accent-strong"
                      : "border-border-soft text-text-muted hover:text-text"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={generate}
            disabled={!photoId || loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-strong disabled:opacity-40"
          >
            <Sparkles size={15} /> {loading ? "Writing…" : "Generate caption"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CaptionsPage() {
  return (
    <Suspense>
      <CaptionsContent />
    </Suspense>
  );
}
