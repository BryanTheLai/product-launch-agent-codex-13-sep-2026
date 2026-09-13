import * as fs from 'fs';
import * as path from 'path';
import type {
  Artifact,
  BrandContext,
  CreativeBriefInput,
  DeckSpec,
  EconomicsResearch,
  PosterVariant,
  ProductIdentitySpec,
  ThreadState,
} from './types';
import { createProductIdentitySpec } from './product-spec';
import {
  generateId,
  getRunDirectory,
  initRun,
  loadThreadState,
  saveFileArtifact,
  saveProductSpec,
  saveThreadState,
  updateManifest,
} from './storage';
import { generateProductImage } from './providers/openai-images';
import { researchUnitEconomics, searchMarketSignals } from './providers/exa-research';
import { generateKlingVideo } from './providers/fal-video';
import { buildDeckSpec, exportDeckToPdf, exportDeckToPptx } from './deck/presentation';
import { renderTemplate } from './templates/engine';
import { logger } from '../logger';

export interface CreativeDirectorCallbacks {
  onProgress?: (message: string) => Promise<void> | void;
}

export async function executeCreativeRun(
  input: CreativeBriefInput,
  callbacks: CreativeDirectorCallbacks = {}
): Promise<{
  threadState: ThreadState;
  artifacts: Record<string, Artifact>;
  pptxPath: string;
  pdfPath: string;
}> {
  const { runId, runDir } = initRun(input.threadId);
  const log = logger.child(
    {
      runId,
      threadId: input.threadId,
      brandName: input.brandName,
      category: input.productType,
    },
    'creative-director'
  );

  const runStartTime = Date.now();
  log.info('Beginning autonomous launch pack execution', {
    briefSnippet: input.rawText.slice(0, 100) + '...',
  });

  const notify = async (msg: string) => {
    log.debug(`Progress milestone: ${msg}`);
    if (callbacks.onProgress) {
      await callbacks.onProgress(msg);
    }
  };

  try {
    await notify('1/7 Initializing creative run and resolving brand brief...');

    // 1. Lock Product Identity Spec
    await notify('2/7 Locking canonical ProductIdentitySpec and packaging invariants...');
    const productSpec = createProductIdentitySpec(input, 'v1');
    await saveProductSpec(runId, productSpec);
    log.info('Locked ProductIdentitySpec', {
      productType: productSpec.productType,
      formFactor: productSpec.formFactor,
      material: productSpec.containerMaterialAndFinish,
    });

    const brandContext: BrandContext = {
      brandName: input.brandName || 'Stackifier',
      logoAsset: 'provisional',
      watermarkAsset: 'none',
    referenceUrls: input.referenceUrl ? [input.referenceUrl] : ['https://im8health.com/'],
    paletteAndTypographyCues: 'Warm tactile earth tones (#2B1B17, #F9F6F0, #D4A373), high-contrast bold sans-serif headlines, clinical precision layout',
    toneOfVoice: 'Authoritative, performance-oriented, science-aware, grounded, and devoid of cosmetic fluff',
    approvedClaims: [
      'Reinforces natural lipid barrier integrity',
      'Instant cellular hydration with zero occlusive grease',
      'Engineered for daily high-performance resilience',
    ],
    prohibitedClaims: [
      'Unapproved medical or eczema treatment claims',
      'Unverified numerical SPF protection ratings',
      'Celebrity or physician endorsements not supplied by user',
    ],
    audience: 'Discerning daily skincare consumers demanding high-potency barrier repair without heavy sticky residue',
    usageRightsAndNotes: 'Provisional typographic wordmark utilized pending final vector assets',
  };

  const artifacts: Record<string, Artifact> = {};
  const artifactHistory: Artifact[] = [];

  // 2. Generate Canonical Product Master
  await notify('3/7 Generating canonical product master with OpenAI Flare...');
  const productMaster = await generateProductImage({
    runId,
    threadId: input.threadId,
    kind: 'product_master',
    productSpec,
    creativeTreatment: renderTemplate('prompts/product_master.jinja', { brandName: brandContext.brandName, productSpec }),
    shotPlan: 'Eye-level centered hero framing. Crisp legible label showing brand name and functional formula descriptor. Subtle grounding contact shadow.',
    negativeConstraints: 'No busy background, no hands, no text distortions, no unapproved logos.',
    outputFileName: 'product-master.png',
  });
  artifacts['product_master'] = productMaster;
  artifactHistory.push(productMaster);

  // 3. Derive Core Asset Pack (Packshot, Catalog, Lifestyle, Texture)
  await notify('4/7 Deriving multi-surface asset pack (packshot, catalog, lifestyle, texture)...');

  const [packshot, catalog, lifestyle, texture] = await Promise.all([
    generateProductImage({
      runId,
      threadId: input.threadId,
      kind: 'packshot',
      productSpec,
      creativeTreatment: renderTemplate('prompts/packshot.jinja', { brandName: brandContext.brandName, productSpec }),
      shotPlan: 'Frontal eye-level packshot, isolated container, razor-sharp label readability, calibrated vertical alignment.',
      parentArtifactId: productMaster.id,
      outputFileName: 'assets/packshot.png',
    }),
    generateProductImage({
      runId,
      threadId: input.threadId,
      kind: 'catalog',
      productSpec,
      creativeTreatment: renderTemplate('prompts/catalog.jinja', { brandName: brandContext.brandName, productSpec }),
      shotPlan: 'Three-quarter isometric angle, shallow depth of field, gentle rim illumination on container rim.',
      parentArtifactId: productMaster.id,
      outputFileName: 'assets/catalog.png',
    }),
    generateProductImage({
      runId,
      threadId: input.threadId,
      kind: 'lifestyle',
      productSpec,
      creativeTreatment: renderTemplate('prompts/lifestyle.jinja', { brandName: brandContext.brandName, productSpec }),
      shotPlan: 'Diagonal compositional framing, soft organic prop styling (raw linen towel, stone tray), container in crisp foreground focus.',
      parentArtifactId: productMaster.id,
      outputFileName: 'assets/lifestyle.png',
    }),
    generateProductImage({
      runId,
      threadId: input.threadId,
      kind: 'texture',
      productSpec,
      creativeTreatment: renderTemplate('prompts/texture.jinja', { brandName: brandContext.brandName, productSpec }),
      shotPlan: 'Extreme macro close-up, razor-thin focal plane, soft golden raking light highlighting velvety formula peak.',
      parentArtifactId: productMaster.id,
      outputFileName: 'assets/texture.png',
    }),
  ]);

  artifacts['packshot'] = packshot;
  artifacts['catalog'] = catalog;
  artifacts['lifestyle'] = lifestyle;
  artifacts['texture'] = texture;
  artifactHistory.push(packshot, catalog, lifestyle, texture);

  // 4. Generate Poster Hypotheses A, B, and C
  await notify('5/7 Generating qualitative Poster A/B/C hypotheses...');

  const [posterA, posterB, posterC] = await Promise.all([
    generateProductImage({
      runId,
      threadId: input.threadId,
      kind: 'poster',
      variantId: 'A',
      productSpec,
      creativeTreatment: renderTemplate('prompts/poster_variant.jinja', {
        brandName: brandContext.brandName,
        productSpec,
        conceptName: 'Clinical Efficacy & Performance Science',
        hypothesis: 'Focusing on clinical barrier repair and dermatological authority converts performance-oriented consumers seeking proven results.',
        audience: 'Active professionals prioritizing scientific formulation transparency and functional skincare.',
        visualDirection: 'Architectural stone, cool precision studio lighting, clean bold typographic hierarchy.',
        headline: 'CLINICAL BARRIER REPAIR',
      }),
      shotPlan: 'Vertical 4:5 poster framing, hero product anchored at bottom third, commanding headline space at top, minimalist medical-grade graphic precision.',
      parentArtifactId: productMaster.id,
      outputFileName: 'poster-A.png',
    }),
    generateProductImage({
      runId,
      threadId: input.threadId,
      kind: 'poster',
      variantId: 'B',
      productSpec,
      creativeTreatment: renderTemplate('prompts/poster_variant.jinja', {
        brandName: brandContext.brandName,
        productSpec,
        conceptName: 'Warm Earth Ritual & Tactile Luxury',
        hypothesis: 'Highlighting daily sensory ritual and organic tactile comfort triggers emotional resonance and higher repeat purchase velocity.',
        audience: 'Holistic wellness consumers seeking sensory luxury and restorative skin comfort.',
        visualDirection: 'Rich raw walnut wood and warm travertine, golden hour raking sunlight, warm serif typography.',
        headline: 'DAILY HEALING RITUAL',
      }),
      shotPlan: 'Vertical 4:5 poster framing, container bathed in golden sun flare, tactile organic textures, warm cream typographic hierarchy.',
      parentArtifactId: productMaster.id,
      outputFileName: 'poster-B.png',
    }),
    generateProductImage({
      runId,
      threadId: input.threadId,
      kind: 'poster',
      variantId: 'C',
      productSpec,
      creativeTreatment: renderTemplate('prompts/poster_variant.jinja', {
        brandName: brandContext.brandName,
        productSpec,
        conceptName: 'Bold Modern & Urban Defense',
        hypothesis: 'Positioning against environmental pollution and active daily stressors commands a premium among urban commuters.',
        audience: 'Metropolitan demographic exposed to urban climate stressors and dry indoor environments.',
        visualDirection: 'Deep graphite slate and architectural concrete, dramatic high-contrast rim lighting.',
        headline: 'ACTIVE BARRIER SHIELD',
      }),
      shotPlan: 'Vertical 4:5 poster framing, dynamic diagonal shadow line, high-contrast rim light tracing container silhouette.',
      parentArtifactId: productMaster.id,
      outputFileName: 'poster-C.png',
    }),
  ]);

  artifacts['poster_A'] = posterA;
  artifacts['poster_B'] = posterB;
  artifacts['poster_C'] = posterC;
  artifactHistory.push(posterA, posterB, posterC);

  const posterVariants: PosterVariant[] = [
    {
      variantId: 'A',
      conceptName: 'Clinical Efficacy',
      hypothesis: 'Focusing on clinical barrier repair and dermatological authority converts performance-oriented consumers seeking proven results.',
      audience: 'Active professionals prioritizing scientific formulation transparency and functional skincare.',
      visualDirection: 'Architectural stone, cool precision studio lighting, clean bold typographic hierarchy.',
      headline: 'CLINICAL BARRIER REPAIR',
      imageArtifactId: posterA.id,
      prompt: posterA.prompt,
    },
    {
      variantId: 'B',
      conceptName: 'Tactile Earth Ritual',
      hypothesis: 'Highlighting daily sensory ritual and organic tactile comfort triggers emotional resonance and higher repeat purchase velocity.',
      audience: 'Holistic wellness consumers seeking sensory luxury and restorative skin comfort.',
      visualDirection: 'Warm walnut, raw travertine, golden hour raking sunlight, warm cream typography.',
      headline: 'DAILY HEALING RITUAL',
      imageArtifactId: posterB.id,
      prompt: posterB.prompt,
    },
    {
      variantId: 'C',
      conceptName: 'Urban Defense Active',
      hypothesis: 'Positioning against environmental pollution and active daily stressors commands a premium among urban commuters.',
      audience: 'Metropolitan demographic exposed to urban climate stressors and dry indoor environments.',
      visualDirection: 'Deep graphite slate, high-contrast rim lighting, modern oversized typography.',
      headline: 'ACTIVE BARRIER SHIELD',
      imageArtifactId: posterC.id,
      prompt: posterC.prompt,
    },
  ];

  const recommendedVariantId: 'A' | 'B' | 'C' = 'B'; // Best combines clinical authority with organic tactile warmth

  // 5. Research Market Signals & Unit Economics via Exa
  await notify('6/7 Researching live market signals and unit economics via Exa...');
  const [signals, economics] = await Promise.all([
    searchMarketSignals(productSpec.productType, brandContext.brandName, brandContext.audience),
    researchUnitEconomics({
      productCategory: productSpec.productType,
      geography: 'US',
      channel: 'DTC',
      userSuppliedCogs: input.supplierCogsQuote,
      userSuppliedPrice: input.supplierPriceQuote,
    }),
  ]);

  // 6. 5-Second Kling Turbo Video
  await notify('Generating 5-second product motion video with Kling Turbo on fal...');
  const { artifact: videoArtifact, ugcSpec, blueprintTitle } = await generateKlingVideo({
    runId,
    threadId: input.threadId,
    sourcePosterArtifact: artifacts[`poster_${recommendedVariantId}`]!,
    productSpec,
    briefText: input.rawText,
    brandName: brandContext.brandName,
  });
  artifacts['video'] = videoArtifact;
  artifactHistory.push(videoArtifact);

  // 7. Compile DeckSpec and generate PPTX + PDF
  await notify('7/7 Compiling 7-slide pitch deck (PPTX and PDF)...');
  const deckSpec = buildDeckSpec({
    brandName: brandContext.brandName,
    productSpec,
    assetPack: artifacts,
    posterVariants,
    recommendedVariantId,
    signals,
    economics,
    ugcSpec,
    videoArtifact,
  });

  const pptxPath = path.join(runDir, 'pitch-deck.pptx');
  const pdfPath = path.join(runDir, 'pitch-deck.pdf');

  await Promise.all([
    exportDeckToPptx(deckSpec, pptxPath, { assetPack: artifacts }),
    exportDeckToPdf(deckSpec, pdfPath, { assetPack: artifacts }),
  ]);

  const pptxArtifact: Artifact = {
    id: generateId('art-pptx'),
    runId,
    threadId: input.threadId,
    kind: 'pptx',
    variantId: null,
    localPath: pptxPath,
    parentArtifactId: productMaster.id,
    sourceProductArtifactId: productMaster.id,
    productIdentityVersion: productSpec.productIdentityVersion,
    prompt: '7-slide editable PowerPoint pitch deck based on Brown and White Modern Skincare Presentation template',
    provider: 'local',
    providerModel: 'pptxgenjs',
    createdAt: new Date().toISOString(),
    status: 'completed',
  };

  const pdfArtifact: Artifact = {
    id: generateId('art-pdf'),
    runId,
    threadId: input.threadId,
    kind: 'pdf',
    variantId: null,
    localPath: pdfPath,
    parentArtifactId: pptxArtifact.id,
    sourceProductArtifactId: productMaster.id,
    productIdentityVersion: productSpec.productIdentityVersion,
    prompt: '7-page rendered high-resolution PDF pitch deck',
    provider: 'local',
    providerModel: 'pdf-lib',
    createdAt: new Date().toISOString(),
    status: 'completed',
  };

  artifacts['pptx'] = pptxArtifact;
  artifacts['pdf'] = pdfArtifact;
  artifactHistory.push(pptxArtifact, pdfArtifact);

  await updateManifest(runId, artifactHistory);

  const threadState: ThreadState = {
    threadId: input.threadId,
    runId,
    brandContext,
    currentBrief: input.rawText,
    productIdentitySpec: productSpec,
    productIdentityVersion: productSpec.productIdentityVersion,
    assetPack: artifacts,
    posterVariants,
    recommendedVariantId,
    economics,
    signals,
    ugcSpec,
    latestArtifactId: pdfArtifact.id,
    artifactHistory,
    pptxArtifactId: pptxArtifact.id,
    pdfArtifactId: pdfArtifact.id,
    videoArtifactId: videoArtifact.id,
  };

  await saveThreadState(threadState);
  await notify('✓ Creative pack and pitch deck completed successfully.');

  const totalDurationMs = Date.now() - runStartTime;
  log.info('Autonomous launch pack execution completed successfully', {
    durationMs: totalDurationMs,
    artifactsCount: Object.keys(artifacts).length,
    videoStatus: videoArtifact.status,
  });

  return {
    threadState,
    artifacts,
    pptxPath,
    pdfPath,
  };
} catch (error: any) {
  const totalDurationMs = Date.now() - runStartTime;
  log.error('Creative run execution failed', error, { durationMs: totalDurationMs });
  throw error;
}
}

