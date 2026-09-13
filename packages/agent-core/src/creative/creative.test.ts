import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { test } from "node:test";
import {
  createProductIdentitySpec,
  classifyIntakeMode,
  inferProductType,
  inferFormFactor,
} from "./product-spec";
import {
  initRun,
  getRunDirectory,
  saveProductSpec,
  loadProductSpec,
  saveThreadState,
  loadThreadState,
  findLatestThreadState,
  updateManifest,
  saveFileArtifact,
  generateId,
} from "./storage";
import { buildFivePartPrompt } from "./providers/openai-images";
import {
  researchUnitEconomics,
  searchMarketSignals,
} from "./providers/exa-research";
import {
  buildDeckSpec,
  exportDeckToPptx,
  exportDeckToPdf,
} from "./deck/presentation";
import { buildUGCSpec, generateKlingVideo } from "./providers/fal-video";
import { VIDEO_BLUEPRINTS, selectVideoBlueprint, type BlueprintId } from "./video-blueprints";
import { renderString, renderTemplate } from "./templates/engine";
import type {
  ProductType,
  FormFactor,
  ProductIdentitySpec,
  CommercialSignal,
  EconomicsResearch,
  PosterVariant,
  Artifact,
  UGCSpec,
  ThreadState,
  BrandContext,
} from "./types";

const ALLOWED_PRODUCT_TYPES: ProductType[] = [
  "lotion",
  "moisturizer",
  "serum",
  "toner",
  "sunscreen",
  "cleanser",
];

test("ProductIdentitySpec validates all 6 required form factors", () => {
  for (const pType of ALLOWED_PRODUCT_TYPES) {
    const spec = createProductIdentitySpec({
      threadId: "th-test-types",
      brandName: "Aura Botanica",
      productType: pType,
      rawText: `Launch brief for ${pType}`,
    });

    assert.equal(spec.productType, pType);
    assert.ok(spec.formFactor.length > 0);
    assert.ok(spec.silhouetteAndProportions.length > 0);
    assert.ok(spec.dimensionsAndNetVolume.length > 0);
    assert.ok(spec.capClosureOrDispenser.length > 0);
    assert.ok(spec.containerMaterialAndFinish.length > 0);
    assert.ok(spec.bodyColorAndFormulaColor.length > 0);
    assert.ok(spec.labelLayoutAndApprovedCopy.includes("Aura Botanica"));
    assert.ok(spec.textureAndViscosity.length > 0);
    assert.ok(spec.allowedCreativeChanges.length >= 3);
    assert.ok(spec.forbiddenProductChanges.length >= 4);
    assert.ok(spec.confidence > 0.8);
  }
});

test("Intake mode classification handles ugly image intake vs reference URL", () => {
  const adaptMode = classifyIntakeMode({
    threadId: "th-test-intake-1",
    brandName: "TestBrand",
    rawText: "Here is an ugly product photo of our bottle",
    attachedImageLocalPath: "C:/tmp/ugly.png",
  });
  assert.equal(adaptMode, "adapt_existing_product");

  const designMode = classifyIntakeMode({
    threadId: "th-test-intake-2",
    brandName: "NewBrand",
    rawText: "Design a new competitor to https://im8health.com/",
    referenceUrl: "https://im8health.com/",
  });
  assert.equal(designMode, "design_new_product_from_reference");
});

