import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { required } from "./env.js";

function withEnvironment(
  values: Record<string, string | undefined>,
  callback: () => void,
) {
  const previous = new Map<string, string | undefined>();
  for (const [name, value] of Object.entries(values)) {
    previous.set(name, process.env[name]);
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }

  try {
    callback();
  } finally {
    for (const [name, value] of previous) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}

describe("required environment variables", () => {
  it("accepts the CopilotKit CLI key as an alias", () => {
    withEnvironment(
      {
        INTELLIGENCE_API_KEY: undefined,
        CPK_INTELLIGENCE_API_KEY: "project-key",
      },
      () => {
        assert.equal(
          required("INTELLIGENCE_API_KEY", "CPK_INTELLIGENCE_API_KEY"),
          "project-key",
        );
      },
    );
  });
});
