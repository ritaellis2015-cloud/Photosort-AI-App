"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import { canvasToBlob } from "@/lib/image";

export interface CropStudioHandle {
  exportBlob: (outWidth: number, outHeight: number, bgColor?: string) => Promise<Blob>;
}

interface CropStudioProps {
  imageUrl: string;
  aspectRatio: number;
  guide?: "oval" | "rect" | "circle" | "none";
  guideInsetPct?: number;
}

export const CropStudio = forwardRef<CropStudioHandle, CropStudioProps>(function CropStudio(
  { imageUrl, aspectRatio, guide = "none", guideInsetPct = 12 },
  ref,
) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const imgElRef = useRef<HTMLImageElement | null>(null);
  const [imgReady, setImgReady] = useState(false);
  const [natural, setNatural] = useState({ w: 1, h: 1 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragState = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(
    null,
  );

  const displayWidth = 480;
  const displayHeight = Math.round(displayWidth / aspectRatio);

  const coverScale = useMemo(
    () => Math.max(displayWidth / natural.w, displayHeight / natural.h),
    [natural, displayHeight],
  );
  const effectiveScale = coverScale * zoom;
  const scaledW = natural.w * effectiveScale;
  const scaledH = natural.h * effectiveScale;

  const clamp = useCallback(
    (x: number, y: number) => {
      const minX = Math.min(0, displayWidth - scaledW);
      const minY = Math.min(0, displayHeight - scaledH);
      return {
        x: Math.min(0, Math.max(minX, x)),
        y: Math.min(0, Math.max(minY, y)),
      };
    },
    [scaledW, scaledH, displayHeight],
  );

  useEffect(() => {
    setImgReady(false);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgElRef.current = img;
      setNatural({ w: img.naturalWidth, h: img.naturalHeight });
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setImgReady(true);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    setOffset((prev) => clamp(prev.x, prev.y));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, natural]);

  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture(e.pointerId);
    dragState.current = { startX: e.clientX, startY: e.clientY, origX: offset.x, origY: offset.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setOffset(clamp(dragState.current.origX + dx, dragState.current.origY + dy));
  }
  function onPointerUp() {
    dragState.current = null;
  }

  useImperativeHandle(ref, () => ({
    async exportBlob(outWidth: number, outHeight: number, bgColor?: string) {
      const img = imgElRef.current;
      if (!img) throw new Error("Image not loaded");
      const canvas = document.createElement("canvas");
      canvas.width = outWidth;
      canvas.height = outHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");

      if (bgColor) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, outWidth, outHeight);
      }

      const sx = -offset.x / effectiveScale;
      const sy = -offset.y / effectiveScale;
      const sWidth = displayWidth / effectiveScale;
      const sHeight = displayHeight / effectiveScale;

      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, outWidth, outHeight);
      return canvasToBlob(canvas, "image/jpeg", 0.95);
    },
  }));

  return (
    <div className="space-y-3">
      <div
        ref={viewportRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        className="relative mx-auto touch-none select-none overflow-hidden rounded-2xl border border-border-soft bg-bg-elevated"
        style={{ width: displayWidth, maxWidth: "100%", height: displayHeight }}
      >
        {imgReady && (
          <img
            src={imageUrl}
            alt="Crop preview"
            draggable={false}
            className="absolute cursor-grab active:cursor-grabbing"
            style={{
              width: scaledW,
              height: scaledH,
              left: offset.x,
              top: offset.y,
            }}
          />
        )}

        {guide !== "none" && (
          <div
            className="pointer-events-none absolute border-2 border-dashed border-white/70"
            style={{
              inset: `${guideInsetPct}%`,
              borderRadius: guide === "rect" ? 8 : "50%",
            }}
          />
        )}
      </div>

      <div className="flex items-center gap-3 px-1">
        <ZoomOut size={15} className="text-text-faint" />
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="flex-1 accent-[var(--accent)]"
        />
        <ZoomIn size={15} className="text-text-faint" />
      </div>
      <p className="text-center text-xs text-text-faint">Drag the photo to reposition · scroll to zoom</p>
    </div>
  );
});
