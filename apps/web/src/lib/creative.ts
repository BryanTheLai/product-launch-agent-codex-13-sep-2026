export const CREATIVE_OUTPUTS = ["hero", "ugc", "poster", "deck"] as const;
export type CreativeOutput = (typeof CREATIVE_OUTPUTS)[number];

export const STYLE_PRESETS = [
  { id: "exploded-fpv", label: "Exploded FPV", token: "exploded product reveal with a fast FPV fly-through" },
  { id: "under-glass", label: "Under glass", token: "under-glass editorial camera angle" },
  { id: "fisheye", label: "Fisheye", token: "dramatic fisheye perspective" },
  { id: "door-crack", label: "Door crack", token: "through-a-door-crack editorial framing" },
  { id: "birdseye", label: "Bird's eye", token: "extreme bird's-eye view" },
  { id: "glass", label: "Through glass", token: "through-glass editorial refraction" },
  { id: "foreshorten", label: "Foreshorten", token: "extreme foreshortening" },
  { id: "upside-down", label: "Upside down", token: "upside-down editorial composition" },
] as const;

export type CreativeStyleId = (typeof STYLE_PRESETS)[number]["id"];

export type BrandProfile = {
  name: string;
  mission: string;
  voice: string[];
  palette: string[];
  patterns: string[];
  sourceUrl: string;
  mode: "extracted" | "openai";
};

export type CreativeReference = {
  assetId: string;
  name: string;
  mimeType: string;
  size: number;
  url: string;
};

export type CreativePack = {
  id: string;
  sessionId: string;
  mode: "sample" | "openai";
  createdAt: string;
  reference: CreativeReference;
  instruction: string;
  styles: CreativeStyleId[];
  outputs: CreativeOutput[];
  prompt: string;
  hero: {
    assetId?: string;
    url?: string;
    label: string;
    description: string;
  };
  ugc: {
    duration: string;
    hook: string;
    shots: Array<{ time: string; visual: string; audio: string }>;
    caption: string;
  };
  poster: {
    headline: string;
    subline: string;
    layout: string;
    treatments: string[];
  };
  deck: {
    title: string;
    slides: Array<{ title: string; body: string }>;
  };
};

const outputLabels: Record<CreativeOutput, string> = {
  hero: "hero image",
  ugc: "10-second UGC concept",
  poster: "poster system",
  deck: "pitch deck outline",
};

function clean(value: string, fallback: string) {
  const trimmed = value.trim();
  return trimmed || fallback;
}

export function buildCreativePrompt({
  instruction,
  outputs,
  styles,
  brand,
}: {
  instruction: string;
  outputs: CreativeOutput[];
  styles: CreativeStyleId[];
  brand?: BrandProfile | null;
}) {
  const selectedStyles = styles
    .map((id) => STYLE_PRESETS.find((preset) => preset.id === id)?.token)
    .filter(Boolean);
  const requestedOutputs = outputs.map((output) => outputLabels[output]).join(", ");
  const brandContext = brand
    ? `Brand context from ${brand.sourceUrl}: ${brand.name}; mission: ${brand.mission}; voice: ${brand.voice.join(", ")}; palette: ${brand.palette.join(", ")}; visual patterns: ${brand.patterns.join(", ")}.`
    : "No external brand profile is connected; make a coherent, original visual system from the brief.";

  return [
    "Create a premium commercial product-creative system from the uploaded reference image.",
    `User direction: ${clean(instruction, "Turn this product into a distinctive launch campaign.")}`,
    `Requested outputs: ${requestedOutputs || "hero image, UGC concept, poster system, pitch deck outline"}.`,
    `Visual treatment: ${selectedStyles.length ? selectedStyles.join("; ") : "clean product editorial with kinetic motion"}.`,
    brandContext,
    "Preserve the product's useful silhouette, material behavior, camera relationship, and believable contact shadows while transforming the product identity according to the brief.",
    "Specify camera hardware and lens character, camera angle, lighting direction and softness, surface physics, reflections, depth of field, motion direction, and typography-safe negative space.",
    "Treat any third-party logo or trademark visible in the reference as unlicensed reference material: do not reproduce it. Replace it with an original brand identity unless the user provides rights and exact brand instructions.",
    "The result should feel art-directed, physically plausible, immediately usable in a launch review, and visually consistent across every requested output.",
  ].join("\n\n");
}

