import { saveCreativeAsset } from "@/lib/server/creative-assets";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const sessionId = String(form.get("sessionId") || "anonymous");
    if (!file || typeof file === "string" || typeof file.arrayBuffer !== "function") {
      return Response.json({ message: "Choose an image first." }, { status: 400 });
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    const asset = await saveCreativeAsset({
      sessionId,
      name: file.name || "reference-image",
      mimeType: file.type || "application/octet-stream",
      bytes,
      kind: "reference",
    });
    return Response.json({
      assetId: asset.assetId,
      name: asset.name,
      mimeType: asset.mimeType,
      size: asset.size,
      url: `/api/assets/${asset.assetId}`,
    });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Reference upload failed." },
      { status: 400 },
    );
  }
}
