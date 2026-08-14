export type LayoutId = "poster" | "journal" | "grid-2" | "grid-3" | "grid-4" | "grid-6";
export type PageSize = "square" | "portrait" | "landscape";

export const LAYOUTS: { id: LayoutId; label: string; maxPhotos: number }[] = [
  { id: "poster", label: "Poster (1 photo + title)", maxPhotos: 1 },
  { id: "journal", label: "Memory Journal (photo + note)", maxPhotos: 1 },
  { id: "grid-2", label: "Side by Side", maxPhotos: 2 },
  { id: "grid-3", label: "Triple Collage", maxPhotos: 3 },
  { id: "grid-4", label: "Quad Grid", maxPhotos: 4 },
  { id: "grid-6", label: "Six-up Collage", maxPhotos: 6 },
];

export const PAGE_SIZES: Record<PageSize, { width: number; height: number; label: string }> = {
  square: { width: 2048, height: 2048, label: "Square" },
  portrait: { width: 1700, height: 2200, label: "Portrait" },
  landscape: { width: 2200, height: 1700, label: "Landscape" },
};

interface Slot {
  x: number;
  y: number;
  width: number;
  height: number;
}

function getSlots(layout: LayoutId, width: number, height: number, reserveTop: number, reserveBottom: number): Slot[] {
  const gutter = Math.round(width * 0.015);
  const top = reserveTop;
  const bottom = height - reserveBottom;
  const usableHeight = bottom - top;

  switch (layout) {
    case "poster":
    case "journal":
      return [{ x: gutter, y: top + gutter, width: width - gutter * 2, height: usableHeight - gutter * 2 }];
    case "grid-2": {
      const w = (width - gutter * 3) / 2;
      return [
        { x: gutter, y: top + gutter, width: w, height: usableHeight - gutter * 2 },
        { x: gutter * 2 + w, y: top + gutter, width: w, height: usableHeight - gutter * 2 },
      ];
    }
    case "grid-3": {
      const bigW = width - gutter * 2;
      const bigH = (usableHeight - gutter * 3) * 0.6;
      const smallW = (width - gutter * 3) / 2;
      const smallH = (usableHeight - gutter * 3) * 0.4;
      const smallY = top + gutter * 2 + bigH;
      return [
        { x: gutter, y: top + gutter, width: bigW, height: bigH },
        { x: gutter, y: smallY, width: smallW, height: smallH },
        { x: gutter * 2 + smallW, y: smallY, width: smallW, height: smallH },
      ];
    }
    case "grid-4": {
      const w = (width - gutter * 3) / 2;
      const h = (usableHeight - gutter * 3) / 2;
      const slots: Slot[] = [];
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 2; c++) {
          slots.push({ x: gutter + c * (w + gutter), y: top + gutter + r * (h + gutter), width: w, height: h });
        }
      }
      return slots;
    }
    case "grid-6": {
      const w = (width - gutter * 4) / 3;
      const h = (usableHeight - gutter * 3) / 2;
      const slots: Slot[] = [];
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 3; c++) {
          slots.push({ x: gutter + c * (w + gutter), y: top + gutter + r * (h + gutter), width: w, height: h });
        }
      }
      return slots;
    }
  }
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, slot: Slot) {
  const scale = Math.max(slot.width / img.naturalWidth, slot.height / img.naturalHeight);
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  const x = slot.x + (slot.width - w) / 2;
  const y = slot.y + (slot.height - h) / 2;

  ctx.save();
  ctx.beginPath();
  ctx.rect(slot.x, slot.y, slot.width, slot.height);
  ctx.clip();
  ctx.drawImage(img, x, y, w, h);
  ctx.restore();
}

export interface RenderPageConfig {
  layout: LayoutId;
  pageSize: PageSize;
  title?: string;
  caption?: string;
  images: HTMLImageElement[];
}

export function renderPage(canvas: HTMLCanvasElement, config: RenderPageConfig) {
  const { width, height } = PAGE_SIZES[config.pageSize];
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#faf9f6";
  ctx.fillRect(0, 0, width, height);

  const reserveTop = config.layout === "poster" && config.title ? height * 0.14 : 0;
  const reserveBottom = config.layout === "journal" && config.caption ? height * 0.22 : 0;

  const slots = getSlots(config.layout, width, height, reserveTop, reserveBottom);
  config.images.slice(0, slots.length).forEach((img, i) => drawCover(ctx, img, slots[i]));

  if (config.layout === "poster" && config.title) {
    ctx.fillStyle = "#1a1a1a";
    ctx.textAlign = "center";
    ctx.font = `700 ${Math.round(width * 0.075)}px Georgia, serif`;
    ctx.fillText(config.title, width / 2, reserveTop * 0.62, width * 0.9);
  }

  if (config.layout === "journal" && config.caption) {
    ctx.fillStyle = "#33312e";
    ctx.textAlign = "center";
    ctx.font = `italic ${Math.round(width * 0.032)}px Georgia, serif`;
    wrapText(ctx, config.caption, width / 2, height - reserveBottom + width * 0.06, width * 0.82, width * 0.045);
  }

  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = Math.max(2, width * 0.003);
  ctx.strokeRect(width * 0.02, height * 0.02, width * 0.96, height * 0.96);
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(" ");
  let line = "";
  let cursorY = y;
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = word;
      cursorY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) ctx.fillText(line, x, cursorY);
}
