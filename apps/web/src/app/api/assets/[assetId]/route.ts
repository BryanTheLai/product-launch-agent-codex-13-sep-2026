import { readCreativeAsset } from "@/lib/server/creative-assets";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ assetId: string }> },
) {
  const { assetId } = await params;
  const asset = await readCreativeAsset(assetId);
  if (!asset) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(asset.bytes), {
    headers: {
      "Content-Type": asset.mimeType,
      "Cache-Control": "private, max-age=3600",
      "Content-Length": String(asset.bytes.byteLength),
    },
  });
}
