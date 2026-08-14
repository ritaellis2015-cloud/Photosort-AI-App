import type { GeoPoint } from "./types";

export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export interface TripPhoto {
  id: string;
  takenAt: number | null;
  addedAt: number;
  gps: GeoPoint | null;
}

export interface TripCluster {
  photoIds: string[];
  centroid: GeoPoint;
  startDate: number;
  endDate: number;
}

const MAX_TRIP_RADIUS_KM = 60;
const MAX_TRIP_GAP_DAYS = 4;

export function clusterTrips(photos: TripPhoto[]): TripCluster[] {
  const withGps = photos
    .filter((p): p is TripPhoto & { gps: GeoPoint } => !!p.gps)
    .map((p) => ({ ...p, ts: p.takenAt ?? p.addedAt }))
    .sort((a, b) => a.ts - b.ts);

  const clusters: (TripCluster & { pointSum: GeoPoint; count: number })[] = [];

  for (const photo of withGps) {
    const last = clusters[clusters.length - 1];
    const gapDays = last ? (photo.ts - last.endDate) / 86_400_000 : Infinity;
    const distance = last ? haversineKm(last.centroid, photo.gps) : Infinity;

    if (last && gapDays <= MAX_TRIP_GAP_DAYS && distance <= MAX_TRIP_RADIUS_KM) {
      last.photoIds.push(photo.id);
      last.endDate = photo.ts;
      last.pointSum = { lat: last.pointSum.lat + photo.gps.lat, lon: last.pointSum.lon + photo.gps.lon };
      last.count += 1;
      last.centroid = { lat: last.pointSum.lat / last.count, lon: last.pointSum.lon / last.count };
    } else {
      clusters.push({
        photoIds: [photo.id],
        centroid: photo.gps,
        pointSum: { ...photo.gps },
        count: 1,
        startDate: photo.ts,
        endDate: photo.ts,
      });
    }
  }

  return clusters
    .filter((c) => c.photoIds.length >= 2)
    .map(({ photoIds, centroid, startDate, endDate }) => ({ photoIds, centroid, startDate, endDate }));
}

const geocodeCache = new Map<string, Promise<string | null>>();

export async function reverseGeocode(point: GeoPoint): Promise<string | null> {
  const key = `${point.lat.toFixed(2)},${point.lon.toFixed(2)}`;
  const cached = geocodeCache.get(key);
  if (cached) return cached;

  const promise = (async () => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${point.lat}&lon=${point.lon}&zoom=10`,
        { headers: { Accept: "application/json" } },
      );
      if (!res.ok) return null;
      const data = await res.json();
      const addr = data.address ?? {};
      const label = addr.city || addr.town || addr.village || addr.county || addr.state;
      const country = addr.country;
      return [label, country].filter(Boolean).join(", ") || data.display_name || null;
    } catch {
      return null;
    }
  })();

  geocodeCache.set(key, promise);
  return promise;
}