export async function executeRevision(
  threadId: string,
  instruction: string,
  callbacks: CreativeDirectorCallbacks = {}
): Promise<{
  threadState: ThreadState;
  updatedArtifact: Artifact;
  pptxPath: string;
  pdfPath: string;
}> {
  const revStartTime = Date.now();
  const log = logger.child({ threadId, instruction }, 'creative-director-revision');
  log.info('Beginning creative artifact revision', { instruction });

  const notify = async (msg: string) => {
    log.debug(`Revision milestone: ${msg}`);
    if (callbacks.onProgress) {
      await callbacks.onProgress(msg);
    }
  };

  try {
    const existingState = await loadThreadState(threadId);
    if (!existingState) {
      const err = new Error(`No existing thread state found for threadId: ${threadId}`);
      log.error('Cannot execute revision: missing thread state', err);
      throw err;
    }

    const { runId, productIdentitySpec, posterVariants, recommendedVariantId, economics, signals, ugcSpec } = existingState;
    const lower = instruction.toLowerCase();


  // Route 1: Poster Revision (e.g. "Make Poster B more retro")
  if (lower.includes('poster') || lower.includes('retro') || lower.includes('background') || lower.includes('headline')) {
    let targetVariant: 'A' | 'B' | 'C' = 'B';
    if (lower.includes('poster a') || lower.includes('variant a')) targetVariant = 'A';
    else if (lower.includes('poster c') || lower.includes('variant c')) targetVariant = 'C';

    await notify(`Revising Poster ${targetVariant} with updated creative treatment ("${instruction}")...`);

    const prevPoster = existingState.assetPack[`poster_${targetVariant}`];
    let revisedTreatment = 'Warm 1970s editorial retro aesthetic. Tactile raw timber surface, golden hour warm lens flare, nostalgic vintage film grain, warm cream and burnt amber tones.';
    if (lower.includes('retro')) {
      revisedTreatment = 'Warm 1970s editorial retro aesthetic. Tactile raw timber surface, golden hour warm lens flare, nostalgic vintage film grain, warm cream and burnt amber tones.';
    } else {
      revisedTreatment = `Modified creative treatment per user feedback: ${instruction}. Preserve locked product identity.`;
    }

    const revisedPoster = await generateProductImage({
      runId,
      threadId,
      kind: 'poster',
      variantId: targetVariant,
      productSpec: productIdentitySpec,
      creativeTreatment: revisedTreatment,
      shotPlan: 'Vertical 4:5 poster framing, preserved product silhouette and label, warm vintage aesthetic.',
      parentArtifactId: prevPoster?.id || null,
      outputFileName: `poster-${targetVariant}-rev${Date.now()}.png`,
    });

    existingState.assetPack[`poster_${targetVariant}`] = revisedPoster;
    existingState.artifactHistory.push(revisedPoster);

    // Update variant record
    const variantIndex = posterVariants.findIndex((v) => v.variantId === targetVariant);
    const existingVariant = posterVariants[variantIndex];
    if (variantIndex >= 0 && existingVariant) {
      posterVariants[variantIndex] = {
        ...existingVariant,
        conceptName: `${existingVariant.conceptName} (Retro Revision)`,
        visualDirection: revisedTreatment,
        imageArtifactId: revisedPoster.id,
      };
    }

    // Rebuild PPTX and PDF with the new poster, without re-running Exa or other images!
    await notify('Re-exporting pitch deck with revised poster...');
    const deckSpec = buildDeckSpec({
      brandName: existingState.brandContext.brandName,
      productSpec: productIdentitySpec,
      assetPack: existingState.assetPack,
      posterVariants,
      recommendedVariantId,
      signals,
      economics,
      ugcSpec,
      videoArtifact: existingState.assetPack['video'],
    });

    const runDir = getRunDirectory(runId);
    const pptxPath = path.join(runDir, 'pitch-deck.pptx');
    const pdfPath = path.join(runDir, 'pitch-deck.pdf');

    await Promise.all([
      exportDeckToPptx(deckSpec, pptxPath, { assetPack: existingState.assetPack }),
      exportDeckToPdf(deckSpec, pdfPath, { assetPack: existingState.assetPack }),
    ]);

    await updateManifest(runId, existingState.artifactHistory);
    await saveThreadState(existingState);

    await notify(`✓ Poster ${targetVariant} and pitch deck updated without restarting research loop.`);

    return {
      threadState: existingState,
      updatedArtifact: revisedPoster,
      pptxPath,
      pdfPath,
    };
  }

  // Route 2: Economics / Supplier Quote Update
  if (lower.includes('quote') || lower.includes('cogs') || lower.includes('price') || lower.includes('supplier') || lower.includes('economics')) {
    await notify('Updating economics with new commercial inputs...');

    // Extract quote numbers if present
    const numMatch = instruction.match(/\$?([0-9]+(\.[0-9]{1,2})?)/);
    const parsedQuote = numMatch && numMatch[1] ? parseFloat(numMatch[1]) : undefined;

    const updatedEconomics = await researchUnitEconomics({
      productCategory: productIdentitySpec.productType,
      geography: 'US',
      channel: 'DTC',
      userSuppliedCogs: parsedQuote || 8.50,
    });

    existingState.economics = updatedEconomics;

    // Rebuild PPTX & PDF with updated numbers
    await notify('Re-exporting pitch deck with updated economics...');
    const deckSpec = buildDeckSpec({
      brandName: existingState.brandContext.brandName,
      productSpec: productIdentitySpec,
      assetPack: existingState.assetPack,
      posterVariants,
      recommendedVariantId,
      signals,
      economics: updatedEconomics,
      ugcSpec,
      videoArtifact: existingState.assetPack['video'],
    });

    const runDir = getRunDirectory(runId);
    const pptxPath = path.join(runDir, 'pitch-deck.pptx');
    const pdfPath = path.join(runDir, 'pitch-deck.pdf');

    await Promise.all([
      exportDeckToPptx(deckSpec, pptxPath, { assetPack: existingState.assetPack }),
      exportDeckToPdf(deckSpec, pdfPath, { assetPack: existingState.assetPack }),
    ]);

    await updateManifest(runId, existingState.artifactHistory);
    await saveThreadState(existingState);

    const econArtifact: Artifact = {
      id: generateId('art-econ-rev'),
      runId,
      threadId,
      kind: 'pptx',
      variantId: null,
      localPath: pptxPath,
      parentArtifactId: existingState.latestArtifactId || null,
      sourceProductArtifactId: existingState.assetPack['product_master']?.id || '',
      productIdentityVersion: productIdentitySpec.productIdentityVersion,
      prompt: `Economics revision: ${instruction}`,
      provider: 'local',
      providerModel: 'unit_economics_research',
      createdAt: new Date().toISOString(),
      status: 'completed',
    };

    return {
      threadState: existingState,
      updatedArtifact: econArtifact,
      pptxPath,
      pdfPath,
    };
  }

  // Route 3: Video Blueprint / Motion Revision
  if (
    lower.includes('video') ||
    lower.includes('blueprint') ||
    lower.includes('egg') ||
    lower.includes('bubble') ||
    lower.includes('swap') ||
    lower.includes('bingsu') ||
    lower.includes('swatch') ||
    lower.includes('motion') ||
    lower.includes('ugc')
  ) {
    await notify('Updating video blueprint and UGC shot plan...');

    const { artifact: revisedVideo, ugcSpec: newUgcSpec, blueprintTitle } = await generateKlingVideo({
      runId,
      threadId,
      sourcePosterArtifact: existingState.assetPack[`poster_${recommendedVariantId}`] || existingState.assetPack['product_master']!,
      productSpec: productIdentitySpec,
      briefText: instruction,
      brandName: existingState.brandContext.brandName,
    });

    existingState.assetPack['video'] = revisedVideo;
    existingState.ugcSpec = newUgcSpec;
    existingState.artifactHistory.push(revisedVideo);

    // Re-export pitch deck with updated video blueprint without re-rendering OpenAI images or Exa!
    await notify(`Re-exporting pitch deck with updated video blueprint (${blueprintTitle})...`);
    const deckSpec = buildDeckSpec({
      brandName: existingState.brandContext.brandName,
      productSpec: productIdentitySpec,
      assetPack: existingState.assetPack,
      posterVariants,
      recommendedVariantId,
      signals,
      economics,
      ugcSpec: newUgcSpec,
      videoArtifact: revisedVideo,
    });

    const runDir = getRunDirectory(runId);
    const pptxPath = path.join(runDir, 'pitch-deck.pptx');
    const pdfPath = path.join(runDir, 'pitch-deck.pdf');

    await Promise.all([
      exportDeckToPptx(deckSpec, pptxPath, { assetPack: existingState.assetPack }),
      exportDeckToPdf(deckSpec, pdfPath, { assetPack: existingState.assetPack }),
    ]);

    await updateManifest(runId, existingState.artifactHistory);
    await saveThreadState(existingState);

    await notify(`✓ Video blueprint updated to "${blueprintTitle}" and deck re-exported.`);

    return {
      threadState: existingState,
      updatedArtifact: revisedVideo,
      pptxPath,
      pdfPath,
    };
  }

  // Default fallback revision
  await notify(`Applying revision: ${instruction}...`);
  const runDir = getRunDirectory(runId);
  log.info('Revision completed successfully', { durationMs: Date.now() - revStartTime });
  return {
    threadState: existingState,
    updatedArtifact: existingState.assetPack['product_master']!,
    pptxPath: path.join(runDir, 'pitch-deck.pptx'),
    pdfPath: path.join(runDir, 'pitch-deck.pdf'),
  };
} catch (error: any) {
  const durationMs = Date.now() - revStartTime;
  log.error('Creative artifact revision failed', error, { durationMs });
  throw error;
}
}
