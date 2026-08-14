# PhotoSort AI

AI-powered photo organization and content creation. Stop scrolling your camera
roll — find the photos you need and turn them into content, memories and
professional assets, all from a natural-language command bar.

Photos never leave your browser: everything is processed and stored locally
with IndexedDB. The only optional network call is the AI Caption Generator,
which uses Claude's vision API if you provide an API key.

## Quick preview (no install required)

[`preview.html`](./preview.html) is a self-contained, static walkthrough of
the app — open it directly in a browser (double-click it, or `open
preview.html`) to click through the whole UI with sample photos, no `npm
install` needed. The crop/export tools, duplicate cleanup, and cartoon-style
filters are genuinely functional there too; it's meant for a quick look, not
a substitute for running the real app against your own photos.

## Features

| Feature | What it does |
|---|---|
| **Smart Photo Organization** | Upload photos, auto-grouped by month with search and favorite/people filters. |
| **Duplicate & Storage Cleaner** | Groups near-identical shots with perceptual image hashing and suggests which to keep. |
| **Best Selfie Finder** | Scores every photo with a face on framing, sharpness and confidence to surface your best shots. |
| **Friend & Family Collections** | Clusters recurring faces across your library automatically — no manual tagging. |
| **Travel Albums & Timelines** | Groups geotagged photos into trips by place and date, with reverse-geocoded location labels. |
| **Social Media Studio** | Drag-to-reposition crop tool with exact-pixel presets for Instagram, LinkedIn, Facebook, X and more. |
| **Professional Headshots** | Framing guide + export presets sized for LinkedIn, resumes and directories. |
| **Passport & Visa Photos** | Country-specific ID photo sizing (US, Schengen, UK, India, China, Canada) plus a printable 4×6 photo sheet. |
| **AI Cartoon & Art Styles** | Cartoon, pencil sketch, pop art and watercolor style transforms, rendered entirely on-device. |
| **Photo Books, Posters & Memory Journals** | Build multi-page collages, posters and journal spreads; export a print-ready PDF. |
| **AI Caption Generator** | Generates a caption, hashtags and alt text for a photo via Claude's vision API (falls back to templates without a key). |
| **Personal Brand Vault** | A curated home for your best headshots and on-brand photos, plus a simple brand kit (name, tagline, colors). |

All of the above are reachable by typing directly into the command bar on the
home page, e.g.:

- "Show me my best selfies"
- "Find photos from my trip to Georgia"
- "Create an Instagram Story"
- "Create a LinkedIn profile image"
- "Make a passport photo"
- "Create a travel collage"
- "Turn this photo into a cartoon"

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and upload a few photos
from the home page or the Library.

### Enabling AI captions (optional)

Copy `.env.example` to `.env.local` and set `ANTHROPIC_API_KEY` to enable
real AI-generated captions. Without a key, the Caption Generator still works
using template-based captions.

```bash
cp .env.example .env.local
```

## How it works

- **Storage** — photos and derived metadata live in IndexedDB (`src/lib/db.ts`), nothing is uploaded on import.
- **Organization** — EXIF date/GPS/camera extraction (`src/lib/exif.ts`), 8×8 average-hash duplicate detection (`src/lib/hash.ts`), and trip clustering by location + date (`src/lib/geo.ts`).
- **Faces** — [`@vladmandic/face-api`](https://github.com/vladmandic/face-api) (TensorFlow.js) runs face detection and recognition fully client-side using models bundled in `public/models`; a heuristic selfie-quality score and greedy descriptor clustering group photos by person.
- **Creative tools** — the crop studio (`src/components/CropStudio.tsx`) does pixel-accurate cover-crop export at any target size; `src/lib/stylize.ts` implements cartoon/sketch/pop-art/watercolor filters with plain canvas pixel manipulation (Sobel edges, posterization, color-dodge blending); `src/lib/layout.ts` composes collage/poster/journal pages exported to PDF via `jspdf`.
- **Captions** — `src/app/api/caption/route.ts` calls the Anthropic Messages API with the photo as an image block, with a graceful template fallback when no API key is configured.

## Tech stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · Zustand · IndexedDB (`idb`) · `@vladmandic/face-api` · `exifr` · `jspdf`
