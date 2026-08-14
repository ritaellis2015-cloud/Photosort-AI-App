"use client";

import { useEffect, useState } from "react";
import { getPhotoUrl } from "@/lib/blobUrlCache";

export function usePhotoUrl(id: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getPhotoUrl(id).then((result) => {
      if (!cancelled) setUrl(result);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return id ? url : null;
}
