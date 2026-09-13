"use client";

import { useAgentContext, useFrontendTool } from "@copilotkit/react-core/v2";
import { z } from "zod";
import {
  CREATIVE_OUTPUTS,
  normalizeCreativeOutputs,
  normalizeCreativeStyles,
  STYLE_PRESETS,
  type BrandProfile,
  type CreativeOutput,
  type CreativePack,
  type CreativeStyleId,
} from "@/lib/creative";

export type CreativeGenerationArgs = {
  instruction?: string;
  outputs?: CreativeOutput[];
  styles?: CreativeStyleId[];
};

export type CreativeGenerateResult =
  | CreativePack
  | { status: "error" | "needs_reference"; message: string };

export function CreativeControl({
  sessionId,
  reference,
  instruction,
  outputs,
  styles,
  brand,
  onGenerate,
}: {
  sessionId: string;
  reference: { assetId: string; name: string; url: string } | null;
  instruction: string;
  outputs: CreativeOutput[];
  styles: CreativeStyleId[];
  brand: BrandProfile | null;
  onGenerate: (args: CreativeGenerationArgs) => Promise<CreativeGenerateResult>;
}) {
  useAgentContext({
    description:
      "The Creative Studio is the current workspace. The agent can act autonomously on the reference image, creative brief, brand profile, and requested outputs. It can research, write creative direction, generate a hero render, create a UGC shot list, compose poster treatments, and prepare a pitch deck outline. Do not claim a file was rendered or saved unless the tool result says so.",
    value: {
      sessionId,
      reference,
      instruction,
      outputs,
      styles,
      brand,
      workflow: "reference -> direction -> hero/poster/UGC/deck -> optional workspace handoff",
    },
  });

  useFrontendTool(
    {
      name: "generate_creative_pack",
      description:
        "Use the visible reference and brief to generate a coordinated product-creative pack. Work autonomously. Choose the right style from the brief, keep the product physically believable, and report exactly which outputs were rendered versus drafted. This can create a hero image, a 10-second UGC treatment, poster directions, and a pitch deck outline.",
      parameters: z.object({
        instruction: z.string().trim().min(3).max(2000).optional(),
        outputs: z.array(z.enum(CREATIVE_OUTPUTS)).max(4).optional(),
        styles: z.array(z.enum(STYLE_PRESETS.map((preset) => preset.id) as [string, ...string[]])).max(4).optional(),
      }),
      handler: async ({ instruction: nextInstruction, outputs: nextOutputs, styles: nextStyles }) =>
        onGenerate({
          instruction: nextInstruction,
          outputs: normalizeCreativeOutputs(nextOutputs),
          styles: normalizeCreativeStyles(nextStyles),
        }),
    },
    [onGenerate],
  );

  return null;
}
