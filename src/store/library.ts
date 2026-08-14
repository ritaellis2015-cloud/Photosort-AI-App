import { create } from "zustand";
import type { CollectionRecord, PersonRecord, PhotoRecord, TripRecord } from "@/lib/types";
import {
  deletePhotos as dbDeletePhotos,
  getAllCollections,
  getAllPeople,
  getAllPhotos,
  getAllTrips,
  putCollection as dbPutCollection,
  putPerson as dbPutPerson,
  putTrip as dbPutTrip,
  updatePhoto as dbUpdatePhoto,
} from "@/lib/db";
import { ingestFile } from "@/lib/ingest";
import { revokePhotoUrl } from "@/lib/blobUrlCache";
import { clusterFaces } from "@/lib/faces";
import { v4 as uuid } from "uuid";

interface UploadProgress {
  total: number;
  done: number;
  active: boolean;
}

interface LibraryState {
  photos: PhotoRecord[];
  people: PersonRecord[];
  trips: TripRecord[];
  collections: CollectionRecord[];
  hydrated: boolean;
  upload: UploadProgress;

  hydrate: () => Promise<void>;
  addFiles: (files: File[]) => Promise<void>;
  updatePhoto: (photo: PhotoRecord) => Promise<void>;
  deletePhotos: (ids: string[]) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  addTag: (id: string, tag: string) => Promise<void>;
  removeTag: (id: string, tag: string) => Promise<void>;
  rebuildPeople: () => Promise<void>;
  savePerson: (person: PersonRecord) => Promise<void>;
  saveTrip: (trip: TripRecord) => Promise<void>;
  saveCollection: (collection: CollectionRecord) => Promise<void>;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  photos: [],
  people: [],
  trips: [],
  collections: [],
  hydrated: false,
  upload: { total: 0, done: 0, active: false },

  hydrate: async () => {
    if (get().hydrated) return;
    const [photos, people, trips, collections] = await Promise.all([
      getAllPhotos(),
      getAllPeople(),
      getAllTrips(),
      getAllCollections(),
    ]);
    set({ photos, people, trips, collections, hydrated: true });
  },

  addFiles: async (files: File[]) => {
    set({ upload: { total: files.length, done: 0, active: true } });
    const results: PhotoRecord[] = [];
    for (const file of files) {
      try {
        const record = await ingestFile(file);
        if (record) results.push(record);
      } catch (err) {
        console.error("Failed to ingest", file.name, err);
      }
      set((s) => ({ upload: { ...s.upload, done: s.upload.done + 1 } }));
    }
    set((s) => ({
      photos: [...s.photos, ...results],
      upload: { total: 0, done: 0, active: false },
    }));
    if (results.some((r) => r.faces && r.faces.length > 0)) {
      await get().rebuildPeople();
    }
  },

  updatePhoto: async (photo: PhotoRecord) => {
    await dbUpdatePhoto(photo);
    set((s) => ({ photos: s.photos.map((p) => (p.id === photo.id ? photo : p)) }));
  },

  deletePhotos: async (ids: string[]) => {
    await dbDeletePhotos(ids);
    ids.forEach(revokePhotoUrl);
    set((s) => ({ photos: s.photos.filter((p) => !ids.includes(p.id)) }));
  },

  toggleFavorite: async (id: string) => {
    const photo = get().photos.find((p) => p.id === id);
    if (!photo) return;
    await get().updatePhoto({ ...photo, favorite: !photo.favorite });
  },

  addTag: async (id: string, tag: string) => {
    const photo = get().photos.find((p) => p.id === id);
    if (!photo || photo.tags.includes(tag)) return;
    await get().updatePhoto({ ...photo, tags: [...photo.tags, tag] });
  },

  removeTag: async (id: string, tag: string) => {
    const photo = get().photos.find((p) => p.id === id);
    if (!photo) return;
    await get().updatePhoto({ ...photo, tags: photo.tags.filter((t) => t !== tag) });
  },

  rebuildPeople: async () => {
    const photos = get().photos;
    const inputs = photos.flatMap((photo) =>
      (photo.faces ?? []).map((face) => ({ photoId: photo.id, face })),
    );
    if (inputs.length === 0) return;

    const clusters = clusterFaces(inputs).filter((c) => c.members.length >= 1);
    const existingPeople = get().people;

    const people: PersonRecord[] = clusters.map((cluster, idx) => {
      const photoIds = Array.from(new Set(cluster.members.map((m) => m.photoId)));
      const existing = existingPeople[idx];
      return {
        id: existing?.id ?? uuid(),
        name: existing?.name ?? `Person ${idx + 1}`,
        descriptor: cluster.descriptor,
        coverPhotoId: photoIds[0],
        photoIds,
      };
    });

    await Promise.all(people.map(dbPutPerson));

    const photoUpdates = photos.map((photo) => {
      const personIds = people.filter((p) => p.photoIds.includes(photo.id)).map((p) => p.id);
      return { ...photo, personIds };
    });
    await Promise.all(photoUpdates.map(dbUpdatePhoto));

    set({ people, photos: photoUpdates });
  },

  savePerson: async (person: PersonRecord) => {
    await dbPutPerson(person);
    set((s) => ({
      people: s.people.some((p) => p.id === person.id)
        ? s.people.map((p) => (p.id === person.id ? person : p))
        : [...s.people, person],
    }));
  },

  saveTrip: async (trip: TripRecord) => {
    await dbPutTrip(trip);
    set((s) => ({
      trips: s.trips.some((t) => t.id === trip.id)
        ? s.trips.map((t) => (t.id === trip.id ? trip : t))
        : [...s.trips, trip],
    }));
  },

  saveCollection: async (collection: CollectionRecord) => {
    await dbPutCollection(collection);
    set((s) => ({
      collections: s.collections.some((c) => c.id === collection.id)
        ? s.collections.map((c) => (c.id === collection.id ? collection : c))
        : [...s.collections, collection],
    }));
  },
}));
