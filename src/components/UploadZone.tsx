"use client";

import { useCallback, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import clsx from "clsx";
import { useLibraryStore } from "@/store/library";

export function UploadZone({ compact = false }: { compact?: boolean }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const addFiles = useLibraryStore((s) => s.addFiles);
  const upload = useLibraryStore((s) => s.upload);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      addFiles(Array.from(fileList));
    },
    [addFiles],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      className={clsx(
        "cursor-pointer rounded-2xl border-2 border-dashed transition-colors text-center",
        dragging ? "border-accent bg-accent-soft" : "border-border hover:border-accent-strong/60",
        compact ? "px-4 py-6" : "px-6 py-12",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <UploadCloud size={compact ? 22 : 32} className="mx-auto mb-3 text-accent" />
      <p className="text-sm font-medium">
        {dragging ? "Drop to import" : "Drag photos here or click to upload"}
      </p>
      <p className="mt-1 text-xs text-text-faint">
        JPG, PNG, WEBP — processed entirely in your browser
      </p>

      {upload.active && (
        <div className="mt-4 mx-auto max-w-xs">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${(upload.done / Math.max(1, upload.total)) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-text-faint">
            Analyzing {upload.done}/{upload.total}…
          </p>
        </div>
      )}
    </div>
  );
}
