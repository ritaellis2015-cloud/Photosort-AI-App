import { getPhotoBlob } from "./db";

const cache = new Map<string, string>();
const pending = new Map<string, Promise<string | null>>();

export async function getPhotoUrl(id: string): Promise<string | null> {
  const cached = cache.get(id);
  if (cached) return cached;

  const inFlight = pending.get(id);
  if (inFlight) return inFlight;

  const promise = (async () => {
    const blob = await getPhotoBlob(id);
    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    cache.set(id, url);
    pending.delete(id);
    return url;
  })();

  pending.set(id, promise);
  return promise;
}

export function revokePhotoUrl(id: string) {
  const url = cache.get(id);
  if (url) {
    URL.revokeObjectURL(url);
    cache.delete(id);
  }
}

export function revokeAll() {
  for (const url of cache.values()) URL.revokeObjectURL(url);
  cache.clear();
}