test("5-block prompt structure enforces negative prompt and all required blocks", () => {
  const spec = createProductIdentitySpec({
    threadId: "th-test-prompt",
    brandName: "Lumina Labs",
    productType: "serum",
    rawText: "Lumina Labs Serum launch",
  });

  const prompt = buildFivePartPrompt({
    productSpec: spec,
    creativeTreatment: "Editorial Luxury Hero on wet travertine pedestal",
    shotPlan: "Close-up macro bottle with dramatic split lighting and liquid refraction",
    negativeConstraints: "- DO NOT alter bottle shape or cap color.",
    claimsPolicy: "FDA compliant cosmetic claims only.",
  });

  assert.ok(prompt.includes("PRODUCT SPECIFICATION (IMMUTABLE PHYSICAL IDENTITY):"));
  assert.ok(prompt.includes("CREATIVE TREATMENT:"));
  assert.ok(prompt.includes("SHOT PLAN & COMPOSITION:"));
  assert.ok(prompt.includes("NEGATIVE CONSTRAINTS (STRICTLY FORBIDDEN):"));
  assert.ok(prompt.includes("CLAIMS POLICY:"));
  assert.ok(prompt.includes("Lumina Labs"));
  assert.ok(prompt.includes("DO NOT alter container silhouette"));
  assert.ok(prompt.includes("DO NOT alter bottle shape or cap color."));
});

test("Storage layer persists and reloads run state, specs, and updates manifests", async () => {
  const runId = `run-test-suite-${Date.now()}`;
  const threadId = `th-test-${Date.now()}`;

  const { runDir } = initRun(threadId, runId);
  assert.ok(runDir.includes(runId));

  const spec = createProductIdentitySpec({
    threadId,
    brandName: "Velvet Dew",
    productType: "moisturizer",
    rawText: "Velvet Dew Moisturizer",
  });

  await saveProductSpec(runId, spec);
  const loadedSpec = await loadProductSpec(runId);
  assert.deepEqual(loadedSpec, spec);

  const brandContext: BrandContext = {
    brandName: "Velvet Dew",
    logoAsset: "provisional",
    watermarkAsset: "none",
    referenceUrls: [],
    paletteAndTypographyCues: "neutral",
    toneOfVoice: "warm",
    approvedClaims: [],
    prohibitedClaims: [],
    audience: "all",
    usageRightsAndNotes: "none",
  };

  const dummyArtifactPath = await saveFileArtifact(runId, "assets/sample.txt", "sample artifact content");
  assert.ok(fs.existsSync(dummyArtifactPath));

  const sampleArtifact: Artifact = {
    id: generateId('art'),
    runId,
    threadId,
    kind: 'packshot',
    variantId: null,
    localPath: dummyArtifactPath,
    parentArtifactId: null,
    sourceProductArtifactId: 'art-root',
    productIdentityVersion: 'v1',
    prompt: 'packshot test prompt',
    provider: 'openai',
    providerModel: 'gpt-image-2.5-flare-2026-09-08',
    createdAt: new Date().toISOString(),
    status: 'completed',
  };

  const econ = await researchUnitEconomics({ productCategory: "moisturizer" });

  const threadState: ThreadState = {
    threadId,
    runId,
    brandContext,
    currentBrief: "Velvet Dew Moisturizer",
    productIdentitySpec: spec,
    productIdentityVersion: "v1",
    assetPack: { packshot: sampleArtifact },
    posterVariants: [],
    recommendedVariantId: "A",
    economics: econ,
    signals: [],
    latestArtifactId: sampleArtifact.id,
    artifactHistory: [sampleArtifact],
  };

  await saveThreadState(threadState);
  const loadedThread = await loadThreadState(threadId);
  assert.equal(loadedThread?.threadId, threadId);
  assert.equal(loadedThread?.runId, runId);

  const manifestPath = await updateManifest(runId, [sampleArtifact]);
  assert.ok(fs.existsSync(manifestPath));
  const manifestData = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  assert.equal(manifestData.artifactsCount, 1);
  assert.equal(manifestData.artifacts[0].localPath, dummyArtifactPath);
});

