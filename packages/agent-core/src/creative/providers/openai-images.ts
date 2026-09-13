import * as fs from 'fs';
import * as path from 'path';
import type { ProductIdentitySpec, Artifact } from '../types';
import { generateId, saveFileArtifact } from '../storage';

export interface GenerateImageOptions {
  runId: string;
  threadId: string;
  kind: Artifact['kind'];
  variantId?: 'A' | 'B' | 'C' | null;
  productSpec: ProductIdentitySpec;
  creativeTreatment: string;
  shotPlan: string;
  negativeConstraints?: string;
  claimsPolicy?: string;
  parentArtifactId?: string | null;
  outputFileName: string;
}

import { renderTemplate } from '../templates/engine';
import { logger } from '../../logger';

export function buildFivePartPrompt(options: {
  productSpec: ProductIdentitySpec;
  creativeTreatment: string;
  shotPlan: string;
  negativeConstraints?: string;
  claimsPolicy?: string;
}): string {
  return renderTemplate('prompts/five_part_system.jinja', options);
}

export async function generateProductImage(options: GenerateImageOptions): Promise<Artifact> {
  const log = logger.child(
    {
      provider: 'openai',
      runId: options.runId,
      threadId: options.threadId,
      kind: options.kind,
      variantId: options.variantId || null,
      outputFile: options.outputFileName,
    },
    'openai-images'
  );

  const startTime = Date.now();
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const err = new Error('OPENAI_API_KEY is not configured in the environment.');
    log.error('Cannot generate product image: missing OPENAI_API_KEY', err);
    throw err;
  }

  const model = process.env.OPENAI_IMAGE_MODEL || 'dall-e-3';
  const prompt = buildFivePartPrompt({
    productSpec: options.productSpec,
    creativeTreatment: options.creativeTreatment,
    shotPlan: options.shotPlan,
    negativeConstraints: options.negativeConstraints,
    claimsPolicy: options.claimsPolicy,
  });

  const artifactId = generateId(`art-${options.kind}`);
  const createdAt = new Date().toISOString();

  log.info(`Generating product image (${options.kind})`, {
    model,
    promptSnippet: prompt.slice(0, 120) + '...',
  });

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        prompt,
        n: 1,
        size: '1024x1024',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMsg = `OpenAI Image API error (${response.status}): ${errorText}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          errorMsg = `OpenAI Image error: ${errorJson.error.message}`;
        }
      } catch {
        // use raw text
      }
      log.error(`OpenAI Image generation failed with status ${response.status}`, new Error(errorMsg), {
        status: response.status,
        durationMs: Date.now() - startTime,
      });
      return {
        id: artifactId,
        runId: options.runId,
        threadId: options.threadId,
        kind: options.kind,
        variantId: options.variantId || null,
        localPath: '',
        parentArtifactId: options.parentArtifactId || null,
        sourceProductArtifactId: options.parentArtifactId || artifactId,
        productIdentityVersion: options.productSpec.productIdentityVersion,
        prompt,
        provider: 'openai',
        providerModel: model,
        createdAt,
        status: 'failed',
        error: errorMsg,
      };
    }

    const data = (await response.json()) as any;
    const imageData = data.data?.[0];
    if (!imageData) {
      throw new Error('OpenAI Image API returned empty data array.');
    }

    let imageBuffer: Buffer;
    if (imageData.b64_json) {
      imageBuffer = Buffer.from(imageData.b64_json, 'base64');
    } else if (imageData.url) {
      const imgRes = await fetch(imageData.url);
      const arrayBuffer = await imgRes.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    } else {
      throw new Error('OpenAI Image response contained neither b64_json nor url.');
    }

    const localPath = await saveFileArtifact(options.runId, options.outputFileName, imageBuffer);
    const durationMs = Date.now() - startTime;
    log.info(`Successfully generated and saved ${options.kind} image`, {
      localPath,
      durationMs,
      fileSizeKb: Math.round(imageBuffer.length / 1024),
    });

    return {
      id: artifactId,
      runId: options.runId,
      threadId: options.threadId,
      kind: options.kind,
      variantId: options.variantId || null,
      localPath,
      parentArtifactId: options.parentArtifactId || null,
      sourceProductArtifactId: options.parentArtifactId || artifactId,
      productIdentityVersion: options.productSpec.productIdentityVersion,
      prompt,
      provider: 'openai',
      providerModel: model,
      createdAt,
      status: 'completed',
    };
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    log.error(`Exception during ${options.kind} generation`, error, { durationMs });
    return {
      id: artifactId,
      runId: options.runId,
      threadId: options.threadId,
      kind: options.kind,
      variantId: options.variantId || null,
      localPath: '',
      parentArtifactId: options.parentArtifactId || null,
      sourceProductArtifactId: options.parentArtifactId || artifactId,
      productIdentityVersion: options.productSpec.productIdentityVersion,
      prompt,
      provider: 'openai',
      providerModel: model,
      createdAt,
      status: 'failed',
      error: error?.message || String(error),
    };
  }
}
