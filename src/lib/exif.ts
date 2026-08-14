import exifr from "exifr";

export interface ExtractedExif {
  takenAt: number | null;
  gps: { lat: number; lon: number } | null;
  camera: string | null;
}

export async function extractExif(file: File): Promise<ExtractedExif> {
  try {
    const data = await exifr.parse(file, {
      pick: [
        "DateTimeOriginal",
        "CreateDate",
        "ModifyDate",
        "GPSLatitude",
        "GPSLongitude",
        "Make",
        "Model",
      ],
    });

    if (!data) {
      return { takenAt: null, gps: null, camera: null };
    }

    const takenAtDate: Date | undefined =
      data.DateTimeOriginal ?? data.CreateDate ?? data.ModifyDate;

    const camera = [data.Make, data.Model].filter(Boolean).join(" ").trim() || null;

    const gps =
      typeof data.GPSLatitude === "number" && typeof data.GPSLongitude === "number"
        ? { lat: data.GPSLatitude, lon: data.GPSLongitude }
        : null;

    return {
      takenAt: takenAtDate instanceof Date ? takenAtDate.getTime() : null,
      gps,
      camera,
    };
  } catch {
    return { takenAt: null, gps: null, camera: null };
  }
}
