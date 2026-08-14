import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { StoreHydrator } from "@/components/StoreHydrator";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PhotoSort AI — Organize, rediscover & create from your photos",
  description:
    "AI-powered photo organization and content creation. Find your best selfies, clean duplicates, build travel albums, and turn photos into social posts, headshots, passport photos and more.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full">
        <StoreHydrator />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
