import type { LucideIcon } from "lucide-react";
import {
  Images,
  Sparkles,
  CopyX,
  UserRound,
  Plane,
  Users,
  Wand2,
  IdCard,
  Palette,
  BookImage,
  MessageSquareText,
  BadgeCheck,
} from "lucide-react";

export interface NavItem {
  path: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { path: "/library", label: "Library", description: "Smart photo organization", icon: Images },
  { path: "/selfies", label: "Best Selfies", description: "AI-ranked selfie finder", icon: Sparkles },
  { path: "/duplicates", label: "Duplicates", description: "Storage cleaner", icon: CopyX },
  { path: "/people", label: "People", description: "Friend & family collections", icon: Users },
  { path: "/travel", label: "Travel", description: "Albums & timelines", icon: Plane },
  { path: "/studio", label: "Social Studio", description: "Crop & export for social", icon: Wand2 },
  { path: "/headshots", label: "Headshots", description: "Professional headshots", icon: UserRound },
  { path: "/passport", label: "Passport / Visa", description: "ID photo compliance", icon: IdCard },
  { path: "/cartoon", label: "Cartoon & Art", description: "AI style transforms", icon: Palette },
  { path: "/books", label: "Photo Books", description: "Books, posters & collages", icon: BookImage },
  { path: "/captions", label: "Captions", description: "AI caption generator", icon: MessageSquareText },
  { path: "/vault", label: "Brand Vault", description: "Personal brand assets", icon: BadgeCheck },
];
