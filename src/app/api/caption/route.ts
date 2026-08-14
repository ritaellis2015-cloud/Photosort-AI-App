import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface CaptionRequestBody {
  imageBase64: string;
  mimeType: string;
  tone: string;
  platform: string;
}

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

function fallbackCaption(tone: string, platform: string) {
  const openers: Record<string, string[]> = {
    playful: ["Living for moments like this", "Main character energy", "Certified good day"],
    heartfelt: ["Grateful for this one", "Moments worth keeping", "This one's staying in the album"],
    professional: ["Sharing a recent highlight", "A snapshot worth sharing", "Captured this recently"],
    minimal: ["This.", "Here.", "Now."],
  };
  const hashtagSets: Record<string, string[]> = {
    Instagram: ["#photooftheday", "#memories", "#instagood", "#moments"],
    LinkedIn: ["#career", "#milestone", "#growth"],
    "X / Twitter": ["#tbt", "#moments"],
    TikTok: ["#fyp", "#momentslikethis"],
  };
  const opener = openers[tone]?.[0] ?? "Sharing this moment";
  return {
    caption: `${opener} ✨`,
    hashtags: hashtagSets[platform] ?? ["#photooftheday"],
    altText: "A photo shared from PhotoSort AI.",
    source: "fallback" as const,
  };
}

export async function POST(req: NextRequest) {
  let body: CaptionRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { imageBase64, mimeType, tone, platform } = body;
  if (!imageBase64 || !mimeType) {
    return NextResponse.json({ error: "imageBase64 and mimeType are required" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(fallbackCaption(tone, platform));
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 400,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mimeType, data: imageBase64 } },
              {
                type: "text",
                text: `Look at this photo and write social media copy for ${platform}, in a ${tone} tone. Respond with ONLY minified JSON, no markdown, in this exact shape: {"caption": string, "hashtags": string[] (5-8 items, no spaces, include the # symbol), "altText": string (a concise accessibility description of the image)}.`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error", response.status, errText);
      return NextResponse.json(fallbackCaption(tone, platform));
    }

    const data = await response.json();
    const text: string = data.content?.[0]?.text ?? "";

    try {
      const parsed = JSON.parse(text);
      return NextResponse.json({
        caption: parsed.caption ?? "",
        hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
        altText: parsed.altText ?? "",
        source: "ai" as const,
      });
    } catch {
      return NextResponse.json({ caption: text, hashtags: [], altText: "", source: "ai" as const });
    }
  } catch (err) {
    console.error("Caption generation failed", err);
    return NextResponse.json(fallbackCaption(tone, platform));
  }
}
