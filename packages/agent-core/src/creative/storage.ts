import * as fs from 'fs';
import * as path from 'path';
import type { Artifact, ProductIdentitySpec, ThreadState } from './types';

const BASE_DATA_DIR = path.resolve('.data/runs');

export function ensureDirectory(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function getRunDirectory(runId: string): string {
  const runDir = path.join(BASE_DATA_DIR, runId);
  ensureDirectory(runDir);
  ensureDirectory(path.join(runDir, 'assets'));
  return runDir;
}

export function generateId(prefix = 'art'): string {
  const random = Math.random().toString(36).substring(2, 9);
  const timestamp = Date.now().toString(36);
  return `${prefix}-${timestamp}-${random}`;
}

export function initRun(threadId: string, customRunId?: string): { runId: string; runDir: string } {
  const cleanThread = threadId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const runId = customRunId || `run-${cleanThread}-${Date.now()}`;
  const runDir = getRunDirectory(runId);
  return { runId, runDir };
}

export async function saveProductSpec(runId: string, spec: ProductIdentitySpec): Promise<string> {
  const runDir = getRunDirectory(runId);
  const filePath = path.join(runDir, 'product-spec.json');
  fs.writeFileSync(filePath, JSON.stringify(spec, null, 2), 'utf-8');
  return filePath;
}

export async function loadProductSpec(runId: string): Promise<ProductIdentitySpec | null> {
  const filePath = path.join(getRunDirectory(runId), 'product-spec.json');
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as ProductIdentitySpec;
}

export async function saveThreadState(state: ThreadState): Promise<void> {
  const runDir = getRunDirectory(state.runId);
  const filePath = path.join(runDir, 'thread.json');
  fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf-8');

  // Also maintain thread index in root of .data/runs
  const threadIndexDir = path.join(BASE_DATA_DIR, '_threads');
  ensureDirectory(threadIndexDir);
  const safeThreadId = state.threadId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const threadPointer = path.join(threadIndexDir, `${safeThreadId}.json`);
  fs.writeFileSync(threadPointer, JSON.stringify({ runId: state.runId, updatedAt: new Date().toISOString() }, null, 2), 'utf-8');
}

export async function loadThreadState(threadId: string): Promise<ThreadState | null> {
  const safeThreadId = threadId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const threadIndexDir = path.join(BASE_DATA_DIR, '_threads');
  const threadPointer = path.join(threadIndexDir, `${safeThreadId}.json`);

  if (!fs.existsSync(threadPointer)) {
    // Search runs directory for matching threadId
    if (fs.existsSync(BASE_DATA_DIR)) {
      const dirs = fs.readdirSync(BASE_DATA_DIR);
      for (const dir of dirs) {
        if (dir.startsWith('_')) continue;
        const statePath = path.join(BASE_DATA_DIR, dir, 'thread.json');
        if (fs.existsSync(statePath)) {
          try {
            const raw = fs.readFileSync(statePath, 'utf-8');
            const parsed = JSON.parse(raw) as ThreadState;
            if (parsed.threadId === threadId) {
              return parsed;
            }
          } catch {
            // ignore parse errors on stale runs
          }
        }
      }
    }
    return null;
  }

  try {
    const { runId } = JSON.parse(fs.readFileSync(threadPointer, 'utf-8')) as { runId: string };
    const stateFile = path.join(getRunDirectory(runId), 'thread.json');
    if (fs.existsSync(stateFile)) {
      return JSON.parse(fs.readFileSync(stateFile, 'utf-8')) as ThreadState;
    }
  } catch {
    return null;
  }
  return null;
}

export async function findLatestThreadState(): Promise<ThreadState | null> {
  if (!fs.existsSync(BASE_DATA_DIR)) return null;
  const dirs = fs.readdirSync(BASE_DATA_DIR)
    .filter((d) => !d.startsWith('_'))
    .map((d) => path.join(BASE_DATA_DIR, d))
    .filter((p) => fs.statSync(p).isDirectory())
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);

  for (const dir of dirs) {
    const threadPath = path.join(dir, 'thread.json');
    if (fs.existsSync(threadPath)) {
      try {
        return JSON.parse(fs.readFileSync(threadPath, 'utf-8')) as ThreadState;
      } catch {
        // continue
      }
    }
  }
  return null;
}

export async function updateManifest(runId: string, artifacts: Artifact[]): Promise<string> {
  const runDir = getRunDirectory(runId);
  const manifestPath = path.join(runDir, 'manifest.json');
  const manifestData = {
    runId,
    updatedAt: new Date().toISOString(),
    artifactsCount: artifacts.length,
    artifacts,
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2), 'utf-8');
  return manifestPath;
}

export async function saveFileArtifact(
  runId: string,
  relativePath: string,
  buffer: Buffer | string
): Promise<string> {
  const runDir = getRunDirectory(runId);
  const fullPath = path.join(runDir, relativePath);
  ensureDirectory(path.dirname(fullPath));
  if (typeof buffer === 'string') {
    fs.writeFileSync(fullPath, buffer, 'utf-8');
  } else {
    fs.writeFileSync(fullPath, buffer);
  }
  return fullPath;
}
