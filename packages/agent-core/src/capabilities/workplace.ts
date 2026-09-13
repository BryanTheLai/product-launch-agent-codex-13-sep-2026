/**
 * The workplace the agent acts in.
 *
 * Ambiguous AI is a 17-app workspace (mail, tasks, CRM, docs, calendar, …)
 * exposed as a single MCP server, which makes it the fastest way to give an
 * agent somewhere real to *do* something rather than just talk about it. For an
 * on-call agent that means filing the follow-up, mailing the summary, and
 * opening the postmortem task without a human copy-pasting.
 *
 * Provision a workspace and key in one command:
 *
 *   npx ambiguous auth signup --name "On-call agent" --human-email you@example.com
 *
 * Without AMBIGUOUS_API_KEY this contributes nothing — the agent is simply never
 * told it has a workplace, rather than being handed tools that 401.
 */
import { createMCPClient } from "@ai-sdk/mcp";
import { jsonSchema as createJsonSchema } from "ai";
import type { ToolSet } from "ai";
import type {
  MCPClientConfig,
  MCPClientProvider,
} from "@copilotkit/runtime/v2";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const AMBIGUOUS_MCP_URL = "https://app.ambiguous.ai/mcp";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasUnsupportedRegexLookaround(pattern: unknown): boolean {
  return (
    typeof pattern === "string" &&
    (pattern.includes("(?<") || pattern.includes("(?=") || pattern.includes("(?!"))
  );
}

function sanitizeSchema(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeSchema);
  if (!isRecord(value)) return value;

  const result: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    // Ambiguous's email validators use negative lookahead. The provider still
    // validates the real call; this only removes a regex feature that the
    // model-facing JSON-schema validator cannot compile.
    if (key === "pattern" && hasUnsupportedRegexLookaround(child)) continue;
    result[key] = sanitizeSchema(child);
  }
  return result;
}

/**
 * Make an MCP tool catalog consumable by the AI SDK without weakening the
 * provider-side validation. Only unsupported lookaround regex patterns are
 * removed from the model-facing schema; enums, required fields, formats, and
 * all tool executors remain intact.
 */
export function sanitizeUnsupportedMcpToolSchemas<T extends Record<string, unknown>>(
  tools: T,
): T {
  const sanitized = { ...tools } as T;
  for (const [name, tool] of Object.entries(tools)) {
    if (!tool || typeof tool !== "object" || !("inputSchema" in tool)) {
      continue;
    }
    const inputSchema = (tool as { inputSchema?: unknown }).inputSchema;
    if (isRecord(inputSchema) && "jsonSchema" in inputSchema) {
      // Rebuild the wrapper with the AI SDK helper. A spread clone loses the
      // SDK's hidden schema marker, while the wrapper's jsonSchema property is
      // getter-only.
      (sanitized as Record<string, unknown>)[name] = {
        ...tool,
        inputSchema: createJsonSchema(
          sanitizeSchema(inputSchema.jsonSchema) as Parameters<
            typeof createJsonSchema
          >[0],
        ),
      };
    }
  }
  return sanitized;
}

export function isWorkplaceConfigured(): boolean {
  return Boolean(process.env.AMBIGUOUS_API_KEY);
}

/**
 * Spreadable so an unconfigured workplace adds no entry at all.
 *
 * Note the shape: `MCPClientConfigHTTP` takes `options`
 * (StreamableHTTPClientTransportOptions), NOT a `headers` field — only the
 * `sse` variant has that. Authenticated HTTP MCP servers need a wrapped
 * `options.fetch`, which is the SDK's documented extension point.
 */
export function workplaceMcpServers(): MCPClientConfig[] {
  const apiKey = process.env.AMBIGUOUS_API_KEY;
  if (!apiKey) return [];

  return [
    {
      type: "http",
      url: AMBIGUOUS_MCP_URL,
      options: {
        fetch: (url, init) => {
          // `Headers` is an iterable object, not a plain record. Spreading it
          // drops the MCP SDK's Content-Type/Accept headers and Ambiguous
          // rejects the initialize request with HTTP 415.
          const headers = new Headers(init?.headers);
          headers.set("Authorization", `Bearer ${apiKey}`);
          return fetch(url, { ...init, headers });
        },
      },
    },
  ];
}

let cachedProvider:
  | { apiKey: string; provider: MCPClientProvider }
  | undefined;

/**
 * Return a reusable, schema-compatible Ambiguous MCP provider for BuiltInAgent.
 *
 * `mcpServers` is ideal when the server catalog is already valid. Ambiguous's
 * catalog currently contains a small number of JSON Schema regex lookarounds
 * that the AI SDK rejects before a run starts, so the channel uses the
 * user-managed provider form to normalize only those model-facing schemas.
 */
export function workplaceMcpClients(): MCPClientProvider[] {
  const apiKey = process.env.AMBIGUOUS_API_KEY;
  if (!apiKey) return [];

  if (!cachedProvider || cachedProvider.apiKey !== apiKey) {
    let clientPromise:
      | ReturnType<typeof createMCPClient>
      | undefined;
    let toolsPromise: Promise<ToolSet> | undefined;

    const provider: MCPClientProvider = {
      tools: async () => {
        if (!toolsPromise) {
          toolsPromise = (async () => {
            clientPromise ??= createMCPClient({
              transport: new StreamableHTTPClientTransport(
                new URL(AMBIGUOUS_MCP_URL),
                {
                  fetch: (url, init) => {
                    const headers = new Headers(init?.headers);
                    headers.set("Authorization", `Bearer ${apiKey}`);
                    return fetch(url, { ...init, headers });
                  },
                },
              ),
            });
            const client = await clientPromise;
            return sanitizeUnsupportedMcpToolSchemas(await client.tools());
          })().catch((error) => {
            // A transient provider/schema failure should be retryable on the
            // next agent turn, not permanently cached for the process lifetime.
            clientPromise = undefined;
            toolsPromise = undefined;
            throw error;
          });
        }
        return toolsPromise;
      },
    };

    cachedProvider = { apiKey, provider };
  }

  return [cachedProvider.provider];
}

/** Told to the agent as context, so it knows what it can reach. */
export const WORKPLACE_CONTEXT =
  "You have an Ambiguous AI workspace available over MCP: docs, sheets, slides, wiki, mail, chat, tasks, calendar, CRM, drive, forms and automations. Use it as the place where work happens: research, draft, edit, create durable artifacts, coordinate, and leave records the team can continue. Routine workplace work can continue autonomously. Use the app's explicit action checkpoint before public publishing, customer-facing sends, payments, or closing a consequential case. Never claim a record exists without a provider result and fresh readback.";
