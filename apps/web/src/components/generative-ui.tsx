"use client";

/**
 * Generative UI, controlled tier.
 *
 * `useComponent` gives the agent a catalog of *your* React components and lets
 * it choose one and fill in the props. The interface stays on-brand and
 * pixel-perfect because you wrote it — the agent only decides what to show.
 *
 * These components are the Mission Room's native output language. The agent
 * chooses what to show, while the app owns the visual contract.
 *
 * Renderers receive streamed partial arguments before schema defaults apply.
 */
import { useComponent, useHumanInTheLoop } from "@copilotkit/react-core/v2";
import { z } from "zod";

import {
  EvidenceBoard,
  HandoffDiff,
  LaunchPlan,
} from "./streamed-cards";

export function GenerativeUI() {
  useComponent({
    name: "launch_plan",
    description:
      "Render the current Mission Room plan after deciding what work should happen next. Use a small number of concrete phases and name the durable artifacts the agent will create.",
    parameters: z.object({
      mission: z.string().describe("The mission in one short sentence."),
      thesis: z.string().describe("The current strategic thesis or plan logic."),
      phases: z.array(z.object({
        name: z.string(),
        outcome: z.string(),
        actions: z.array(z.string()).max(4).default([]),
        owner: z.string().optional(),
      })).max(8),
      artifacts: z.array(z.string()).max(8).default([]),
      nextMove: z.string().optional(),
    }),
    render: LaunchPlan,
  });

  useComponent({
    name: "evidence_board",
    description:
      "Render research claims with a source URL and an explicit supported, disputed, or unverified status. Never invent URLs.",
    parameters: z.object({
      question: z.string(),
      verdict: z.string(),
      confidence: z.string().optional(),
      claims: z.array(z.object({
        claim: z.string(),
        status: z.enum(["supported", "disputed", "unverified"]),
        source: z.string().optional(),
        url: z.string().url().optional(),
      })).max(8),
      unknowns: z.array(z.string()).max(6).default([]),
    }),
    render: EvidenceBoard,
  });

  useComponent({
    name: "handoff_diff",
    description:
      "Render an Agent Shift when a successor resumes work or evidence changes. Show the inherited plan, revised continuation, autonomous work, and the one consequential checkpoint.",
    parameters: z.object({
      predecessor: z.string(),
      successor: z.string(),
      staleSignal: z.string(),
      before: z.array(z.string()).max(6),
      after: z.array(z.string()).max(6),
      autonomousWork: z.array(z.string()).max(6).default([]),
      checkpoint: z.string().optional(),
    }),
    render: HandoffDiff,
  });

  /**
   * The approval gate, web idiom.
   *
   * Same contract as `confirm_action` in the Slack surface: the agent must ask
   * before anything irreversible, and cannot proceed past a refusal.
   *
   * `respond` is a function ONLY while the tool call is executing — narrowing on
   * its presence is safer than importing the ToolCallStatus enum from
   * @copilotkit/core, which is only a transitive dependency here.
   */
  useHumanInTheLoop({
    name: "propose_action",
    description:
      "Ask for approval only before a public publish, customer-facing send, payment, or consequential case close. Routine research, drafting, document edits, tasks, and reversible coordination continue without this tool.",
    parameters: z.object({
      action: z.string().describe("What you are about to do, in one plain sentence."),
      blastRadius: z.string().describe("What this affects if it goes wrong."),
    }),
    render: ({ args, respond, result }) => {
      if (!respond) {
        return (
          <article className="ck-card ck-card--gate">
            <p className="ck-gate-done">{result ? String(result) : "Waiting…"}</p>
          </article>
        );
      }
      return (
        <article className="ck-card ck-card--gate">
          <h3>{args.action ?? "Confirm this action"}</h3>
          <p>{args.blastRadius}</p>
          <div className="ck-actions">
            <button
              type="button"
              className="ck-btn ck-btn--primary"
              onClick={() =>
                respond("Approved by the user. Proceed, then report exactly what you did.")
              }
            >
              Approve
            </button>
            <button
              type="button"
              className="ck-btn"
              onClick={() =>
                respond(
                  "The user declined. Do not take the action, do not offer a workaround, and say plainly that nothing was changed.",
                )
              }
            >
              Cancel
            </button>
          </div>
        </article>
      );
    },
  });

  // Hooks register into the chat stream, so this component renders nothing.
  return null;
}