test("Unit economics calculator applies Stripe fees (2.9% + $0.30), Shopify CVR (2.85%), and scenarios", async () => {
  const econ = await researchUnitEconomics({
    productCategory: "moisturizer",
    userSuppliedPrice: 54.0,
  });

  assert.equal(econ.selectedPrice, 54.0);
  assert.ok(econ.selectedCogs > 0);
  assert.ok(econ.fulfilmentCost > 0);

  // Stripe fee = 2.9% + $0.30 = (54 * 0.029) + 0.30 = $1.866 -> $1.87
  const expectedStripeFee = Number(((54.0 * 0.029) + 0.30).toFixed(2));
  assert.equal(econ.paymentFee, expectedStripeFee);

  // Contribution per order
  assert.ok(econ.contributionPerOrder > 0);
  assert.ok(econ.breakEvenOrders > 0);

  // Volume scenarios exist for low, base, high
  assert.ok(econ.volumeScenarios.low.orders > 0);
  assert.ok(econ.volumeScenarios.base.orders > 0);
  assert.ok(econ.volumeScenarios.high.orders > 0);

  // Evidence labeling
  assert.ok(econ.evidenceLabels.length > 0);
  const observedField = econ.evidenceLabels.find((e) => e.field === "paymentFee");
  assert.equal(observedField?.label, "observed");

  // Check user COGS override (e.g. $8.20 supplier quote)
  const customEcon = await researchUnitEconomics({
    productCategory: "moisturizer",
    userSuppliedCogs: 8.20,
    userSuppliedPrice: 54.0,
  });
  assert.equal(customEcon.selectedCogs, 8.20);
  const userCogsEvidence = customEcon.evidenceLabels.find((e) => e.field === "selectedCogs");
  assert.equal(userCogsEvidence?.label, "user-supplied");
});

