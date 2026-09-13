type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(
      response.ok
        ? "The workplace server returned an invalid response. Reload the page."
        : `Workplace request failed: HTTP ${response.status}.`,
    );
  }
}

/** All page reads and tools share one cookie handshake, including React's development effect replay. */
export function createFollowupClient(fetcher: Fetcher) {
  let session: Promise<void> | undefined;
  const initialize = () =>
    (session ??= (async () => {
      const response = await fetcher("/api/followups?session=1", {
        cache: "no-store",
      });
      if (!response.ok)
        throw new Error(
          "Unable to start the approval session. Reload the page.",
        );
      await readJson(response);
    })().catch((error) => {
      session = undefined;
      throw error;
    }));
  return async function request<T>(path: string, body?: unknown): Promise<T> {
    await initialize();
    const response = await fetcher(
      `/api/followups${path}`,
      body
        ? {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        : { cache: "no-store" },
    );
    const result = await readJson(response);
    if (!response.ok)
      throw new Error(
        typeof result === "object" && result !== null && "error" in result && typeof result.error === "string"
          ? result.error
          : `Request failed: HTTP ${response.status}`,
      );
    return result as T;
  };
}
export const requestFollowups = createFollowupClient((url, init) =>
  fetch(url, init),
);
