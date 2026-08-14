import { canvasToBlob } from "./image";

const MAX_DIMENSION = 1200;

function sourceCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function boxBlur(imageData: ImageData, radius: number): ImageData {
  const { width, height, data } = imageData;
  const out = new Uint8ClampedArray(data.length);
  const passes = 2;

  let src = data;
  let dst = out;

  for (let p = 0; p < passes; p++) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0,
          g = 0,
          b = 0,
          count = 0;
        for (let dy = -radius; dy <= radius; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= height) continue;
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx;
            if (nx < 0 || nx >= width) continue;
            const idx = (ny * width + nx) * 4;
            r += src[idx];
            g += src[idx + 1];
            b += src[idx + 2];
            count++;
          }
        }
        const idx = (y * width + x) * 4;
        dst[idx] = r / count;
        dst[idx + 1] = g / count;
        dst[idx + 2] = b / count;
        dst[idx + 3] = src[idx + 3];
      }
    }
    [src, dst] = [dst, src];
  }

  const final = new Uint8ClampedArray(src.length);
  final.set(src);
  return new ImageData(final, width, height);
}

function toGrayscale(data: Uint8ClampedArray): Float32Array {
  const gray = new Float32Array(data.length / 4);
  for (let i = 0; i < gray.length; i++) {
    const o = i * 4;
    gray[i] = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
  }
  return gray;
}

function sobelEdges(gray: Float32Array, width: number, height: number, threshold: number): Uint8Array {
  const edges = new Uint8Array(width * height);
  const gx = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const gy = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sx = 0;
      let sy = 0;
      let k = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const v = gray[(y + dy) * width + (x + dx)];
          sx += v * gx[k];
          sy += v * gy[k];
          k++;
        }
      }
      const mag = Math.sqrt(sx * sx + sy * sy);
      edges[y * width + x] = mag > threshold ? 1 : 0;
    }
  }
  return edges;
}

function posterize(value: number, levels: number): number {
  const step = 255 / (levels - 1);
  return Math.round(Math.round(value / step) * step);
}

export async function applyCartoonStyle(img: HTMLImageElement): Promise<Blob> {
  const canvas = sourceCanvas(img);
  const ctx = canvas.getContext("2d")!;
  const { width, height } = canvas;
  const original = ctx.getImageData(0, 0, width, height);

  const smoothed = boxBlur(original, 2);
  const gray = toGrayscale(original.data);
  const edges = sobelEdges(gray, width, height, 60);

  const out = ctx.createImageData(width, height);
  for (let i = 0; i < width * height; i++) {
    const o = i * 4;
    const isEdge = edges[i] === 1;
    if (isEdge) {
      out.data[o] = 20;
      out.data[o + 1] = 20;
      out.data[o + 2] = 24;
    } else {
      out.data[o] = posterize(smoothed.data[o], 6);
      out.data[o + 1] = posterize(smoothed.data[o + 1], 6);
      out.data[o + 2] = posterize(smoothed.data[o + 2], 6);
    }
    out.data[o + 3] = 255;
  }

  ctx.putImageData(out, 0, 0);
  return canvasToBlob(canvas, "image/jpeg", 0.95);
}

export async function applySketchStyle(img: HTMLImageElement): Promise<Blob> {
  const canvas = sourceCanvas(img);
  const ctx = canvas.getContext("2d")!;
  const { width, height } = canvas;
  const original = ctx.getImageData(0, 0, width, height);
  const gray = toGrayscale(original.data);

  const grayImageData = ctx.createImageData(width, height);
  for (let i = 0; i < gray.length; i++) {
    const o = i * 4;
    const inverted = 255 - gray[i];
    grayImageData.data[o] = inverted;
    grayImageData.data[o + 1] = inverted;
    grayImageData.data[o + 2] = inverted;
    grayImageData.data[o + 3] = 255;
  }
  const blurredInverted = boxBlur(grayImageData, 6);

  const out = ctx.createImageData(width, height);
  for (let i = 0; i < gray.length; i++) {
    const o = i * 4;
    const base = gray[i];
    const blend = blurredInverted.data[o];
    const dodge = blend >= 255 ? 255 : Math.min(255, (base * 255) / (255 - blend));
    out.data[o] = dodge;
    out.data[o + 1] = dodge;
    out.data[o + 2] = dodge;
    out.data[o + 3] = 255;
  }

  ctx.putImageData(out, 0, 0);
  return canvasToBlob(canvas, "image/jpeg", 0.95);
}

export async function applyPopArtStyle(img: HTMLImageElement): Promise<Blob> {
  const canvas = sourceCanvas(img);
  const ctx = canvas.getContext("2d")!;
  const { width, height } = canvas;
  const original = ctx.getImageData(0, 0, width, height);
  const out = ctx.createImageData(width, height);

  for (let i = 0; i < original.data.length; i += 4) {
    const r = original.data[i];
    const g = original.data[i + 1];
    const b = original.data[i + 2];
    const avg = (r + g + b) / 3;

    const boost = (channel: number) => {
      const centered = (channel - avg) * 1.6 + avg;
      return posterize(Math.max(0, Math.min(255, centered)), 4);
    };

    out.data[i] = boost(r);
    out.data[i + 1] = boost(g);
    out.data[i + 2] = boost(b);
    out.data[i + 3] = 255;
  }

  ctx.putImageData(out, 0, 0);
  return canvasToBlob(canvas, "image/jpeg", 0.95);
}

export async function applyWatercolorStyle(img: HTMLImageElement): Promise<Blob> {
  const canvas = sourceCanvas(img);
  const ctx = canvas.getContext("2d")!;
  const { width, height } = canvas;
  const original = ctx.getImageData(0, 0, width, height);

  const smoothed = boxBlur(original, 4);
  const gray = toGrayscale(original.data);
  const edges = sobelEdges(gray, width, height, 90);

  const out = ctx.createImageData(width, height);
  for (let i = 0; i < width * height; i++) {
    const o = i * 4;
    const edgeSoftness = edges[i] === 1 ? 0.55 : 1;
    out.data[o] = Math.min(255, smoothed.data[o] * edgeSoftness + 12);
    out.data[o + 1] = Math.min(255, smoothed.data[o + 1] * edgeSoftness + 12);
    out.data[o + 2] = Math.min(255, smoothed.data[o + 2] * edgeSoftness + 12);
    out.data[o + 3] = 255;
  }

  ctx.putImageData(out, 0, 0);
  return canvasToBlob(canvas, "image/jpeg", 0.95);
}

export type StyleId = "cartoon" | "sketch" | "popart" | "watercolor";

export const STYLE_OPTIONS: { id: StyleId; label: string; description: string }[] = [
  { id: "cartoon", label: "Cartoon", description: "Bold outlines with flattened, poster-like color" },
  { id: "sketch", label: "Pencil Sketch", description: "Hand-drawn graphite look" },
  { id: "popart", label: "Pop Art", description: "Punchy contrast and saturated blocks of color" },
  { id: "watercolor", label: "Watercolor", description: "Soft edges and gentle, painterly color" },
];

export async function applyStyle(img: HTMLImageElement, style: StyleId): Promise<Blob> {
  switch (style) {
    case "cartoon":
      return applyCartoonStyle(img);
    case "sketch":
      return applySketchStyle(img);
    case "popart":
      return applyPopArtStyle(img);
    case "watercolor":
      return applyWatercolorStyle(img);
  }
}