test("buildDeckSpec and PPTX / PDF export generators produce valid binary documents", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "launch-deck-test-"));

  try {
    const spec = createProductIdentitySpec({
      threadId: "th-test-deck",
      brandName: "Stackifier",
      productType: "moisturizer",
      rawText: "Stackifier Barrier Moisturizer",
    });

    const economics = await researchUnitEconomics({
      productCategory: "moisturizer",
      userSuppliedCogs: 8.20,
      userSuppliedPrice: 54.0,
    });

    const signals: CommercialSignal[] = [
      {
        signal: "Premium DTC Price Band Compression ($48–$68)",
        sourceUrl: "https://eightx.co/blog/skincare-brand-pricing-strategy",
        evidence: "DTC premium skincare brands cluster between $48 and $68.",
        commercialImplication: "Positioning at $54 retail captures high gross margin.",
        confidence: 0.92,
      },
    ];

    const posterVariants: PosterVariant[] = [
      {
        variantId: "A",
        conceptName: "Minimalist Clinical Laboratory",
        hypothesis: "Clinical authority messaging drives higher trust.",
        audience: "Dermatology-focused consumers seeking barrier repair",
        visualDirection: "Clean pharmaceutical aesthetic with frosted glass.",
        headline: "Clinical Barrier Defense",
        imageArtifactId: "art-poster-a",
        prompt: "clean studio background",
      },
      {
        variantId: "B",
        conceptName: "Warm Golden-Hour Lifestyle",
        hypothesis: "Lifestyle context increases emotional connection and AOV.",
        audience: "Wellness enthusiasts seeking radiant morning ritual",
        visualDirection: "Sun-drenched morning vanity with warm terracotta accents.",
        headline: "Awaken Your Skin Barrier",
        imageArtifactId: "art-poster-b",
        prompt: "warm morning sun",
      },
      {
        variantId: "C",
        conceptName: "Bold High-Contrast Editorial",
        hypothesis: "High visual contrast wins thumbnail attention in paid social feeds.",
        audience: "Design-conscious urban shoppers",
        visualDirection: "Monolithic travertine block with stark directional lighting.",
        headline: "Architectural Hydration",
        imageArtifactId: "art-poster-c",
        prompt: "dramatic low perspective",
      },
    ];

    const ugcSpec = buildUGCSpec(spec);

    const dummyPackshotPath = path.join(tmpDir, "dummy-packshot.png");
    // Create a 1x1 transparent PNG buffer
    const png1x1 = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );
    fs.writeFileSync(dummyPackshotPath, png1x1);

    const assetPack: Record<string, Artifact> = {
      product_master: {
        id: "art-master",
        runId: "run-deck-1",
        threadId: "th-1",
        kind: "product_master",
        variantId: null,
        localPath: dummyPackshotPath,
        parentArtifactId: null,
        sourceProductArtifactId: "art-master",
        productIdentityVersion: "v1",
        prompt: "master prompt",
        provider: "openai",
        providerModel: "gpt-image-2.5-flare-2026-09-08",
        createdAt: new Date().toISOString(),
        status: "completed",
      },
      packshot: {
        id: "art-packshot",
        runId: "run-deck-1",
        threadId: "th-1",
        kind: "packshot",
        variantId: null,
        localPath: dummyPackshotPath,
        parentArtifactId: null,
        sourceProductArtifactId: "art-master",
        productIdentityVersion: "v1",
        prompt: "packshot prompt",
        provider: "openai",
        providerModel: "gpt-image-2.5-flare-2026-09-08",
        createdAt: new Date().toISOString(),
        status: "completed",
      },
    };

    const deckSpec = buildDeckSpec({
      brandName: "Stackifier",
      productSpec: spec,
      assetPack,
      posterVariants,
      recommendedVariantId: "A",
      signals,
      economics,
      ugcSpec,
    });

    assert.equal(deckSpec.slides.length, 7);
    assert.ok(deckSpec.slides[0]);
    assert.equal(deckSpec.slides[0].slideNumber, 1);
    assert.ok(deckSpec.slides[6]);
    assert.equal(deckSpec.slides[6].slideNumber, 7);

    // Test PPTX export
    const pptxPath = path.join(tmpDir, "deck.pptx");
    await exportDeckToPptx(deckSpec, pptxPath, { assetPack });
    assert.ok(fs.existsSync(pptxPath));
    const pptxBytes = fs.readFileSync(pptxPath);
    assert.ok(pptxBytes.length > 5000);
    // PPTX zip magic bytes
    assert.equal(pptxBytes[0], 0x50);
    assert.equal(pptxBytes[1], 0x4b);

    // Test PDF export
    const pdfPath = path.join(tmpDir, "deck.pdf");
    await exportDeckToPdf(deckSpec, pdfPath, { assetPack });
    assert.ok(fs.existsSync(pdfPath));
    const pdfBytes = fs.readFileSync(pdfPath);
    assert.ok(pdfBytes.length > 1000);
    // PDF magic bytes: %PDF-
    assert.equal(pdfBytes[0], 0x25);
    assert.equal(pdfBytes[1], 0x50);
    assert.equal(pdfBytes[2], 0x44);
    assert.equal(pdfBytes[3], 0x46);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("fal video provider reports provider failure status cleanly without synthetic fallback when FAL_KEY is not set", async () => {
  const originalKey = process.env.FAL_KEY;
  delete process.env.FAL_KEY;

  try {
    const spec = createProductIdentitySpec({
      threadId: "th-fal-test",
      brandName: "Stackifier",
      productType: "moisturizer",
      rawText: "Stackifier Moisturizer",
    });

    const dummyPoster: Artifact = {
      id: "art-poster-b",
      runId: "run-fal-test",
      threadId: "th-fal-test",
      kind: "poster",
      variantId: "B",
      localPath: "dummy.png",
      parentArtifactId: "art-master",
      sourceProductArtifactId: "art-master",
      productIdentityVersion: "v1",
      prompt: "dummy poster prompt",
      provider: "openai",
      providerModel: "gpt-image-2.5-flare-2026-09-08",
      createdAt: new Date().toISOString(),
      status: "completed",
    };

    const result = await generateKlingVideo({
      runId: "run-fal-test",
      threadId: "th-fal-test",
      sourcePosterArtifact: dummyPoster,
      productSpec: spec,
    });

    assert.equal(result.artifact.status, "failed");
    assert.ok(result.artifact.error?.includes("FAL_KEY is not configured"));
    assert.ok(result.ugcSpec.shots.length >= 2);
  } finally {
    if (originalKey) {
      process.env.FAL_KEY = originalKey;
    }
  }
});

