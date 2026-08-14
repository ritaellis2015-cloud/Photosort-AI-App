"use client";

import { useEffect } from "react";
import { useLibraryStore } from "@/store/library";

export function StoreHydrator() {
  const hydrate = useLibraryStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return null;
}
