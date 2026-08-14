"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { parseCommand } from "@/lib/command-parser";

const EXAMPLES = [
  "Show me my best selfies",
  "Find photos from my trip to Georgia",
  "Create an Instagram Story",
  "Create a LinkedIn profile image",
  "Make a passport photo",
  "Create a travel collage",
  "Turn this photo into a cartoon",
];

export function CommandBar({ autoFocus = false }: { autoFocus?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [showExamples, setShowExamples] = useState(false);

  function run(input: string) {
    const trimmed = input.trim();
    if (!trimmed) return;
    const { path } = parseCommand(trimmed);
    router.push(path);
    setValue("");
    setShowExamples(false);
  }

  return (
    <div className="relative w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(value);
        }}
        className="flex items-center gap-2 rounded-2xl border border-border bg-bg-elevated px-4 py-3 shadow-lg shadow-black/20 focus-within:border-accent transition-colors"
      >
        <Sparkles size={18} className="text-accent shrink-0" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setShowExamples(true)}
          onBlur={() => setTimeout(() => setShowExamples(false), 150)}
          placeholder="Ask PhotoSort AI — “show me my best selfies”, “make a passport photo”…"
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-text-faint"
          autoFocus={autoFocus}
        />
        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-xl bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-strong transition-colors shrink-0"
        >
          <Search size={14} />
          Go
        </button>
      </form>

      {showExamples && (
        <div className="absolute z-20 mt-2 w-full rounded-xl border border-border bg-bg-card p-2 shadow-xl">
          <p className="px-2 pb-1 text-xs font-medium text-text-faint uppercase tracking-wide">
            Try asking
          </p>
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                run(example);
              }}
              className="block w-full rounded-lg px-2 py-1.5 text-left text-sm text-text-muted hover:bg-bg-elevated hover:text-text transition-colors"
            >
              {example}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
