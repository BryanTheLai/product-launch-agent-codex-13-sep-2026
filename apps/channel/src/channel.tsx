import {
  createChannel,
  type ChannelMessage,
  type StatefulThread,
  Message,
  Header,
  Section,
  Markdown,
} from "@copilotkit/channels";
import { isSearchConfigured } from "agent-core";
import { makeChannelAgent } from "./agent";
import { required } from "./env";
import { CreativeProgress, welcomeMessage } from "./components";
import { searchTheWeb } from "./tools";
import {
  runCreativeWorkflowTool,
  reviseCreativeArtifactTool,
  listVideoBlueprintsTool,
} from "./creative-tools";

// Tools are registered only when their credential is present, so the agent is
// never handed a tool that will fail when it calls it.
const tools = [
  runCreativeWorkflowTool,
  reviseCreativeArtifactTool,
  listVideoBlueprintsTool,
  ...(isSearchConfigured() ? [searchTheWeb] : []),
];

export const channel = createChannel({
  // Must equal the Channel Code in Intelligence, character for character. A
  // mismatch leaves the Channel at "Waiting for runtime" and is validated at
  // startup, not here.
  name: required("CHANNEL_CODE"),

  // Required. "platform" derives the canonical user from provider + workspace +
  // platform user id. Do NOT move this onto CopilotRuntime — that one is for
  // web requests and must be absent on a Channels-only runtime.
  identifyUser: "platform",

  agent: makeChannelAgent,
  tools,
  components: [CreativeProgress],
  showToolStatus: true,
  store: { concurrency: "serial" },

  // Injected into the agent's prompt on every run.
  context: [
    {
      description: "Launch Room Creative Agent",
      value:
        "You are the Launch Room CreativeAgent operator. When presented with a product launch request or ugly product photo, invoke 'run_creative_workflow'. When presented with an in-thread revision, invoke 'revise_creative_artifact'. When asked about blueprints, reference assets, templates, or capabilities, answer directly and concisely. You can also call 'list_video_blueprints'. Once complete and files are uploaded, remain idle until the user speaks again.",
    },
    {
      description: "Available DTC Video Production Blueprints",
      value:
        "The catalog includes 7 blueprints: 1) egg-coverage-test (Coverage Test: Eggshell Side-by-Side Comparison), 2) underwater-bubble-hydration (Underwater Bubble Hydration Explosion), 3) seasonal-tap-swap (Seasonal Rhythmic Tap-and-Swap Transition), 4) sun-stick-dual-finish (Dual-Finish Split Face & Arm Swatch), 5) asmr-beauty-recipe (ASMR Korean Bingsu Dessert Beauty Recipe), 6) problem-solution-invisible-swatch (Problem-Solution Invisible Finish Swatch), 7) skin-1004-soothing-dispense (Centella Soothing Ampoule Macro Dropper Dispense). Reference video files live in reference-artifacts/.",
    },
    {
      description: "Rendering",
      value:
        "You can draw native UI by calling creative_progress for short lifecycle updates. Prefer native cards over long prose when the answer has structure.",
    },
    {
      description: "Surface",
      value:
        "This is a chat thread in a channel people are actively working in. Assume others are reading and that some joined late. Attachments arrive as multimodal content parts; use them as reference input when present.",
    },
  ],
});

// Active thread set to prevent concurrent or re-entrant execution loops
const activeThreads = new Set<string>();

/**
 * Filter out non-human events, bot file shares, deleted/updated events,
 * and empty payloads that cause Slack bot echo loops.
 */
function isActionableUserMessage(message: ChannelMessage): boolean {
  // 1. Never respond to bots, apps, system events, or self
  const actor = message.actor as any;
  if (actor?.kind && actor.kind !== "human") {
    console.log(`[channel] Skipping message from non-human actor kind='${actor.kind}' id='${actor.id || "unknown"}'`);
    return false;
  }
  if ((message as any).user?.isBot || (message as any).bot_id) {
    console.log(`[channel] Skipping bot message`);
    return false;
  }

  // 2. Only respond to newly created messages (ignore message_changed, unfurls, deletes)
  if (message.operation && message.operation.kind !== "created") {
    console.log(`[channel] Skipping non-created operation: ${message.operation.kind}`);
    return false;
  }

  // 3. Must have meaningful text or attached media parts
  const hasText = Boolean(message.text?.trim());
  const hasParts = Boolean(message.contentParts && message.contentParts.length > 0);
  if (!hasText && !hasParts) {
    console.log(`[channel] Skipping empty message without text or media parts`);
    return false;
  }

  return true;
}

// A mention subscribes the conversation, so the agent then follows along instead
// of needing to be @-mentioned every single turn.
async function runCreativeTurn(thread: StatefulThread<unknown>, message: ChannelMessage) {
  if (!isActionableUserMessage(message)) {
    return;
  }

  const threadKey = (thread as any).conversationKey || (thread as any).id || "default-thread";
  if (activeThreads.has(threadKey)) {
    console.warn(`[channel] Thread ${threadKey} is already executing a creative run. Ignoring re-entrant event.`);
    return;
  }

  activeThreads.add(threadKey);

  const prompt = message.contentParts?.length
    ? [
        ...(message.text ? [{ type: "text" as const, text: message.text }] : []),
        ...message.contentParts,
      ]
    : message.text;

  try {
    await thread.runAgent({ prompt });
  } catch (err) {
    console.error("Error running creative turn in channel:", err);
    try {
      await thread.post(
        <Message accent="#E53E3E">
          <Header>⚠️ Request Notice</Header>
          <Section>
            <Markdown>{`Sorry, I encountered an issue processing your request: ${err instanceof Error ? err.message : String(err)}`}</Markdown>
          </Section>
        </Message>
      );
    } catch {
      // ignore notification failure
    }
  } finally {
    activeThreads.delete(threadKey);
  }
}

channel.onMention(async ({ thread, message }) => {
  await thread.subscribe();
  await runCreativeTurn(thread, message);
});

// Non-mentioned turns only ever reach onMessage — gate them on the flag or the
// agent will answer every message in every channel it has been invited to.
channel.onMessage(async ({ thread, message }) => {
  if (await thread.isSubscribed()) {
    await runCreativeTurn(thread, message);
  }
});

channel.onWelcome(async ({ thread, platform }) => {
  await thread.post(welcomeMessage(platform));
});

