export interface CommandMatch {
  path: string;
  label: string;
}

interface Rule {
  test: RegExp;
  build: (input: string, match: RegExpMatchArray) => CommandMatch;
}

const rules: Rule[] = [
  {
    test: /best selfie|top selfie|selfie finder|my best photo/i,
    build: () => ({ path: "/selfies", label: "Best Selfie Finder" }),
  },
  {
    test: /duplicate|clean.*storage|free up space|storage clean/i,
    build: () => ({ path: "/duplicates", label: "Duplicate & Storage Cleaner" }),
  },
  {
    test: /trip to ([a-z\s]+)|travel(?:ed|led)? to ([a-z\s]+)|vacation in ([a-z\s]+)/i,
    build: (input, match) => {
      const place = (match[1] ?? match[2] ?? match[3] ?? "").trim();
      return {
        path: `/travel${place ? `?q=${encodeURIComponent(place)}` : ""}`,
        label: place ? `Travel Albums — ${place}` : "Travel Albums & Timelines",
      };
    },
  },
  {
    test: /travel (?:album|timeline)/i,
    build: () => ({ path: "/travel", label: "Travel Albums & Timelines" }),
  },
  {
    test: /collage|photo book|poster|memory journal|scrapbook/i,
    build: () => ({ path: "/books", label: "Photo Books, Posters & Memory Journals" }),
  },
  {
    test: /instagram story|ig story/i,
    build: () => ({ path: "/studio?preset=ig-story", label: "Social Media Studio — Instagram Story" }),
  },
  {
    test: /instagram (post|square)/i,
    build: () => ({ path: "/studio?preset=ig-post", label: "Social Media Studio — Instagram Post" }),
  },
  {
    test: /linkedin (profile|headshot)/i,
    build: () => ({ path: "/headshots?target=linkedin", label: "Professional Headshots — LinkedIn" }),
  },
  {
    test: /linkedin banner|linkedin cover/i,
    build: () => ({ path: "/studio?preset=li-banner", label: "Social Media Studio — LinkedIn Banner" }),
  },
  {
    test: /social media|create a (post|story|banner|cover)/i,
    build: () => ({ path: "/studio", label: "Social Media Studio" }),
  },
  {
    test: /passport|visa photo/i,
    build: () => ({ path: "/passport", label: "Passport & Visa Photos" }),
  },
  {
    test: /headshot/i,
    build: () => ({ path: "/headshots", label: "Professional Headshots" }),
  },
  {
    test: /cartoon|anime|art style|sketch|stylize/i,
    build: () => ({ path: "/cartoon", label: "AI Cartoon & Art Styles" }),
  },
  {
    test: /caption|hashtag/i,
    build: () => ({ path: "/captions", label: "AI Caption Generator" }),
  },
  {
    test: /brand vault|personal brand/i,
    build: () => ({ path: "/vault", label: "Personal Brand Vault" }),
  },
  {
    test: /friend|family|who is (?:this|in this)|group by person|people/i,
    build: () => ({ path: "/people", label: "Friend & Family Collections" }),
  },
  {
    test: /find photos? (?:of|from|with) (.+)/i,
    build: (input, match) => ({
      path: `/library?q=${encodeURIComponent(match[1].trim())}`,
      label: `Search — ${match[1].trim()}`,
    }),
  },
];

export function parseCommand(input: string): CommandMatch {
  const trimmed = input.trim();
  for (const rule of rules) {
    const match = trimmed.match(rule.test);
    if (match) return rule.build(trimmed, match);
  }
  return {
    path: `/library${trimmed ? `?q=${encodeURIComponent(trimmed)}` : ""}`,
    label: trimmed ? `Search — ${trimmed}` : "Photo Library",
  };
}
