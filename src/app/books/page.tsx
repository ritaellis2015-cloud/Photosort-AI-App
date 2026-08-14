"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BookImage, Download, FileDown, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { PhotoGrid } from "@/components/PhotoGrid";
import { useLibraryStore } from "@/store/library";
import { getPhotoBlob } from "@/lib/db";
import { loadHtmlImage, canvasToBlob } from "@/lib/image";
import { LAYOUTS, PAGE_SIZES, renderPage, type LayoutId, type PageSize } from "@/lib/layout";
import { v4 as uuid } from "uuid";

interface DraftPage {
  id: string;
  layout: LayoutId;
  pageSize: PageSize;
  title: string;
  caption: string;
  photoIds: string[];
}

function newDraft(): DraftPage {
  return { id: uuid(), layout: "grid-4", pageSize: "square", title: "", caption: "", photoIds: [] };
}

export default function BooksPage() {
  const photos = useLibraryStore((s) => s.photos);
  const [draft, setDraft] = useState<DraftPage>(newDraft());
  const [pages, setPages] = useState<DraftPage[]>([]);
  const [exportingPdf, setExportingPdf] = useState(false);
  const previewRef = useRef<HTMLCanvasElement>(null);

  const layout = LAYOUTS.find((l) => l.id === draft.layout)!;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const canvas = previewRef.current;
      if (!canvas) return;
      const images = await Promise.all(
        draft.photoIds.slice(0, layout.maxPhotos).map(async (id) => {
          const blob = await getPhotoBlob(id);
          return blob ? loadHtmlImage(blob) : null;
        }),
      );
      if (cancelled) return;
      renderPage(canvas, {
        layout: draft.layout,
        pageSize: draft.pageSize,
        title: draft.title,
        caption: draft.caption,
        images: images.filter((i): i is HTMLImageElement => !!i),
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [draft, layout.maxPhotos]);

  function togglePhoto(id: string) {
    setDraft((prev) => {
      const has = prev.photoIds.includes(id);
      if (has) return { ...prev, photoIds: prev.photoIds.filter((p) => p !== id) };
      if (prev.photoIds.length >= layout.maxPhotos) {
        return { ...prev, photoIds: [...prev.photoIds.slice(1), id] };
      }
      return { ...prev, photoIds: [...prev.photoIds, id] };
    });
  }

  function addPageToBook() {
    if (draft.photoIds.length === 0) return;
    setPages((prev) => [...prev, draft]);
    setDraft(newDraft());
  }

  async function downloadCurrentPage() {
    const canvas = previewRef.current;
    if (!canvas) return;
    const blob = await canvasToBlob(canvas, "image/jpeg", 0.95);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "photosort-page.jpg";
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  async function exportBook() {
    const allPages = pages.length > 0 ? pages : draft.photoIds.length > 0 ? [draft] : [];
    if (allPages.length === 0) return;
    setExportingPdf(true);
    try {
      const { jsPDF } = await import("jspdf");
      let doc: import("jspdf").jsPDF | null = null;

      for (const page of allPages) {
        const { width, height } = PAGE_SIZES[page.pageSize];
        const images = await Promise.all(
          page.photoIds.map(async (id) => {
            const blob = await getPhotoBlob(id);
            return blob ? loadHtmlImage(blob) : null;
          }),
        );
        const canvas = document.createElement("canvas");
        renderPage(canvas, {
          layout: page.layout,
          pageSize: page.pageSize,
          title: page.title,
          caption: page.caption,
          images: images.filter((i): i is HTMLImageElement => !!i),
        });
        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

        if (!doc) {
          doc = new jsPDF({ unit: "px", format: [width, height] });
        } else {
          doc.addPage([width, height]);
        }
        doc.addImage(dataUrl, "JPEG", 0, 0, width, height);
      }

      doc?.save("photosort-photo-book.pdf");
    } finally {
      setExportingPdf(false);
    }
  }

  const eligiblePhotos = useMemo(() => photos.filter((p) => !p.trashed), [photos]);

  return (
    <div>
      <PageHeader
        icon={BookImage}
        title="Photo Books, Posters & Memory Journals"
        description="Compose collage pages, posters and journal spreads from your photos, then export a print-ready PDF."
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-faint">
              Select up to {layout.maxPhotos} photo{layout.maxPhotos === 1 ? "" : "s"} for this page
            </p>
            {eligiblePhotos.length === 0 ? (
              <EmptyState icon={BookImage} title="No photos yet" description="Upload photos in the Library first." />
            ) : (
              <div className="max-h-72 overflow-y-auto scrollbar-thin rounded-2xl border border-border-soft bg-bg-card p-3">
                <PhotoGrid
                  photos={eligiblePhotos}
                  selectedIds={new Set(draft.photoIds)}
                  onSelect={togglePhoto}
                  onOpen={togglePhoto}
                />
              </div>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-text-faint">Live preview</p>
            <div className="overflow-hidden rounded-2xl border border-border-soft bg-bg-elevated p-4">
              <canvas ref={previewRef} className="mx-auto max-h-[420px] w-auto max-w-full rounded-lg shadow-lg" />
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-faint">Layout</p>
            <div className="grid grid-cols-2 gap-1.5">
              {LAYOUTS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setDraft((prev) => ({ ...prev, layout: l.id, photoIds: prev.photoIds.slice(0, l.maxPhotos) }))}
                  className={`rounded-xl border px-2.5 py-2 text-left text-xs transition-colors ${
                    l.id === draft.layout
                      ? "border-accent bg-accent-soft text-accent-strong"
                      : "border-border-soft text-text-muted hover:text-text"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-faint">Page shape</p>
            <div className="flex gap-1.5">
              {(Object.keys(PAGE_SIZES) as PageSize[]).map((size) => (
                <button
                  key={size}
                  onClick={() => setDraft((prev) => ({ ...prev, pageSize: size }))}
                  className={`flex-1 rounded-xl border px-2.5 py-2 text-xs capitalize transition-colors ${
                    size === draft.pageSize
                      ? "border-accent bg-accent-soft text-accent-strong"
                      : "border-border-soft text-text-muted hover:text-text"
                  }`}
                >
                  {PAGE_SIZES[size].label}
                </button>
              ))}
            </div>
          </div>

          {draft.layout === "poster" && (
            <div>
              <p className="mb-2 text-xs font-medium text-text-faint">Title</p>
              <input
                value={draft.title}
                onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Summer 2026"
                className="w-full rounded-xl border border-border bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </div>
          )}

          {draft.layout === "journal" && (
            <div>
              <p className="mb-2 text-xs font-medium text-text-faint">Note</p>
              <textarea
                value={draft.caption}
                onChange={(e) => setDraft((prev) => ({ ...prev, caption: e.target.value }))}
                placeholder="Write a short memory about this photo…"
                rows={3}
                className="w-full rounded-xl border border-border bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </div>
          )}

          <div className="space-y-2">
            <button
              onClick={addPageToBook}
              disabled={draft.photoIds.length === 0}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-muted hover:text-text disabled:opacity-40"
            >
              <Plus size={15} /> Add page to book ({pages.length})
            </button>
            <button
              onClick={downloadCurrentPage}
              disabled={draft.photoIds.length === 0}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-muted hover:text-text disabled:opacity-40"
            >
              <Download size={15} /> Download this page
            </button>
            <button
              onClick={exportBook}
              disabled={(pages.length === 0 && draft.photoIds.length === 0) || exportingPdf}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-strong disabled:opacity-40"
            >
              <FileDown size={15} /> {exportingPdf ? "Building PDF…" : "Export book as PDF"}
            </button>
          </div>

          {pages.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-faint">
                Pages in this book
              </p>
              <ul className="space-y-1.5">
                {pages.map((page, idx) => (
                  <li
                    key={page.id}
                    className="flex items-center justify-between rounded-lg border border-border-soft px-3 py-2 text-xs"
                  >
                    <span>
                      Page {idx + 1} · {LAYOUTS.find((l) => l.id === page.layout)?.label}
                    </span>
                    <button onClick={() => setPages((prev) => prev.filter((p) => p.id !== page.id))}>
                      <Trash2 size={13} className="text-text-faint hover:text-danger" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
