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
  logger,
  VIDEO_BLUEPRINTS,
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
          logger.info(`Uploaded ${f.title} to Slack thread`, { filename, sizeKb: Math.round(bytes.length / 1024) });
        }
      } catch (err) {
        logger.warn(`Could not upload ${f.title} to Slack: ${err instanceof Error ? err.message : String(err)}`, {
          title: f.title,
          filePath: f.path,
        });
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
    const threadId = (thread as any).conversationKey || (thread as any).id || 'slack-thread';
    const log = logger.child({ threadId, brandName, productType }, 'run-creative-workflow-tool');
    log.info('Received run_creative_workflow tool call', { brief });

    await thread.post(
      <Message accent="#2B1B17">
        <Header>🚀 Launch Room Pipeline Starting</Header>
        <Section>
          <Markdown>{`*Brand:* ${brandName} · *Category:* ${productType}\n*Goal:* ${brief}`}</Markdown>
        </Section>
        <Context>Locking ProductIdentitySpec and executing multi-surface asset generation...</Context>
      </Message>
    );

    const input: CreativeBriefInput = {
      threadId,
      rawText: brief,
      brandName,
      productType: productType as ProductType,
      formFactor: formFactor as FormFactor | undefined,
      referenceUrl,
    };

    try {
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

      log.info('run_creative_workflow tool handler completed successfully');
      return {
        status: 'completed',
        recommendedVariantId: threadState.recommendedVariantId,
        pptxPath,
        pdfPath,
        variantsCount: threadState.posterVariants.length,
        grossMargin: econ.grossMargin,
        breakEvenOrders: econ.breakEvenOrders,
      };
    } catch (err: any) {
      log.error('run_creative_workflow tool execution failed', err, { brandName, productType });
      try {
        await thread.post(
          <Message accent="#E53E3E">
            <Header>⚠️ Launch Room Pipeline Error</Header>
            <Section>
              <Markdown>{`**Pipeline Execution Failed:** ${err?.message || String(err)}\n\nPlease check server logs or verify provider credentials.`}</Markdown>
            </Section>
          </Message>
        );
      } catch {
        // ignore notification failure
      }
      throw err;
    }
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
    const threadId = (thread as any).conversationKey || (thread as any).id || 'slack-thread';
    const log = logger.child({ threadId, instruction }, 'revise-creative-artifact-tool');
    log.info('Received revise_creative_artifact tool call', { instruction });

    await thread.post(
      <Message>
        <Header>🔄 Applying In-Thread Revision</Header>
        <Section>
          <Markdown>{`*Instruction:* "${instruction}"\nReusing locked ProductIdentitySpec and existing research context.`}</Markdown>
        </Section>
      </Message>
    );

    try {
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

      log.info('revise_creative_artifact tool handler completed successfully');
      return {
        status: 'completed',
        updatedArtifactId: result.updatedArtifact.id,
        pptxPath: result.pptxPath,
        pdfPath: result.pdfPath,
      };
    } catch (err: any) {
      log.error('revise_creative_artifact tool execution failed', err, { instruction });
      try {
        await thread.post(
          <Message accent="#E53E3E">
            <Header>⚠️ Revision Execution Error</Header>
            <Section>
              <Markdown>{`**Revision Failed:** ${err?.message || String(err)}\n\nPlease ensure a previous creative run exists in this thread.`}</Markdown>
            </Section>
          </Message>
        );
      } catch {
        // ignore notification failure
      }
      throw err;
    }
  },
});

export const listVideoBlueprintsTool = defineChannelTool({
  name: 'list_video_blueprints',
  description:
    'List all available DTC video production blueprints, their formats, hooks, value propositions, and reference video assets.',
  parameters: z.object({}),
  async handler() {
    const list = Object.values(VIDEO_BLUEPRINTS).map((bp) => ({
      id: bp.id,
      title: bp.title,
      format: bp.format,
      referenceVideo: bp.referenceVideoFilename,
      hook: bp.hook.title,
      valueProp: bp.valueProp,
    }));
    return {
      totalBlueprints: list.length,
      blueprints: list,
    };
  },
});

