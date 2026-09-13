import type { WorkplaceTask } from "./followup-types";
import { findIncident } from "./incidents";

export type MissionScenario =
  | "product-launch"
  | "research-to-action"
  | "investor-readiness"
  | "campaign-launch"
  | "creative-asset-lab"
  | "customer-escalation";

export type MissionStage =
  | "understand"
  | "research"
  | "plan"
  | "execute"
  | "coordinate"
  | "verify";

export type Mission = {
  id: string;
  scenario: MissionScenario;
  label: string;
  eyebrow: string;
  title: string;
  product: string;
  status: string;
  owner: string;
  summary: string;
  audience: string;
  constraints: string[];
  goals: string[];
  currentStage: MissionStage;
  updated: string;
  timeline: Array<{ time: string; author: string; detail: string }>;
};

export const missions: Mission[] = [
  {
    id: "MISSION-KAIRO-K01",
    scenario: "product-launch",
    label: "Product launch",
    eyebrow: "Kairo · OEM consumer product",
    title: "Launch the K-01 smart hydration bottle",
    product: "Kairo K-01",
    status: "Preparing",
    owner: "Maya Chen",
    summary:
      "Turn an OEM smart hydration bottle idea into a launch-ready operating plan, investor story, and first customer experiment.",
    audience: "Urban commuters and boutique wellness retailers in Southeast Asia",
    constraints: [
      "Target retail price below RM 249",
      "First production run under 1,000 units",
      "Launch window: six weeks",
      "No unverified performance or health claims",
    ],
    goals: [
      "Find a sharp first customer and positioning",
      "Create an executable launch plan with owners",
      "Prepare a credible investor / partner story",
      "Leave a durable record the team can continue tomorrow",
    ],
    currentStage: "understand",
    updated: "09:42 SGT",
    timeline: [
      {
        time: "09:12",
        author: "Founder",
        detail: "Shared an OEM supplier brief and a rough product sketch.",
      },
      {
        time: "09:24",
        author: "Product",
        detail: "Asked whether commuters or wellness retailers should be the first wedge.",
      },
      {
        time: "09:42",
        author: "Mission Room",
        detail: "Ready to research the market and turn the idea into a launch sequence.",
      },
    ],
  },
  {
    id: "MISSION-INVESTOR-READY",
    scenario: "investor-readiness",
    label: "Investor readiness",
    eyebrow: "Seed narrative · from rough idea to proof",
    title: "Make the company investable",
    product: "Mission Room",
    status: "Needs a thesis",
    owner: "Founder",
    summary:
      "Turn scattered founder notes, early evidence, and an unclear market into a sharp investor brief and pitch outline.",
    audience: "Seed-stage investors and design partners",
    constraints: [
      "Separate facts from assumptions",
      "Do not invent traction",
      "Show the smallest credible wedge",
      "Name the next proof required",
    ],
    goals: [
      "Find the non-obvious insight",
      "Build a source-backed market map",
      "Draft the investor narrative",
      "Create the next ten proof tasks",
    ],
    currentStage: "understand",
    updated: "Yesterday",
    timeline: [
      {
        time: "15:10",
        author: "Founder",
        detail: "Collected several product ideas and customer observations.",
      },
      {
        time: "16:05",
        author: "Mission Room",
        detail: "Waiting to turn the notes into one falsifiable company thesis.",
      },
    ],
  },
  {
    id: "MISSION-RESEARCH-ACTION",
    scenario: "research-to-action",
    label: "Research to action",
    eyebrow: "Evidence room · decision support",
    title: "Find the best launch partners",
    product: "Kairo K-01",
    status: "Research queued",
    owner: "Growth",
    summary:
      "Compare potential retail, creator, and distribution partners, then turn the strongest evidence into next actions.",
    audience: "Wellness, lifestyle, and commuter-product channels",
    constraints: [
      "Use current public evidence",
      "Cite every important claim",
      "Distinguish fit from popularity",
      "Create actions, not a link dump",
    ],
    goals: [
      "Rank the best partner types",
      "Identify gaps and contradictions",
      "Draft outreach angles",
      "Create execution tasks with owners",
    ],
    currentStage: "research",
    updated: "10:03 SGT",
    timeline: [
      {
        time: "09:50",
        author: "Growth",
        detail: "Asked for a partner shortlist grounded in current evidence.",
      },
    ],
  },
  {
    id: "MISSION-CAMPAIGN-LAUNCH",
    scenario: "campaign-launch",
    label: "Campaign launch",
    eyebrow: "Creative operations · launch assets",
    title: "Prepare the first K-01 campaign",
    product: "Kairo K-01",
    status: "Briefing",
    owner: "Brand",
    summary:
      "Create a coherent launch campaign from the product brief, audience insight, and brand constraints.",
    audience: "Curious urban professionals who care about daily rituals",
    constraints: [
      "Keep claims grounded in the product brief",
      "Generate three distinct creative directions",
      "Use one clear call to action",
      "Keep a human taste gate before publishing",
    ],
    goals: [
      "Write the creative brief",
      "Generate poster and video concepts",
      "Build a content calendar",
      "Prepare feedback capture",
    ],
    currentStage: "plan",
    updated: "10:11 SGT",
    timeline: [
      {
        time: "10:00",
        author: "Brand",
        detail: "Shared the product mood and asked for a campaign system, not one ad.",
      },
    ],
  },
  {
    id: "MISSION-CUSTOMER-ESCALATION",
    scenario: "customer-escalation",
    label: "Customer escalation",
    eyebrow: "Agent Shift · successor continuation",
    title: "Continue the unresolved partner escalation",
    product: "Kairo K-01",
    status: "Handoff ready",
    owner: "Customer team",
    summary:
      "A successor agent inherits an unfinished case, checks what has gone stale, and continues without blindly inheriting the previous plan.",
    audience: "A delayed OEM partner waiting for a credible response",
    constraints: [
      "Do not promise an unverified delivery date",
      "Preserve the partner context",
      "Draft before sending externally",
      "Keep the case open until the conflict is resolved",
    ],
    goals: [
      "Reconstruct the handoff",
      "Check current evidence",
      "Draft the best next response",
      "Escalate only the stale consequential action",
    ],
    currentStage: "verify",
    updated: "08:15 SGT",
    timeline: [
      {
        time: "Yesterday",
        author: "Day Agent",
        detail: "Recommended a 20% credit and case closure after a supplier update.",
      },
      {
        time: "08:15",
        author: "Night Agent",
        detail: "Inherited the case and must verify whether the supplier update is still current.",
      },
    ],
  },
  {
    id: "MISSION-CREATIVE-ASSETS",
    scenario: "creative-asset-lab",
    label: "Product visual lab",
    eyebrow: "FPV storyworld · exploded-product reveal",
    title: "Turn the K-01 into a launch film",
    product: "Kairo K-01",
    status: "Visual brief queued",
    owner: "Creative",
    summary:
      "Turn a product brief into a mobile-first visual system: an exploded-product reveal, an FPV camera path, posters, and a feedback-ready asset package.",
    audience: "Mobile-first social audiences and design-conscious early adopters",
    constraints: [
      "Show only real or clearly labeled speculative product features",
      "Keep the exploded view legible at phone size",
      "Design one visual language across stills and motion",
      "Prepare drafts before anything is published",
    ],
    goals: [
      "Write the visual treatment and shot list",
      "Storyboard the FPV fly-through and product reveal",
      "Create poster, thumbnail, and launch-page directions",
      "Package assets and feedback tasks for the team",
    ],
    currentStage: "plan",
    updated: "10:24 SGT",
    timeline: [
      {
        time: "10:18",
        author: "Creative",
        detail: "Asked for a product reveal that feels cinematic without becoming a generic AI video.",
      },
      {
        time: "10:24",
        author: "Mission Room",
        detail: "Ready to turn the product into a shot system the team can review and iterate.",
      },
    ],
  },
];

