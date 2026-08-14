import { drawToCanvas } from "./image";

const HASH_SIZE = 8;

/**
 * Computes an 8x8 average hash (aHash). Robust to resizing/compression, which
 * makes it a fast, dependency-free way to spot near-duplicate photos.
 */
export async function computeAHash(source: CanvasImageSource): Promise<string> {
  const canvas = drawToCanvas(source, HASH_SIZE, HASH_SIZE);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context unavailable");
  const { data } = ctx.getImageData(0, 0, HASH_SIZE, HASH_SIZE);

  const gray: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    gray.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
  }
  const avg = gray.reduce((a, b) => a + b, 0) / gray.length;

  let bits = "";
  for (const value of gray) {
    bits += value >= avg ? "1" : "0";
  }

  let hex = "";
  for (let i = 0; i < bits.length; i += 4) {
    hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
  }
  return hex;
}

export function hammingDistanceHex(a: string, b: string): number {
  if (a.length !== b.length) return Number.MAX_SAFE_INTEGER;
  let distance = 0;
  for (let i = 0; i < a.length; i++) {
    let xor = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    while (xor) {
      distance += xor & 1;
      xor >>= 1;
    }
  }
  return distance;
}

export interface DuplicateGroup<T> {
  items: T[];
}

/**
 * Groups items whose aHash values are within `threshold` Hamming distance of
 * each other. O(n^2) — fine for personal photo library sizes in the browser.
 */
export function groupByHash<T>(
  items: T[],
  getHash: (item: T) => string | null,
  threshold = 6,
): DuplicateGroup<T>[] {
  const withHash = items.filter((item) => getHash(item));
  const visited = new Set<number>();
  const groups: DuplicateGroup<T>[] = [];

  for (let i = 0; i < withHash.length; i++) {
    if (visited.has(i)) continue;
    const hashA = getHash(withHash[i])!;
    const cluster = [withHash[i]];
    visited.add(i);
    for (let j = i + 1; j < withHash.length; j++) {
      if (visited.has(j)) continue;
      const hashB = getHash(withHash[j])!;
      if (hammingDistanceHex(hashA, hashB) <= threshold) {
        cluster.push(withHash[j]);
        visited.add(j);
      }
    }
    if (cluster.length > 1) {
      groups.push({ items: cluster });
    }
  }

  return groups;
}
