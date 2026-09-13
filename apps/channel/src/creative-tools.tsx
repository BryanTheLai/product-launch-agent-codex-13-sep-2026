import * as fs from 'fs';
import * as path from 'path';
import {
  defineChannelTool,
  Message,
  Header,
  Section,
  Markdown,
  Context,
  Divider,
} from '@copilotkit/channels';
import { z } from 'zod';
import {
  executeCreativeRun,
  executeRevision,
  loadThreadState,
  type CreativeBriefInput,
  type FormFactor,
  type ProductType,
} from 'agent-core';

export async function uploadArtifactsToSlack(thread: any, files: Array<{ path: string; title: string }>) {
  for (const f of files) {
    if (f.path && fs.existsSync(f.path)) {
      try {
        const bytes = fs.readFileSync(f.path);
        const filename = path.basename(f.path);
        if (typeof thread.postFile === 'function') {
          await thread.postFile({
            bytes,
            filename,
            title: f.title,
            altText: f.title,
          });
        }
      } catch (err) {
        console.warn(`[Slack Upload] Could not upload ${f.title}: ${err}`);
      }
    }
  }
}

export const runCreativeWorkflowTool = defineChannelTool({
  name: 'run_creative_workflow',
  description:
    'Run the complete autonomous Launch Room creative pipeline: lock product identity, generate canonical product master, derive asset pack (packshot, catalog, lifestyle, texture), generate A/B/C posters, research market signals and unit economics via Exa, generate Kling video, and compile editable PPTX and matching PDF pitch deck.',
  parameters: z.object({
    brandName: z.string().default('Stackifier').describe('The brand name.'),
    productType: z
      .enum(['lotion', 'moisturizer', 'serum', 'toner', 'sunscreen', 'cleanser', 'other'])
      .default('moisturizer')
      .describe('The physical skincare product type.'),
    formFactor: z
      .enum(['tube', 'pump_bottle', 'jar', 'dropper_bottle', 'mist_bottle', 'other'])
      .optional()
      .describe('Container packaging form factor.'),
    referenceUrl: z.string().url().optional().describe('Inspirational competitor or moodboard URL.'),
    brief: z.string().describe('The user’s creative brief or outcome instruction.'),
  }),
  async handler({ brandName, productType, formFactor, referenceUrl, brief }, { thread }) {
    await thread.post(
      <Message accent="#2B1B17">
        <Header>🚀 Launch Room Pipeline Starting</Header>
        <Section>
          <Markdown>{`*Brand:* ${brandName} · *Category:* ${productType}\n*Goal:* ${brief}`}</Markdown>
        </Section>
        <Context>Locking ProductIdentitySpec and executing multi-surface asset generation...</Context>
      </Message>
    );

    const threadId = (thread as any).conversationKey || (thread as any).id || 'slack-thread';
    const input: CreativeBriefInput = {
      threadId,
      rawText: brief,
      brandName,
      productType: productType as ProductType,
      formFactor: formFactor as FormFactor | undefined,
      referenceUrl,
    };

    const result = await executeCreativeRun(input, {
      onProgress: async (msg: string) => {
        try {
          await thread.post(
            <Message>
              <Context>{msg}</Context>
            </Message>
          );
        } catch {
          // ignore progress delivery blips
        }
      },
    });

    const { threadState, artifacts, pptxPath, pdfPath } = result;

    // Upload generated files back into Slack thread
    const uploadList = [
      { path: artifacts['poster_A']?.localPath || '', title: 'Poster A (Clinical Efficacy)' },
      { path: artifacts['poster_B']?.localPath || '', title: 'Poster B (Tactile Earth Ritual)' },
      { path: artifacts['poster_C']?.localPath || '', title: 'Poster C (Urban Defense Active)' },
      { path: artifacts['video']?.localPath || '', title: '5-Second Kling Turbo Launch Video' },
      { path: pptxPath, title: 'Editable 7-Slide Pitch Deck (PPTX)' },
      { path: pdfPath, title: 'Rendered Pitch Deck (PDF)' },
    ];

    await uploadArtifactsToSlack(thread, uploadList);

    const econ = threadState.economics;
    await thread.post(
      <Message accent="#D4A373">
        <Header>✅ Launch Pack & Executive Pitch Deck Ready</Header>
        <Section>
          <Markdown>{`**Recommended Direction: Poster ${threadState.recommendedVariantId} (Tactile Earth Ritual)**\n*• Retail Price:* $${econ.selectedPrice.toFixed(2)} | *COGS:* $${econ.selectedCogs.toFixed(2)} | *Gross Margin:* ${econ.grossMargin.toFixed(1)}%\n*• Contribution per Order:* $${econ.contributionPerOrder.toFixed(2)} | *Break-even Orders:* ${econ.breakEvenOrders}\n*• Delivered:* 3 Poster variants, 5s Video, Editable PPTX & PDF.`}</Markdown>
        </Section>
        <Divider />
        <Context>Reply in thread to revise (e.g., "Make Poster B more retro" or "Add supplier quote").</Context>
      </Message>
    );

    return {
      status: 'completed',
      recommendedVariantId: threadState.recommendedVariantId,
      pptxPath,
      pdfPath,
      variantsCount: threadState.posterVariants.length,
      grossMargin: econ.grossMargin,
      breakEvenOrders: econ.breakEvenOrders,
    };
  },
});

export const reviseCreativeArtifactTool = defineChannelTool({
  name: 'revise_creative_artifact',
  description:
    'Revise an existing thread artifact (e.g. "Make Poster B more retro", "Change background", "Update supplier quote to $8.20"). Updates only the target asset and deck without re-running unrelated research or image generation.',
  parameters: z.object({
    instruction: z.string().describe('The user’s revision instruction in natural language.'),
  }),
  async handler({ instruction }, { thread }) {
    await thread.post(
      <Message>
        <Header>🔄 Applying In-Thread Revision</Header>
        <Section>
          <Markdown>{`*Instruction:* "${instruction}"\nReusing locked ProductIdentitySpec and existing research context.`}</Markdown>
        </Section>
      </Message>
    );

    const threadId = (thread as any).conversationKey || (thread as any).id || 'slack-thread';
    const result = await executeRevision(threadId, instruction, {
      onProgress: async (msg: string) => {
        try {
          await thread.post(
            <Message>
              <Context>{msg}</Context>
            </Message>
          );
        } catch {
          // ignore
        }
      },
    });

    const uploadList = [
      { path: result.updatedArtifact.localPath, title: `Updated Artifact (${result.updatedArtifact.kind})` },
      { path: result.pptxPath, title: 'Updated Pitch Deck (PPTX)' },
      { path: result.pdfPath, title: 'Updated Pitch Deck (PDF)' },
    ];

    await uploadArtifactsToSlack(thread, uploadList);

    await thread.post(
      <Message accent="#2E7D5B">
        <Header>✓ Revision Complete</Header>
        <Section>
          <Markdown>{`Updated **${result.updatedArtifact.kind}** and re-exported PPTX + PDF without repeating the research loop.`}</Markdown>
        </Section>
      </Message>
    );

    return {
      status: 'completed',
      updatedArtifactId: result.updatedArtifact.id,
      pptxPath: result.pptxPath,
      pdfPath: result.pdfPath,
    };
  },
});