export function buildCreativePack({
  sessionId,
  reference,
  instruction,
  outputs,
  styles,
  brand,
  mode,
  generatedImage,
}: {
  sessionId: string;
  reference: CreativeReference;
  instruction: string;
  outputs: CreativeOutput[];
  styles: CreativeStyleId[];
  brand?: BrandProfile | null;
  mode: "sample" | "openai";
  generatedImage?: { assetId: string; url: string };
}): CreativePack {
  const productName = brand?.name || "the product";
  const styleName = styles
    .map((id) => STYLE_PRESETS.find((preset) => preset.id === id)?.label)
    .filter(Boolean)
    .join(" + ") || "editorial motion";
  const prompt = buildCreativePrompt({ instruction, outputs, styles, brand });

  return {
    id: `pack-${Date.now().toString(36)}`,
    sessionId,
    mode,
    createdAt: new Date().toISOString(),
    reference,
    instruction,
    styles,
    outputs,
    prompt,
    hero: {
      assetId: generatedImage?.assetId,
      url: generatedImage?.url,
      label: mode === "openai" ? "Rendered hero direction" : "Hero direction ready",
      description: `${styleName} treatment for ${productName}. The uploaded reference anchors the shape and composition; the prompt replaces the product identity with the requested direction.`,
    },
    ugc: {
      duration: "00:10",
      hook: "A familiar object enters frame. The new product arrives like a small event.",
      shots: [
        { time: "00:00–00:02", visual: "Phone-camera close-up; the reference silhouette is half-hidden in shadow.", audio: "Room tone, then a sharp can crack / click." },
        { time: "00:02–00:06", visual: "FPV push through the product as parts explode outward and snap back into the blue energy drink form.", audio: "Rising whoosh, tactile clicks, bass hit on the reveal." },
        { time: "00:06–00:10", visual: "Handheld hero hold with condensation, a clean label plane, and a short CTA in negative space.", audio: "Voiceover: 'Make your next move visible.'" },
      ],
      caption: "One reference. One new ritual. Built for the moment you need your product to land.",
    },
    poster: {
      headline: "MAKE THE NEXT MOVE VISIBLE",
      subline: "A blue energy drink designed to turn attention into momentum.",
      layout: "One oversized product silhouette, electric blue field, generous type-safe negative space, and one decisive CTA.",
      treatments: ["Hero portrait for social", "Square feed crop", "Wide launch-page banner", "Dark-mode event poster"],
    },
    deck: {
      title: `${productName} · creative launch direction`,
      slides: [
        { title: "The transformation", body: "From a plain reference image to a coherent product world that can travel across channels." },
        { title: "The visual idea", body: `${styleName}: kinetic product reveal, believable material physics, and a recognisable silhouette.` },
        { title: "The 10-second story", body: "Tease the familiar form, break the frame, reveal the blue energy drink, and finish on a crisp CTA." },
        { title: "The asset system", body: "Hero image, UGC shot list, poster crops, and a launch-page direction generated from one brief." },
        { title: "The next decision", body: "Choose one hero treatment, render the final variations, and hand the pack to the launch team." },
      ],
    },
  };
}

export function normalizeCreativeOutputs(value: unknown): CreativeOutput[] {
  if (!Array.isArray(value)) return [...CREATIVE_OUTPUTS];
  const outputs = value.filter((item): item is CreativeOutput =>
    typeof item === "string" && CREATIVE_OUTPUTS.includes(item as CreativeOutput),
  );
  return outputs.length ? [...new Set(outputs)] : [...CREATIVE_OUTPUTS];
}

export function normalizeCreativeStyles(value: unknown): CreativeStyleId[] {
  if (!Array.isArray(value)) return ["exploded-fpv"];
  const styles = value.filter((item): item is CreativeStyleId =>
    typeof item === "string" && STYLE_PRESETS.some((preset) => preset.id === item),
  );
  return styles.length ? [...new Set(styles)] : ["exploded-fpv"];
}
