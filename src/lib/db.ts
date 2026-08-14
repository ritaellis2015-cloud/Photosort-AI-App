import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type {
  PhotoRecord,
  PhotoBlobRecord,
  PersonRecord,
  TripRecord,
  CollectionRecord,
} from "./types";

interface PhotoSortDB extends DBSchema {
  photos: { key: string; value: PhotoRecord; indexes: { takenAt: number } };
  blobs: { key: string; value: PhotoBlobRecord };
  people: { key: string; value: PersonRecord };
  trips: { key: string; value: TripRecord };
  collections: { key: string; value: CollectionRecord };
}

const DB_NAME = "photosort-ai";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<PhotoSortDB>> | null = null;

export function getDb(): Promise<IDBPDatabase<PhotoSortDB>> {
  if (typeof window === "undefined") {
    throw new Error("getDb() can only be called in the browser");
  }
  if (!dbPromise) {
    dbPromise = openDB<PhotoSortDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const photos = db.createObjectStore("photos", { keyPath: "id" });
        photos.createIndex("takenAt", "takenAt");
        db.createObjectStore("blobs", { keyPath: "id" });
        db.createObjectStore("people", { keyPath: "id" });
        db.createObjectStore("trips", { keyPath: "id" });
        db.createObjectStore("collections", { keyPath: "id" });
      },
    });
  }
  return dbPromise;
}

export async function putPhoto(photo: PhotoRecord, blob: Blob) {
  const db = await getDb();
  const tx = db.transaction(["photos", "blobs"], "readwrite");
  await Promise.all([
    tx.objectStore("photos").put(photo),
    tx.objectStore("blobs").put({ id: photo.id, blob }),
    tx.done,
  ]);
}

export async function updatePhoto(photo: PhotoRecord) {
  const db = await getDb();
  await db.put("photos", photo);
}

export async function getAllPhotos(): Promise<PhotoRecord[]> {
  const db = await getDb();
  return db.getAll("photos");
}

export async function getPhotoBlob(id: string): Promise<Blob | undefined> {
  const db = await getDb();
  const rec = await db.get("blobs", id);
  return rec?.blob;
}

export async function deletePhotos(ids: string[]) {
  const db = await getDb();
  const tx = db.transaction(["photos", "blobs"], "readwrite");
  await Promise.all([
    ...ids.map((id) => tx.objectStore("photos").delete(id)),
    ...ids.map((id) => tx.objectStore("blobs").delete(id)),
  ]);
  await tx.done;
}

export async function clearAll() {
  const db = await getDb();
  const tx = db.transaction(
    ["photos", "blobs", "people", "trips", "collections"],
    "readwrite",
  );
  await Promise.all([
    tx.objectStore("photos").clear(),
    tx.objectStore("blobs").clear(),
    tx.objectStore("people").clear(),
    tx.objectStore("trips").clear(),
    tx.objectStore("collections").clear(),
    tx.done,
  ]);
}

export async function getAllPeople(): Promise<PersonRecord[]> {
  const db = await getDb();
  return db.getAll("people");
}

export async function putPerson(person: PersonRecord) {
  const db = await getDb();
  await db.put("people", person);
}

export async function getAllTrips(): Promise<TripRecord[]> {
  const db = await getDb();
  return db.getAll("trips");
}

export async function putTrip(trip: TripRecord) {
  const db = await getDb();
  await db.put("trips", trip);
}

export async function getAllCollections(): Promise<CollectionRecord[]> {
  const db = await getDb();
  return db.getAll("collections");
}

export async function putCollection(collection: CollectionRecord) {
  const db = await getDb();
  await db.put("collections", collection);
}

export async function deleteCollection(id: string) {
  const db = await getDb();
  await db.delete("collections", id);
}
