import { canvasToBlob } from "./image";

const SHEET_DPI = 300;
const SHEET_WIDTH_IN = 4;
const SHEET_HEIGHT_IN = 6;
const GAP_PX = 12;

export async function buildPrintSheet(photoBlob: Blob, idWidthPx: number, idHeightPx: number): Promise<Blob> {
  const sheetW = SHEET_WIDTH_IN * SHEET_DPI;
  const sheetH = SHEET_HEIGHT_IN * SHEET_DPI;

  const cols = Math.max(1, Math.floor((sheetW + GAP_PX) / (idWidthPx + GAP_PX)));
  const rows = Math.max(1, Math.floor((sheetH + GAP_PX) / (idHeightPx + GAP_PX)));

  const gridW = cols * idWidthPx + (cols - 1) * GAP_PX;
  const gridH = rows * idHeightPx + (rows - 1) * GAP_PX;
  const offsetX = (sheetW - gridW) / 2;
  const offsetY = (sheetH - gridH) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = sheetW;
  canvas.height = sheetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, sheetW, sheetH);

  const img = await createImageBitmap(photoBlob);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = offsetX + c * (idWidthPx + GAP_PX);
      const y = offsetY + r * (idHeightPx + GAP_PX);
      ctx.drawImage(img, x, y, idWidthPx, idHeightPx);
      ctx.strokeStyle = "#c9c9c9";
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, idWidthPx, idHeightPx);
    }
  }

  return canvasToBlob(canvas, "image/jpeg", 0.95);
}
