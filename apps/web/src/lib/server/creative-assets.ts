import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ASSET_ROOT = path.join(process.cwd(), ".data", "creative-assets");
const ALLOWED_TYPES = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
]);

export const MAX_CREATIVE_ASSET_BYTES = 12 * 1024 * 1024;

export type StoredCreativeAsset = {
  assetId: string;
  sessionId: string;
  name: string;
  mimeType: string;
  size: number;
  filePath: string;
  kind: "reference" | "generated";
};

type AssetRecord = Omit<StoredCreativeAsset, "filePath"> & { fileName: string };

function safeSegment(value: string, fallback: string) {
  const normalized = value.trim().replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 80);
  return normalized || fallback;
}

function extensionFor(mimeType: string) {
  return ALLOWED_TYPES.get(mimeType) ?? "bin";
}

async function ensureRoot() {
  await mkdir(ASSET_ROOT, { recursive: true });
}

function sessionRoot(sessionId: string) {
  return path.join(ASSET_ROOT, safeSegment(sessionId, "anonymous"));
}

export function validateCreativeImage(mimeType: string, size: number) {
  if (!ALLOWED_TYPES.has(mimeType)) {
    throw new Error("Use a PNG, JPEG, or WebP reference image.");
  }
  if (!Number.isFinite(size) || size <= 0 || size > MAX_CREATIVE_ASSET_BYTES) {
    throw new Error("Reference images must be smaller than 12 MB.");
  }
}

export async function saveCreativeAsset({
  sessionId,
  name,
  mimeType,
  bytes,
  kind,
}: {
  sessionId: string;
  name: string;
  mimeType: string;
  bytes: Buffer;
  kind: StoredCreativeAsset["kind"];
}) {
  validateCreativeImage(mimeType, bytes.byteLength);
  await ensureRoot();
  const assetId = randomUUID();
  const root = sessionRoot(sessionId);
  await mkdir(root, { recursive: true });
  const fileName = `${assetId}.${extensionFor(mimeType)}`;
  const filePath = path.join(root, fileName);
  const record: AssetRecord = {
    assetId,
    sessionId: safeSegment(sessionId, "anonymous"),
    name: safeSegment(name, `creative-${assetId}.${extensionFor(mimeType)}`),
    mimeType,
    size: bytes.byteLength,
    kind,
    fileName,
  };
  await writeFile(filePath, bytes, { flag: "wx" });
  await writeFile(path.join(root, `${assetId}.json`), JSON.stringify(record), { flag: "wx" });
  return { ...record, filePath } satisfies StoredCreativeAsset;
}

export async function getCreativeAsset(assetId: string, sessionId?: string) {
  if (!/^[a-zA-Z0-9_-]+$/.test(assetId)) return null;
  await ensureRoot();
  const sessionCandidates = sessionId ? [safeSegment(sessionId, "anonymous")] : [];
  if (!sessionId) {
    // The API only exposes an asset by opaque ID. Search session folders without
    // exposing their names to the caller; asset IDs are UUIDs and collision-safe.
    const { readdir } = await import("node:fs/promises");
    for (const entry of await readdir(ASSET_ROOT, { withFileTypes: true })) {
      if (entry.isDirectory()) sessionCandidates.push(entry.name);
    }
  }
  for (const session of sessionCandidates) {
    const root = sessionRoot(session);
    try {
      const raw = await readFile(path.join(root, `${assetId}.json`), "utf8");
      const record = JSON.parse(raw) as AssetRecord;
      return { ...record, filePath: path.join(root, record.fileName) } satisfies StoredCreativeAsset;
    } catch {
      // Try the next session directory. Missing or malformed metadata is not a
      // reason to expose filesystem details through the route.
    }
  }
  return null;
}

export async function readCreativeAsset(assetId: string, sessionId?: string) {
  const asset = await getCreativeAsset(assetId, sessionId);
  if (!asset) return null;
  try {
    const bytes = await readFile(asset.filePath);
    return { ...asset, bytes };
  } catch {
    return null;
  }
}
