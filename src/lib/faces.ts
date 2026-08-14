import type { FaceInfo } from "./types";

const MODEL_URL = "/models";

let modelsLoaded: Promise<void> | null = null;

async function ensureModelsLoaded(): Promise<void> {
  if (typeof window === "undefined") throw new Error("Face detection is browser-only");
  if (!modelsLoaded) {
    modelsLoaded = (async () => {
      const faceapi = await import("@vladmandic/face-api");
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
    })();
  }
  return modelsLoaded;
}

export async function detectFaces(image: HTMLImageElement): Promise<FaceInfo[]> {
  await ensureModelsLoaded();
  const faceapi = await import("@vladmandic/face-api");

  const detections = await faceapi
    .detectAllFaces(image, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 }))
    .withFaceLandmarks(true)
    .withFaceDescriptors();

  return detections.map((d) => ({
    descriptor: Array.from(d.descriptor),
    box: {
      x: d.detection.box.x,
      y: d.detection.box.y,
      width: d.detection.box.width,
      height: d.detection.box.height,
    },
    score: d.detection.score,
  }));
}

/**
 * Heuristic "great selfie" score in [0, 1]: rewards a single large, centered,
 * confidently-detected, sharp face. This stands in for a full aesthetic model
 * while staying fast enough to run client-side over a whole library.
 */
export function computeSelfieScore(
  faces: FaceInfo[],
  imageWidth: number,
  imageHeight: number,
  sharpness: number,
): number {
  if (faces.length === 0) return 0;

  const primary = [...faces].sort((a, b) => b.box.width * b.box.height - a.box.width * a.box.height)[0];
  const faceArea = primary.box.width * primary.box.height;
  const imageArea = imageWidth * imageHeight;
  const sizeRatio = Math.min(1, faceArea / (imageArea * 0.25));

  const faceCenterX = primary.box.x + primary.box.width / 2;
  const faceCenterY = primary.box.y + primary.box.height / 2;
  const dx = Math.abs(faceCenterX / imageWidth - 0.5);
  const dy = Math.abs(faceCenterY / imageHeight - 0.5);
  const centering = 1 - Math.min(1, Math.sqrt(dx * dx + dy * dy) * 2);

  const singleFaceBonus = faces.length === 1 ? 1 : Math.max(0.4, 1 - (faces.length - 1) * 0.15);
  const sharpScore = Math.min(1, sharpness / 60);

  return (
    sizeRatio * 0.3 +
    centering * 0.25 +
    primary.score * 0.2 +
    singleFaceBonus * 0.1 +
    sharpScore * 0.15
  );
}

/**
 * Variance-of-Laplacian style sharpness estimate on a downscaled grayscale
 * canvas. Higher = sharper/more in-focus.
 */
export function computeSharpness(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext("2d");
  if (!ctx) return 0;
  const { width, height, data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const gray = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const o = i * 4;
    gray[i] = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
  }

  let sum = 0;
  let sumSq = 0;
  let count = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const laplacian =
        4 * gray[idx] - gray[idx - 1] - gray[idx + 1] - gray[idx - width] - gray[idx + width];
      sum += laplacian;
      sumSq += laplacian * laplacian;
      count++;
    }
  }
  if (count === 0) return 0;
  const mean = sum / count;
  return sumSq / count - mean * mean;
}

function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

export interface ClusterInput {
  photoId: string;
  face: FaceInfo;
}

export interface FaceCluster {
  descriptor: number[];
  members: ClusterInput[];
}

/**
 * Greedy single-pass clustering of face descriptors. Simple but effective
 * for personal photo libraries where the same person recurs across shots.
 */
export function clusterFaces(inputs: ClusterInput[], threshold = 0.55): FaceCluster[] {
  const clusters: FaceCluster[] = [];

  for (const input of inputs) {
    let best: FaceCluster | null = null;
    let bestDist = Infinity;
    for (const cluster of clusters) {
      const dist = euclideanDistance(cluster.descriptor, input.face.descriptor);
      if (dist < bestDist) {
        bestDist = dist;
        best = cluster;
      }
    }

    if (best && bestDist <= threshold) {
      best.members.push(input);
      const n = best.members.length;
      best.descriptor = best.descriptor.map(
        (v, i) => (v * (n - 1) + input.face.descriptor[i]) / n,
      );
    } else {
      clusters.push({ descriptor: [...input.face.descriptor], members: [input] });
    }
  }

  return clusters;
}
