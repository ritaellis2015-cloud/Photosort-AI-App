import type { IdPreset, SocialPreset } from "./types";

export const SOCIAL_PRESETS: SocialPreset[] = [
  { id: "ig-post", label: "Instagram Post", width: 1080, height: 1350, group: "Instagram" },
  { id: "ig-square", label: "Instagram Square", width: 1080, height: 1080, group: "Instagram" },
  { id: "ig-story", label: "Instagram / TikTok Story", width: 1080, height: 1920, group: "Instagram" },
  { id: "li-profile", label: "LinkedIn Profile Photo", width: 400, height: 400, group: "LinkedIn" },
  { id: "li-banner", label: "LinkedIn Banner", width: 1584, height: 396, group: "LinkedIn" },
  { id: "fb-post", label: "Facebook Post", width: 1200, height: 630, group: "Facebook" },
  { id: "fb-cover", label: "Facebook Cover", width: 851, height: 315, group: "Facebook" },
  { id: "x-post", label: "X / Twitter Post", width: 1600, height: 900, group: "X / Twitter" },
  { id: "x-header", label: "X / Twitter Header", width: 1500, height: 500, group: "X / Twitter" },
  { id: "tiktok-story", label: "TikTok Video Cover", width: 1080, height: 1920, group: "TikTok" },
  { id: "yt-thumb", label: "YouTube Thumbnail", width: 1280, height: 720, group: "YouTube" },
  { id: "yt-banner", label: "YouTube Banner", width: 2560, height: 1440, group: "YouTube" },
];

export const ID_PHOTO_PRESETS: IdPreset[] = [
  {
    id: "us-passport",
    label: "US Passport / Visa",
    widthMm: 51,
    heightMm: 51,
    headHeightPct: [50, 69],
    bgColor: "#ffffff",
    country: "United States",
  },
  {
    id: "schengen-visa",
    label: "Schengen Visa",
    widthMm: 35,
    heightMm: 45,
    headHeightPct: [70, 80],
    bgColor: "#ffffff",
    country: "European Union",
  },
  {
    id: "uk-passport",
    label: "UK Passport",
    widthMm: 35,
    heightMm: 45,
    headHeightPct: [64, 75],
    bgColor: "#ffffff",
    country: "United Kingdom",
  },
  {
    id: "india-passport",
    label: "India Passport",
    widthMm: 51,
    heightMm: 51,
    headHeightPct: [55, 75],
    bgColor: "#ffffff",
    country: "India",
  },
  {
    id: "china-visa",
    label: "China Visa",
    widthMm: 33,
    heightMm: 48,
    headHeightPct: [56, 69],
    bgColor: "#ffffff",
    country: "China",
  },
  {
    id: "canada-passport",
    label: "Canada Passport",
    widthMm: 50,
    heightMm: 70,
    headHeightPct: [43, 51],
    bgColor: "#ffffff",
    country: "Canada",
  },
];

export interface HeadshotPreset {
  id: string;
  label: string;
  width: number;
  height: number;
}

export const HEADSHOT_PRESETS: HeadshotPreset[] = [
  { id: "linkedin", label: "LinkedIn Profile", width: 1000, height: 1000 },
  { id: "corporate", label: "Corporate Directory (4:5)", width: 1200, height: 1500 },
  { id: "resume", label: "Resume / CV Portrait", width: 900, height: 1200 },
  { id: "team", label: "Team Page (Square)", width: 800, height: 800 },
];

export const PRINT_DPI = 300;

export function mmToPx(mm: number, dpi: number = PRINT_DPI): number {
  return Math.round((mm / 25.4) * dpi);
}