export function findMission(id: string): Mission {
  const mission = missions.find((item) => item.id === id);
  if (mission) return mission;

  // Keep the starter's existing server tests and any old local records readable
  // while the visible product moves from incidents to missions.
  try {
    const legacy = findIncident(id);
    return {
      id: legacy.id,
      scenario: "customer-escalation",
      label: "Legacy context",
      eyebrow: "Starter compatibility",
      title: legacy.title,
      product: legacy.service,
      status: legacy.status,
      owner: legacy.owner,
      summary: legacy.summary,
      audience: legacy.channel,
      constraints: [],
      goals: [],
      currentStage: "verify",
      updated: legacy.updated,
      timeline: [...legacy.timeline],
    };
  } catch {
    throw new Error(
      `Unknown mission ${id}. Choose ${missions.map((item) => item.id).join(" or ")}.`,
    );
  }
}

export function missionContext(
  selectedId: string,
  followups: WorkplaceTask[],
  overrides: Partial<Pick<Mission, "summary" | "currentStage" | "constraints">> = {},
) {
  const mission = findMission(selectedId);
  return {
    dataSource:
      "Mission Room context plus Ambiguous records when connected. A proposal is not a saved record.",
    availableMissions: missions.map(({ id, label, title, scenario, status }) => ({
      id,
      label,
      title,
      scenario,
      status,
    })),
    selectedMission: {
      ...mission,
      ...overrides,
      timeline: [...mission.timeline],
    },
    durableWorkplaceRecords: followups,
  };
}
