import assert from "node:assert/strict";
import test from "node:test";
import {
  sanitizeUnsupportedMcpToolSchemas,
  workplaceMcpServers,
} from "./workplace";

test("MCP schema sanitizer removes unsupported lookaround patterns only", () => {
  const tools = {
    email_tool: {
      inputSchema: {
        jsonSchema: {
          properties: {
            email: { type: "string", pattern: "^(?!\\.)email$" },
            id: { type: "string", pattern: "^[a-z]+$" },
          },
        },
      },
    },
  };

  const sanitized = sanitizeUnsupportedMcpToolSchemas(tools);
  const properties = sanitized.email_tool.inputSchema.jsonSchema.properties;
  assert.equal("pattern" in properties.email, false);
  assert.equal(properties.id.pattern, "^[a-z]+$");
});

test("authenticated Ambiguous MCP fetch preserves SDK headers", async () => {
  const previousKey = process.env.AMBIGUOUS_API_KEY;
  const previousFetch = globalThis.fetch;
  let sentHeaders: Headers | undefined;

  process.env.AMBIGUOUS_API_KEY = "test-key";
  globalThis.fetch = async (_input, init) => {
    sentHeaders = new Headers(init?.headers);
    return new Response("{}", {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  try {
    const [server] = workplaceMcpServers();
    assert.equal(server?.type, "http");
    assert.ok(server?.options?.fetch);

    await server.options.fetch("https://example.test/mcp", {
      method: "POST",
      headers: new Headers({
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
      }),
      body: "{}",
    });

    assert.equal(sentHeaders?.get("content-type"), "application/json");
    assert.equal(
      sentHeaders?.get("accept"),
      "application/json, text/event-stream",
    );
    assert.equal(sentHeaders?.get("authorization"), "Bearer test-key");
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.AMBIGUOUS_API_KEY;
    else process.env.AMBIGUOUS_API_KEY = previousKey;
  }
});
