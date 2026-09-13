/**
 * There is no `channel.start()`. Attaching the Channel to a CopilotRuntime and
 * creating the listener is what starts it — which is why teardown is wired
 * before the listener exists.
 */
import { createServer } from "node:http";
import { CopilotKitIntelligence, CopilotRuntime } from "@copilotkit/runtime/v2";
import { createCopilotNodeListener } from "@copilotkit/runtime/v2/node";
import { logger } from "agent-core";
import { channel } from "./channel";
import { required } from "./env";

const log = logger.child({ component: "channel-server" });

process.on("uncaughtException", (err) => {
  log.error("Fatal uncaughtException in channel server process", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  const errorObj = reason instanceof Error ? reason : new Error(String(reason));
  log.error("Unhandled promise rejection in channel server process", errorObj);
});

const intelligence = new CopilotKitIntelligence({
  apiKey: required("INTELLIGENCE_API_KEY", "CPK_INTELLIGENCE_API_KEY"),
  // Hosted Intelligence supplies both defaults. Override both together only for
  // self-hosted — they are separate hosts, so never derive one from the other.
  apiUrl: process.env.INTELLIGENCE_API_URL,
  wsUrl: process.env.INTELLIGENCE_GATEWAY_WS_URL,
});

const runtime = new CopilotRuntime({
  agents: {}, // required even though the Channel supplies the agent
  intelligence,
  channels: [channel],
});

let teardown: (() => Promise<void>) | undefined;
const shutdown = async () => {
  log.info("Shutdown signal received, tearing down channels and server...");
  await teardown?.();
  process.exit(0);
};
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

const listener = createCopilotNodeListener({ runtime, basePath: "/api/copilotkit" });
const channels = listener.channels;
const server = createServer(listener);

teardown = async () => {
  await channels.stop();
  if (server.listening) server.close();
};

log.info("Waiting for CopilotKit Channels gateway handshake...");
await channels.ready({ timeoutMs: 30_000 });

// `ready()` is NOT proof of life — it resolves on `setup_required` too, because
// a declared-but-unprovisioned Channel counts as a valid degraded state. Skip
// this check and you get a process that boots cleanly, serves 200s, and answers
// nothing.
const status = channels.status();
if (status.overall !== "online") {
  log.error(`Channel is not online: ${JSON.stringify(status)}`, new Error("ChannelOfflineError"), {
    status,
    help: "Run: npm run channel:status or review dev-docs/troubleshooting.md",
  });
  await teardown();
  process.exit(1);
}

const port = Number(process.env.PORT ?? 3000);
server.listen(port, () => {
  log.info(`Channel "${process.env.CHANNEL_CODE}" online and connected to CopilotKit gateway`, {
    port,
    channelCode: process.env.CHANNEL_CODE,
  });
  console.log(`\n  ✓ Channel "${process.env.CHANNEL_CODE}" online — listening on :${port}`);
  console.log(`    Invite the bot to a channel (/invite @yourbot), then @-mention it.\n`);
});
