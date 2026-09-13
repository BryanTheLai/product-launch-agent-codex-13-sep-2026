"use client";

import { useAgentContext, useFrontendTool } from "@copilotkit/react-core/v2";
import { z } from "zod";
import { findMission, missionContext, type Mission, type MissionStage } from "@/lib/missions";
import type { WorkplaceControls } from "@/lib/use-workplace";

async function toolResult<T>(action: () => Promise<T>) {
  try {
    return await action();
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Mission Room operation failed. Check the page for setup details.",
    };
  }
}

export type MissionActivity = {
  kind: "research" | "mission" | "workplace" | "handoff";
  label: string;
  detail: string;
  time: string;
};

export function AppControl({
  selectedId,
  selectMission,
  mission,
  brief,
  stage,
  priority,
  setBrief,
  setStage,
  setPriority,
  workplace,
  onActivity,
}: {
  selectedId: string;
  selectMission: (id: string) => void;
  mission: Mission;
  brief: string;
  stage: MissionStage;
  priority: string;
  setBrief: (value: string) => void;
  setStage: (value: MissionStage) => void;
  setPriority: (value: string) => void;
  workplace: WorkplaceControls;
  onActivity: (activity: MissionActivity) => void;
}) {
  const { status, propose, retrieve } = workplace;

  useAgentContext({
    description:
      "The Mission Room currently visible to the user. It contains a synthetic mission brief and any Ambiguous records retrieved for that mission. The user can edit the brief, priority, and stage while the agent is working. Routine work may continue autonomously. A proposal is not a saved provider record. Never claim a document, task, message, or deck was saved without a provider result and fresh readback.",
    value: {
      ...missionContext(selectedId, status?.status === "connected" ? status.tasks : [], {
        summary: brief,
        currentStage: stage,
      }),
      userPriority: priority,
      workplace: status?.status ?? "unavailable",
      workplaceError: workplace.error,
      proposal: workplace.proposal ?? null,
      lastResult: workplace.notice,
    },
  });

  useFrontendTool(
    {
      name: "select_mission",
      description:
        "Open one of the available Mission Room scenarios. Use an ID from availableMissions.",
      parameters: z.object({ missionId: z.string() }),
      handler: async ({ missionId }) => {
        const next = findMission(missionId);
        selectMission(next.id);
        onActivity({
          kind: "mission",
          label: "Mission selected",
          detail: next.title,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
        return `Opened ${next.id}: ${next.title}. The visible mission context now shows this scenario.`;
      },
    },
    [selectMission, onActivity],
  );

  useFrontendTool(
    {
      name: "update_mission",
      description:
        "Update the visible mission state when your plan changes. This changes the Mission Room UI only; durable workplace writes still need the relevant Ambiguous tool.",
      parameters: z.object({
        stage: z.enum(["understand", "research", "plan", "execute", "coordinate", "verify"]).optional(),
        priority: z.string().trim().min(1).max(240).optional(),
        brief: z.string().trim().min(1).max(4000).optional(),
      }),
      handler: async ({ stage: nextStage, priority: nextPriority, brief: nextBrief }) => {
        if (nextStage) setStage(nextStage);
        if (nextPriority) setPriority(nextPriority);
        if (nextBrief) setBrief(nextBrief);
        onActivity({
          kind: "mission",
          label: "Mission replanned",
          detail: nextPriority || nextBrief || nextStage || "The agent updated the working state.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
        return "Updated the visible Mission Room state. Continue with the next useful action.";
      },
    },
    [setBrief, setPriority, setStage, onActivity],
  );

  useFrontendTool(
    {
      name: "research_mission",
      description:
        "Research a focused current question with Exa. Use the returned source URLs in the evidence_board and do not invent or paraphrase unsupported claims.",
      parameters: z.object({
        query: z.string().trim().min(3).max(500),
        results: z.number().int().min(1).max(8).optional(),
      }),
      handler: async ({ query, results }) =>
        toolResult(async () => {
          const response = await fetch("/api/research", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query, results: results ?? 4 }),
          });
          const body = await response.json();
          if (!response.ok) throw new Error(body.message || "Exa research is unavailable.");
          onActivity({
            kind: "research",
            label: "Exa research complete",
            detail: `${body.results?.length ?? 0} source results for “${query}”`,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          });
          return body;
        }),
    },
    [onActivity],
  );

  useFrontendTool(
    {
      name: "propose_workplace_followup",
      description:
        "Prepare a durable Ambiguous workplace action from the selected mission. Show the exact title and details for the page's approval button. This does not save anything.",
      parameters: z.object({
        missionId: z.string(),
        title: z.string().trim().min(1).max(200),
        details: z.string().trim().min(1).max(4000),
      }),
      handler: async ({ missionId, title, details }) =>
        toolResult(async () => {
          const proposal = await propose({ incidentId: missionId, title, details });
          onActivity({
            kind: "workplace",
            label: "Follow-up prepared",
            detail: "Waiting for the user to review the exact fields.",
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          });
          return { status: "pending_approval", proposal };
        }),
    },
    [propose, onActivity],
  );

  useFrontendTool(
    {
      name: "retrieve_workplace_record",
      description:
        "Retrieve an existing Ambiguous record by its actual ID. Read-only; never create a duplicate.",
      parameters: z.object({ id: z.uuid() }),
      handler: async ({ id }) => toolResult(() => retrieve(id)),
    },
    [retrieve],
  );

  useFrontendTool(
    {
      name: "refresh_workplace_records",
      description:
        "Read saved Mission Room records from Ambiguous after a write or browser refresh. Use this to verify persistence.",
      parameters: z.object({}),
      handler: async () => toolResult(() => workplace.refresh()),
    },
    [workplace.refresh],
  );

  return null;
}