test("all 7 viral video blueprints exist and generate structured specs via Jinja templates", () => {
  const blueprintIds: BlueprintId[] = [
    "egg-coverage-test",
    "underwater-bubble-hydration",
    "seasonal-tap-swap",
    "sun-stick-dual-finish",
    "asmr-beauty-recipe",
    "problem-solution-invisible-swatch",
    "skin-1004-soothing-dispense",
  ];

  const spec = createProductIdentitySpec({
    threadId: "th-bp-test",
    brandName: "Joseon Beauty",
    productType: "sunscreen",
    rawText: "Sunscreen with matte finish",
  });

  for (const id of blueprintIds) {
    const bp = VIDEO_BLUEPRINTS[id];
    assert.ok(bp, `Blueprint ${id} must exist`);
    assert.equal(bp.id, id);
    assert.ok(bp.title.length > 0);
    assert.ok(bp.referenceVideoFilename.endsWith(".mp4"));
    assert.ok(bp.masterPrompt.length > 50);
    assert.ok(bp.hook.title.length > 0);
    assert.ok(bp.hook.copy.length > 0);
    assert.ok(bp.valueProp.length > 0);
    assert.ok(bp.lightingConfig.style.length > 0);
    assert.ok(bp.lightingConfig.colorTemperature.length > 0);
    assert.ok(bp.cameraHardware.camera.length > 0);
    assert.ok(bp.cameraHardware.props.length >= 2);
    assert.ok(bp.shots.length >= 2);

    // Test Jinja template prompt builder
    const klingPrompt = bp.buildKlingPrompt(spec, "Joseon Beauty");
    assert.ok(klingPrompt.length > 50);
    assert.ok(klingPrompt.includes("Joseon Beauty"));

    // Test UGC spec builder
    const ugc = bp.buildUGCSpec(spec, "Joseon Beauty");
    assert.equal(ugc.aspectRatio, "9:16");
    assert.equal(ugc.durationMode, "five_second_single_clip");
    assert.ok(ugc.shots.length >= 2);
    assert.ok(ugc.negativeConstraints.length > 0);
  }

  // Test keyword-driven selection across all formats
  assert.equal(selectVideoBlueprint(spec, undefined, "Let's do the egg test on raw brown eggs").id, "egg-coverage-test");
  assert.equal(selectVideoBlueprint(spec, undefined, "underwater shot with rising bubbles and splash").id, "underwater-bubble-hydration");
  assert.equal(selectVideoBlueprint(spec, undefined, "September 1st seasonal tap swap routine").id, "seasonal-tap-swap");
  assert.equal(selectVideoBlueprint(spec, undefined, "Glow vs matte sun stick split screen").id, "sun-stick-dual-finish");
  assert.equal(selectVideoBlueprint(spec, undefined, "Korean red bean bingsu dessert recipe with clay scoop").id, "asmr-beauty-recipe");
  assert.equal(selectVideoBlueprint(spec, undefined, "If you hate SPF white cast, try this swatch instead").id, "problem-solution-invisible-swatch");
  assert.equal(selectVideoBlueprint(spec, undefined, "struggling with irritated skin? try this soothing centella cica ampoule").id, "skin-1004-soothing-dispense");
});

test("Jinja template engine parses variables, loops, and conditions accurately", () => {
  const template = `Hello {{ name }}! {% if isMember %}Welcome back VIP!{% else %}Join today!{% endif %} Items: {% for i in items %}{{ i }}, {% endfor %}`;
  const out = renderString(template, { name: "Alice", isMember: true, items: ["SPF", "Serum"] });
  assert.ok(out.includes("Hello Alice!"));
  assert.ok(out.includes("Welcome back VIP!"));
  assert.ok(out.includes("SPF, Serum, "));
});


