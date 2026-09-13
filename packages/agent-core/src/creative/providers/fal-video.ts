import * as fs from 'fs';
import * as path from 'path';
import type { Artifact, ProductIdentitySpec, UGCSpec } from '../types';
import { generateId, saveFileArtifact } from '../storage';
import { selectVideoBlueprint, type BlueprintId } from '../video-blueprints';
import { logger } from '../../logger';

export interface GenerateVideoOptions {
  runId: string;
  threadId: string;
  sourcePosterArtifact: Artifact;
  productSpec: ProductIdentitySpec;
  durationMode?: 'five_second_single_clip' | 'ten_second_single_clip' | 'fourteen_second_multi_clip' | '10' | '5';
  blueprintId?: BlueprintId | string;
  briefText?: string;
  brandName?: string;
}

export function buildUGCSpec(
  productSpec: ProductIdentitySpec,
  blueprintId?: string,
  brandName?: string
): UGCSpec {
  const blueprint = selectVideoBlueprint(productSpec, blueprintId);
  return blueprint.buildUGCSpec(productSpec, brandName);
}

export async function generateKlingVideo(options: GenerateVideoOptions): Promise<{
  artifact: Artifact;
  ugcSpec: UGCSpec;
  blueprintTitle: string;
}> {
  const blueprint = selectVideoBlueprint(
    options.productSpec,
    options.blueprintId,
    options.briefText
  );
  const ugcSpec = blueprint.buildUGCSpec(options.productSpec, options.brandName);
  const prompt = blueprint.buildKlingPrompt(options.productSpec, options.brandName);

  const artifactId = generateId('art-video');
  const createdAt = new Date().toISOString();

  const log = logger.child(
    {
      provider: 'fal',
      runId: options.runId,
      threadId: options.threadId,
      blueprint: blueprint.id,
      blueprintTitle: blueprint.title,
    },
    'fal-video'
  );

  const startTime = Date.now();
  const falKey = process.env.FAL_KEY;
  if (!falKey) {
    log.warn('FAL_KEY is not configured in the environment; reporting provider failure cleanly');
    return {
      artifact: {
        id: artifactId,
        runId: options.runId,
        threadId: options.threadId,
        kind: 'video',
        variantId: null,
        localPath: '',
        parentArtifactId: options.sourcePosterArtifact.id,
        sourceProductArtifactId: options.sourcePosterArtifact.sourceProductArtifactId,
        productIdentityVersion: options.productSpec.productIdentityVersion,
        prompt,
        provider: 'fal',
        providerModel: 'fal-ai/kling-video/v3/turbo/standard/image-to-video',
        createdAt,
        status: 'failed',
        error: 'FAL_KEY is not configured in the environment. Set FAL_KEY to enable Kling Turbo video rendering.',
      },
      ugcSpec,
      blueprintTitle: blueprint.title,
    };
  }

  try {
    // If source poster has a local file, we can convert to base64 data URI for fal
    let imageUrl = '';
    if (options.sourcePosterArtifact.localPath && fs.existsSync(options.sourcePosterArtifact.localPath)) {
      const imgBuffer = fs.readFileSync(options.sourcePosterArtifact.localPath);
      imageUrl = `data:image/png;base64,${imgBuffer.toString('base64')}`;
    }

    const endpoint = 'https://queue.fal.run/fal-ai/kling-video/v3/turbo/standard/image-to-video';
    const videoDuration = options.durationMode === 'five_second_single_clip' || options.durationMode === '5' ? '5' : '10';
    log.info(`Submitting Kling video generation to fal (${blueprint.title})`, {
      aspectRatio: '9:16',
      duration: `${videoDuration}s`,
      hasInputImage: Boolean(imageUrl),
    });

    const queueRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${falKey}`,
      },
      body: JSON.stringify({
        prompt,
        image_url: imageUrl,
        duration: videoDuration,
        aspect_ratio: '9:16',
      }),
    });

    if (!queueRes.ok) {
      const errorText = await queueRes.text();
      log.error(`fal Kling video queue submission failed (${queueRes.status})`, new Error(errorText), {
        status: queueRes.status,
        durationMs: Date.now() - startTime,
      });
      return {
        artifact: {
          id: artifactId,
          runId: options.runId,
          threadId: options.threadId,
          kind: 'video',
          variantId: null,
          localPath: '',
          parentArtifactId: options.sourcePosterArtifact.id,
          sourceProductArtifactId: options.sourcePosterArtifact.sourceProductArtifactId,
          productIdentityVersion: options.productSpec.productIdentityVersion,
          prompt,
          provider: 'fal',
          providerModel: 'fal-ai/kling-video/v3/turbo/standard/image-to-video',
          createdAt,
          status: 'failed',
          error: `fal Kling video API error (${queueRes.status}): ${errorText}`,
        },
        ugcSpec,
        blueprintTitle: blueprint.title,
      };
    }

    const queueData = (await queueRes.json()) as any;
    const statusUrl = queueData.status_url;
    const responseUrl = queueData.response_url;

    log.info('Kling video job queued successfully, polling status...', {
      requestId: queueData.request_id,
    });

    // Poll until completed or timeout (up to 50 iterations * 3s = 150s for 10s video)
    let videoUrl = '';
    for (let i = 0; i < 50; i++) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const pollRes = await fetch(statusUrl, {
        headers: { Authorization: `Key ${falKey}` },
      });
      if (pollRes.ok) {
        const pollData = (await pollRes.json()) as any;
        log.debug('fal queue polling status', { attempt: i + 1, status: pollData.status });
        if (pollData.status === 'COMPLETED') {
          const resultRes = await fetch(responseUrl, {
            headers: { Authorization: `Key ${falKey}` },
          });
          const resultData = (await resultRes.json()) as any;
          videoUrl = resultData.video?.url || '';
          break;
        } else if (pollData.status === 'FAILED') {
          throw new Error(`fal Kling video generation failed: ${JSON.stringify(pollData)}`);
        }
      }
    }

    if (!videoUrl) {
      throw new Error('fal Kling video generation timed out or returned no video URL.');
    }

    log.info('Downloading rendered video MP4 from fal CDN...', { videoUrl });
    const vidRes = await fetch(videoUrl);
    const vidArrayBuffer = await vidRes.arrayBuffer();
    const localPath = await saveFileArtifact(options.runId, 'video.mp4', Buffer.from(vidArrayBuffer));
    const durationMs = Date.now() - startTime;

    log.info('Successfully generated and stored Kling video artifact', {
      localPath,
      durationMs,
      fileSizeKb: Math.round(vidArrayBuffer.byteLength / 1024),
    });

    return {
      artifact: {
        id: artifactId,
        runId: options.runId,
        threadId: options.threadId,
        kind: 'video',
        variantId: null,
        localPath,
        parentArtifactId: options.sourcePosterArtifact.id,
        sourceProductArtifactId: options.sourcePosterArtifact.sourceProductArtifactId,
        productIdentityVersion: options.productSpec.productIdentityVersion,
        prompt,
        provider: 'fal',
        providerModel: 'fal-ai/kling-video/v3/turbo/standard/image-to-video',
        createdAt,
        status: 'completed',
      },
      ugcSpec,
      blueprintTitle: blueprint.title,
    };
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    log.error('Exception during fal Kling video generation', error, { durationMs });
    return {
      artifact: {
        id: artifactId,
        runId: options.runId,
        threadId: options.threadId,
        kind: 'video',
        variantId: null,
        localPath: '',
        parentArtifactId: options.sourcePosterArtifact.id,
        sourceProductArtifactId: options.sourcePosterArtifact.sourceProductArtifactId,
        productIdentityVersion: options.productSpec.productIdentityVersion,
        prompt,
        provider: 'fal',
        providerModel: 'fal-ai/kling-video/v3/turbo/standard/image-to-video',
        createdAt,
        status: 'failed',
        error: error?.message || String(error),
      },
      ugcSpec,
      blueprintTitle: blueprint.title,
    };
  }
}
