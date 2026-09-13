import type { BrandProfile } from "@/lib/creative";

export const runtime = "nodejs";

function metadata(html: string, key: string) {
  const pattern = new RegExp(`<meta[^>]+(?:name|property)=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i");
  return html.match(pattern)?.[1]?.trim();
}

function titleFrom(html: string) {
  return html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string };
    const url = new URL(String(body.url || ""));
    if (!(["http:", "https:"].includes(url.protocol))) throw new Error("Use an http or https brand URL.");
    const response = await fetch(url, {
      headers: { "User-Agent": "CreativeStudio/0.1 brand-profile" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`The brand page returned ${response.status}.`);
    const html = (await response.text()).slice(0, 220_000);
    const name = metadata(html, "og:site_name") || titleFrom(html) || url.hostname.replace(/^www\./, "");
    const description = metadata(html, "description") || metadata(html, "og:description") || "A brand with a distinct product point of view.";
    const profile: BrandProfile = {
      name,
      mission: description,
      voice: ["clear", "confident", "specific"],
      palette: ["derived from the supplied brand page", "use the product as the colour anchor"],
      patterns: ["reuse recurring visual motifs from the brand page", "keep typography and imagery coherent across outputs"],
      sourceUrl: url.toString(),
      mode: "extracted",
    };
    return Response.json({ profile });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Could not read that brand URL." },
      { status: 400 },
    );
  }
}
