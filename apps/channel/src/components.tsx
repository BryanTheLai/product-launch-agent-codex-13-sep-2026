/**
 * Agent-rendered components for the on-call agent.
 *
 * `defineChannelComponent` turns a component into a tool the agent can call to
 * draw UI itself. During an incident, a native card is easier to scan than a
 * paragraph, but everyone reads a card.
 *
 * One tree renders as Slack Block Kit, Teams Adaptive Cards, and Discord
 * components. A surface that cannot render a node skips it rather than failing.
 */
import {
  defineChannelComponent,
  Message,
  Header,
  Section,
  Markdown,
  Fields,
  Field,
  Context,
  Divider,
  Actions,
  Button,
  Table,
  Row,
  Cell,
} from "@copilotkit/channels";
import { z } from "zod";

/** Severity drives the colour rail, so the channel can triage by glance. */
const SEVERITY = {
  sev1: { accent: "#C4145F", label: "SEV1 · customer-facing" },
  sev2: { accent: "#8A5C10", label: "SEV2 · degraded" },
  sev3: { accent: "#5B6478", label: "SEV3 · internal" },
  resolved: { accent: "#2E7D5B", label: "RESOLVED" },
} as const;

/**
 * The state of the incident, as one glanceable card.
 *
 * Deliberately has no "what happened" prose field. The thread is the narrative;
 * this is the summary a person joining at minute 40 needs.
 */
export const IncidentCard = defineChannelComponent({
  name: "incident_card",
  description:
    "Draw the current state of the incident as a card: severity, what is affected, what is known, and what is being tried. Call this once you have read the thread, and call it again when the picture changes. Prefer it over describing the incident in prose.",
  parameters: z.object({
    severity: z.enum(["sev1", "sev2", "sev3", "resolved"]),
    headline: z.string().describe("What is broken, in under ten words."),
    impact: z.string().describe("Who or what is affected, concretely."),
    started: z.string().describe("When it started, as stated in the thread. 'unknown' is a valid answer."),
    known: z.array(z.string()).max(4).default([]).describe("What the thread has established."),
    trying: z.array(z.string()).max(3).default([]).describe("What is currently being attempted."),
    owner: z.string().optional().describe("Who is driving, if the thread says."),
  }),
  render({ severity, headline, impact, started, known, trying, owner }) {
    const sev = SEVERITY[severity];
    return (
      <Message accent={sev.accent}>
        <Header>{headline}</Header>
        <Context>{sev.label}</Context>
        <Fields>
          <Field label="Impact">{impact}</Field>
          <Field label="Started">{started}</Field>
          {owner && <Field label="Driving">{owner}</Field>}
        </Fields>
        {known.length > 0 && (
          <Section>
            <Markdown>{`*What we know*\n${known.map((k) => `• ${k}`).join("\n")}`}</Markdown>
          </Section>
        )}
        {trying.length > 0 && (
          <Section>
            <Markdown>{`*Being tried*\n${trying.map((t) => `• ${t}`).join("\n")}`}</Markdown>
          </Section>
        )}
      </Message>
    );
  },
});

/**
 * The incident timeline. Handover and the postmortem both run on this, which is
 * why it is worth keeping in the thread rather than someone's notes app.
 */
export const Timeline = defineChannelComponent({
  name: "timeline",
  description:
    "Draw an ordered timeline of what happened when. Call this when there are three or more events worth ordering — it is what on-call handover and the postmortem are written from.",
  parameters: z.object({
    title: z.string().default("Timeline"),
    events: z
      .array(
        z.object({
          at: z.string().describe("Time as the thread states it, e.g. '02:14' or '~20m ago'."),
          what: z.string().describe("What happened, in one line."),
          who: z.string().optional(),
        }),
      )
      .min(1)
      .max(12),
  }),
  render({ title, events }) {
    return (
      <Message>
        <Header>{title}</Header>
        <Table
          columns={[{ header: "When" }, { header: "What" }, { header: "Who" }]}
        >
          {events.map((event) => (
            <Row>
              <Cell>{event.at}</Cell>
              <Cell>{event.what}</Cell>
              <Cell>{event.who ?? "—"}</Cell>
            </Row>
          ))}
        </Table>
        <Divider />
        <Context>{`${events.length} event(s) · newest last`}</Context>
      </Message>
    );
  },
});

/**
 * A small native progress update for long creative runs. The agent calls this
 * at real transitions so Slack readers can scan the work without opening the
 * browser. It is intentionally not an approval gate: routine creative work
 * keeps moving.
 */
export const CreativeProgress = defineChannelComponent({
  name: "creative_progress",
  description:
    "Post a short progress update for a creative job. Call it at real transitions such as receiving, researching, creating the hero/poster, drafting UGC, preparing slides, and completing the pack. Never claim an artifact is ready unless the tool actually returned it.",
  parameters: z.object({
    stage: z.enum(["received", "researching", "creating", "drafting", "preparing", "complete", "blocked"]),
    status: z.enum(["working", "ready", "blocked"]),
    detail: z.string().describe("What is happening or what was actually completed, in one short sentence."),
    artifactUrl: z.string().url().optional().describe("A link returned by a real tool, if one exists."),
  }),
  render({ stage, status, detail, artifactUrl }) {
    const labels = {
      received: "👀 Brief received",
      researching: "⌛ Researching references",
      creating: "🎬 Creating visual assets",
      drafting: "✍️ Drafting UGC + copy",
      preparing: "📑 Preparing slides",
      complete: "✅ Creative pack ready",
      blocked: "⚠️ Creative run paused",
    } as const;
    return (
      <Message>
        <Header>{labels[stage]}</Header>
        <Section><Markdown>{detail}</Markdown></Section>
        <Context>{status === "working" ? "The agent is continuing autonomously." : status === "ready" ? "Completed output is available." : "The agent needs a provider or a decision to continue."}</Context>
        {artifactUrl && (
          <Actions>
            <Button url={artifactUrl}>Open artifact</Button>
          </Actions>
        )}
      </Message>
    );
  },
});

/**
 * The welcome message. A bot that says nothing when invited looks broken; one
 * that says what it will do on its own gets used.
 */
export function welcomeMessage(platform: string) {
  return (
    <Message accent="#2149E6">
      <Header>Creative Studio, in the thread</Header>
      <Section>
        <Markdown>
          {"Attach a product image and @-mention me with the outcome you want. I read the existing " +
            platform +
            " thread, choose a visual route, and keep you updated while the pack takes shape."}
        </Markdown>
      </Section>
      <Fields>
        <Field label="I will">Research, direct, create, draft, coordinate</Field>
        <Field label="Updates">👀 received · 🎬 creating · ✅ ready</Field>
      </Fields>
      <Actions>
        <Button
          value="catchup"
          style="primary"
          onClick={async ({ thread }) => {
            await thread.runAgent({
              prompt:
                "Read this thread, identify the product and creative outcome, then tell me the strongest next move. Draw a creative_progress update before you begin.",
            });
          }}
        >
          Start the studio
        </Button>
      </Actions>
    </Message>
  );
}
