import { randomUUID } from "node:crypto";
import { buildCreativePack, normalizeCreativeOutputs, normalizeCreativeStyles, type BrandProfile } from "@/lib/creative";
import { getCreativeAsset, saveCreativeAsset } from "@/lib/server/creative-assets";

export const runtime = "nodejs";

function isBrandProfile(value: unknown): value is BrandProfile {
  return Boolean(value && typeof value === "object" && "name" in value && "sourceUrl" in value);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const assetId = typeof body.assetId === "string" ? body.assetId : "";
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : "anonymous";
    const instruction = typeof body.instruction === "string" ? body.instruction.trim() : "";
    const reference = await getCreativeAsset(assetId, sessionId);
    if (!reference || reference.kind !== "reference") {
      return Response.json({ message: "Upload a reference image before generating." }, { status: 400 });
    }
    if (!instruction) {
      return Response.json({ message: "Add a creative direction first." }, { status: 400 });
    }

    const outputs = normalizeCreativeOutputs(body.outputs);
    const styles = normalizeCreativeStyles(body.styles);
    const brand = isBrandProfile(body.brand) ? body.brand : null;
    const referenceForPack = {
      assetId: reference.assetId,
      name: reference.name,
      mimeType: reference.mimeType,
      size: reference.size,
      url: `/api/assets/${reference.assetId}`,
    };
    const prompt = buildCreativePack({
      sessionId,
      reference: referenceForPack,
      instruction,
      outputs,
      styles,
      brand,
      mode: "sample",
    }).prompt;

    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      return Response.json({
        ...buildCreativePack({
          sessionId,
          reference: referenceForPack,
          instruction,
          outputs,
          styles,
          brand,
          mode: "sample",
        }),
        notice: "Sample mode: add OPENAI_API_KEY to render the hero image. The UGC, poster, and deck direction are still ready to review.",
      });
    }

    const image = await import("node:fs/promises").then(({ readFile }) => readFile(reference.filePath));
    const form = new FormData();
    form.append("model", process.env.OPENAI_IMAGE_MODEL?.trim() || "gpt-image-2.5-sunburst");
    form.append("prompt", prompt);
    form.append("size", "1024x1024");
    form.append("quality", process.env.OPENAI_IMAGE_QUALITY?.trim() || "medium");
    form.append(
      "image[]",
      new Blob([image], { type: reference.mimeType }),
      reference.name,
    );

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal: AbortSignal.timeout(120_000),
    });
    const payload = (await response.json()) as { data?: Array<{ b64_json?: string }>; error?: { message?: string } };
    if (!response.ok || !payload.data?.[0]?.b64_json) {
      throw new Error(payload.error?.message || "OpenAI did not return a generated image.");
    }

    const generated = await saveCreativeAsset({
      sessionId,
      name: `hero-${randomUUID()}.png`,
      mimeType: "image/png",
      bytes: Buffer.from(payload.data[0].b64_json, "base64"),
      kind: "generated",
    });
    return Response.json({
      ...buildCreativePack({
        sessionId,
        reference: referenceForPack,
        instruction,
        outputs,
        styles,
        brand,
        mode: "openai",
        generatedImage: { assetId: generated.assetId, url: `/api/assets/${generated.assetId}` },
      }),
      notice: "OpenAI returned the hero render. The rest of the pack is ready as a coordinated creative direction.",
    });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Creative generation failed." },
      { status: 502 },
    );
  }
}
