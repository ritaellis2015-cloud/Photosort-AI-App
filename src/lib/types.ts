export interface GeoPoint {
  lat: number;
  lon: number;
}

export interface FaceInfo {
  descriptor: number[];
  box: { x: number; y: number; width: number; height: number };
  score: number;
}

export interface PhotoRecord {
  id: string;
  name: string;
  type: string;
  size: number;
  width: number;
  height: number;
  addedAt: number;
  takenAt: number | null;
  gps: GeoPoint | null;
  camera: string | null;
  aHash: string | null;
  faces: FaceInfo[] | null;
  selfieScore: number | null;
  personIds: string[];
  tags: string[];
  favorite: boolean;
  trashed: boolean;
}

export interface PhotoBlobRecord {
  id: string;
  blob: Blob;
}

export interface PersonRecord {
  id: string;
  name: string;
  descriptor: number[];
  coverPhotoId: string;
  photoIds: string[];
}

export interface TripRecord {
  id: string;
  title: string;
  locationLabel: string;
  startDate: number;
  endDate: number;
  photoIds: string[];
  coverPhotoId: string;
}

export interface CollectionRecord {
  id: string;
  kind: "brand-vault" | "book" | "custom";
  title: string;
  photoIds: string[];
  createdAt: number;
  meta?: Record<string, unknown>;
}

export type SocialPreset = {
  id: string;
  label: string;
  width: number;
  height: number;
  group: "Instagram" | "LinkedIn" | "Facebook" | "X / Twitter" | "TikTok" | "YouTube";
};

export type IdPreset = {
  id: string;
  label: string;
  widthMm: number;
  heightMm: number;
  headHeightPct: [number, number];
  bgColor: string;
  country: string;
};
