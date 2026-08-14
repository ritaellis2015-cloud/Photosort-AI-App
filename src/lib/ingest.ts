import { v4 as uuid } from "uuid";
import type { PhotoRecord } from "./types";
import { extractExif } from "./exif";
import { computeAHash } from "./hash";
import { computeSelfieScore, computeSharpness, detectFaces } from "./faces";
import { drawToCanvas, loadHtmlImage } from "./image";
import { putPhoto } from "./db";

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

export interface IngestOptions {
  detectFacesEnabled?: boolean;
}

export async function ingestFile(
  file: File,
  options: IngestOptions = {},
): Promise<PhotoRecord | null> {
  if (!file.type.startsWith("image/")) return null;

  const img = await loadHtmlImage(file);
  const width = img.naturalWidth;
  const height = img.naturalHeight;

  const [exif, aHash] = await Promise.all([extractExif(file), computeAHash(img)]);

  let faces: PhotoRecord["faces"] = null;
  let selfieScore: number | null = null;

  if (options.detectFacesEnabled !== false) {
    try {
      faces = await detectFaces(img);
      const smallCanvas = drawToCanvas(img, 200, Math.round((200 * height) / width));
      const sharpness = computeSharpness(smallCanvas);
      selfieScore = computeSelfieScore(faces, width, height, sharpness);
    } catch {
      faces = null;
      selfieScore = null;
    }
  }

  const record: PhotoRecord = {
    id: uuid(),
    name: file.name,
    type: file.type,
    size: file.size,
    width,
    height,
    addedAt: Date.now(),
    takenAt: exif.takenAt ?? file.lastModified ?? null,
    gps: exif.gps,
    camera: exif.camera,
    aHash,
    faces,
    selfieScore,
    personIds: [],
    tags: [],
    favorite: false,
    trashed: false,
  };

  await putPhoto(record, file);
  return record;
}
