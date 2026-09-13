import {
  Context,
  createChannel,
  Header,
  Markdown,
  Message,
  Section,
  type ChannelMessage,
  type StatefulThread,
} from "@copilotkit/channels";
import { isSearchConfigured, isWorkplaceConfigured, WORKPLACE_CONTEXT } from "agent-core";
import { makeChannelAgent } from "./agent";
import { required } from "./env";
import { CreativeProgress, IncidentCard, Timeline, welcomeMessage } from "./components";
import { proposeAction, readThread, searchTheWeb } from "./tools";
import { runCreativeWorkflowTool, reviseCreativeArtifactTool } from "./creative-tools";

// Tools are registered only when their credential is present, so the agent is
// never handed a tool that will fail when it calls it.
const tools = [
  runCreativeWorkflowTool,
  reviseCreativeArtifactTool,
  readThread,
  proposeAction,
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
  components: [IncidentCard, Timeline, CreativeProgress],
  showToolStatus: true,
  store: { concurrency: "serial" },

  // Injected into the agent's prompt on every run.
  context: [
    {
      description: "Launch Room Creative Agent",
      value:
        "You are the Launch Room CreativeAgent. When presented with a product launch request or ugly product photo, invoke 'run_creative_workflow' to generate the locked ProductIdentitySpec, product master, asset pack, A/B/C posters, Exa market & unit economics research, Kling video, and editable PPTX & PDF pitch deck. When presented with a revision (e.g. 'Make Poster B more retro' or supplier quote updates), invoke 'revise_creative_artifact' without restarting research.",
    },
    {
      description: "Rendering",
      value:
        "You can draw native UI by calling creative_progress for short lifecycle updates. Prefer native cards over long prose when the answer has structure.",
    },
    ...(isWorkplaceConfigured()
      ? [{ description: "Workplace", value: WORKPLACE_CONTEXT }]
      : []),
    {
      description: "Surface",
      value:
        "This is a chat thread in a channel people are actively working in. Assume others are reading and that some joined late. Attachments arrive as multimodal content parts; use them as reference input when present.",
    },
  ],
});

// A mention subscribes the conversation, so the agent then follows along instead
// of needing to be @-mentioned every single turn.
async function runCreativeTurn(thread: StatefulThread<unknown>, message: ChannelMessage) {
  const prompt = message.contentParts?.length
    ? [
        ...(message.text ? [{ type: "text" as const, text: message.text }] : []),
        ...message.contentParts,
      ]
    : message.text;

  await thread.post(
    <Message accent="#2B1B17">
      <Header>👀 Creative Studio is on it</Header>
      <Section>
        <Markdown>Reading the brief and attachments, locking product identity, and generating the complete launch pack.</Markdown>
      </Section>
      <Context>Routine creative work continues autonomously.</Context>
    </Message>,
  );

  await thread.runAgent({ prompt });
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
