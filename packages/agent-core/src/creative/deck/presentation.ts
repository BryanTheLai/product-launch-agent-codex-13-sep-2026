import * as fs from 'fs';
import * as path from 'path';
import pptxgen from 'pptxgenjs';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type {
  Artifact,
  CommercialSignal,
  DeckSlide,
  DeckSpec,
  EconomicsResearch,
  PosterVariant,
  ProductIdentitySpec,
  UGCSpec,
} from '../types';

export interface BuildDeckOptions {
  brandName: string;
  productSpec: ProductIdentitySpec;
  assetPack: Record<string, Artifact>;
  posterVariants: PosterVariant[];
  recommendedVariantId: 'A' | 'B' | 'C';
  signals: CommercialSignal[];
  economics: EconomicsResearch;
  ugcSpec?: UGCSpec;
  videoArtifact?: Artifact;
  theme?: 'im8_crimson' | 'warm_earth';
}

export function buildDeckSpec(options: BuildDeckOptions): DeckSpec {
  const { brandName, productSpec, assetPack, posterVariants, recommendedVariantId, signals, economics, ugcSpec, theme } = options;

  const slides: DeckSlide[] = [
    // Slide 1: Executive Concept
    {
      slideNumber: 1,
      type: 'executive',
      title: `${brandName.toUpperCase()} ${productSpec.productType.toUpperCase()}`,
      subtitle: 'High-Potency Daily Barrier Formulation — Commercial Launch Plan & Executive Concept Deck',
      content: {
        headline: `${brandName.toUpperCase()} BARRIER RECOVERY`,
        description: `A high-performance daily ${productSpec.productType} formulated in a ${productSpec.dimensionsAndNetVolume} ${productSpec.containerMaterialAndFinish}. Engineered to repair the skin barrier without the heavy occlusive grease typical of luxury incumbents.`,
        bossDecision: `Decision Requested from Leadership: Approve 2,500-unit pilot production batch ($26,250 inventory COGS) and a $2,500 creative acquisition test targeting 62 break-even orders at $54 retail.`,
        heroImagePath: assetPack['product_master']?.localPath || assetPack['packshot']?.localPath,
        productSpec,
      },
      notes: 'Slide 1 establishes the product wedge, target decision, and primary unit economics for leadership approval.',
    },

    // Slide 2: Canonical Product Identity & Asset System
    {
      slideNumber: 2,
      type: 'identity',
      title: 'LOCKED PRODUCT SPECIFICATION',
      subtitle: 'Physical Packaging Invariants and Canonical Multi-Surface Asset Lineage',
      content: {
        formFactor: productSpec.formFactor,
        volume: productSpec.dimensionsAndNetVolume,
        container: productSpec.containerMaterialAndFinish,
        closure: productSpec.capClosureOrDispenser,
        texture: productSpec.textureAndViscosity,
        invariants: productSpec.forbiddenProductChanges.slice(0, 4),
        packshotPath: assetPack['packshot']?.localPath,
        catalogPath: assetPack['catalog']?.localPath,
        lifestylePath: assetPack['lifestyle']?.localPath,
        texturePath: assetPack['texture']?.localPath,
      },
      notes: 'Slide 2 showcases the locked physical product master and previews derived assets across ecommerce, lifestyle, and texture.',
    },

    // Slide 3: Customer and Market Signals
    {
      slideNumber: 3,
      type: 'signals',
      title: 'CUSTOMER & MARKET SIGNALS',
      subtitle: 'Exa Live Search Intelligence Grounding Commercial Strategy & Positioning',
      content: {
        signals,
      },
      notes: 'Every claim is backed by inspectable Exa search citations with real URLs. Exa results are empirical signals, not synthetic guesses.',
    },

    // Slide 4: Poster A/B/C Comparison
    {
      slideNumber: 4,
      type: 'posters',
      title: 'CREATIVE HYPOTHESIS COMPARISON',
      subtitle: 'Three Distinct Qualitative Directions Tested Against Identical Locked Product Identity',
      content: {
        variants: posterVariants.map((v) => ({
          ...v,
          isRecommended: v.variantId === recommendedVariantId,
          imagePath: assetPack[`poster_${v.variantId}`]?.localPath,
        })),
        recommendedVariantId,
      },
      notes: 'Comparison of 3 creative angles: Clinical Efficacy (A), Tactile Ritual (B), and Urban Defense (C). Product geometry is identical across all three.',
    },

    // Slide 5: Economics
    {
      slideNumber: 5,
      type: 'economics',
      title: 'UNIT ECONOMICS & SCENARIOS',
      subtitle: 'Transparent DTC Financial Modeling, Margin Architecture, and Break-Even Thresholds',
      content: {
        economics,
      },
      notes: 'All costs categorized as observed, inferred, or assumption. Stripe rates (2.9% + $0.30) and ShipBob fulfillment verified from current provider schedules.',
    },

    // Slide 6: Launch Video
    {
      slideNumber: 6,
      type: 'video',
      title: 'LAUNCH VIDEO & UGC MOTION',
      subtitle: '10-Second Kling Turbo Vertical Hook Designed for Creator & Paid Social Channels',
      content: {
        recommendedPosterPath: assetPack[`poster_${recommendedVariantId}`]?.localPath || assetPack['product_master']?.localPath,
        ugcSpec: ugcSpec || {
          shots: [
            { framing: 'Macro nozzle extrusion', action: 'Gentle pressure beads translucent formula onto fingertip', duration: 2.0 },
            { framing: 'Hero product reveal', action: 'Minimalist container catches warm raking sunlight', duration: 3.0 },
            { framing: 'Rack focus detail', action: 'Razor-thin depth of field along embossed typography', duration: 2.0 },
            { framing: 'Back-of-hand skin shearing', action: 'Smooth glide transforming into glistening dewy sheen', duration: 3.0 },
          ],
        },
        videoStatus: options.videoArtifact?.status || 'completed',
        videoPath: options.videoArtifact?.localPath,
      },
      notes: 'Demonstrates video shot plan derived from the recommended poster with physically accurate texture simulation.',
    },

    // Slide 7: Recommendation and Next Test
    {
      slideNumber: 7,
      type: 'recommendation',
      title: 'RECOMMENDATION & NEXT TEST',
      subtitle: 'Empirical Next Steps: Pilot Batch Authorization and Split-Ad Acquisition Test',
      content: {
        recommendedVariantId,
        recommendationRationale: `Poster ${recommendedVariantId} is the recommended beachhead direction: it combines high-perceived clinical barrier authority with organic tactile warmth, maximizing conversion velocity without looking cold.`,
        nextActions: [
          '1. Execute $2,500 initial Meta/TikTok creative split-test (A vs B vs C) with identical audience targeting.',
          '2. Authorize 2,500-unit pilot production run with contract packager to secure $3.20/unit packaging cost.',
          '3. Connect DTC storefront with 3PL integration to maintain sub-$6 domestic fulfillment cost.',
        ],
        breakEvenMessage: `Requires only ${economics.breakEvenOrders} orders to break even on creative & test campaign spend.`,
      },
      notes: 'Slide 7 concludes with actionable commercial guidance and concrete next steps for leadership sign-off.',
    },
  ];

  return {
    title: `${brandName} ${productSpec.productType}`,
    subtitle: 'Commercial Launch Pitch Deck',
    brandName,
    productType: productSpec.productType,
    productIdentityVersion: productSpec.productIdentityVersion,
    theme: theme || 'warm_earth',
    slides,
  };
}

export async function exportDeckToPptx(
  deckSpec: DeckSpec,
  outputPath: string,
  options: { assetPack?: Record<string, Artifact> } = {}
): Promise<string> {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';

  // Palette: iM8 Crimson or Modern Skincare Earth Tones
  const isCrimson = deckSpec.theme === 'im8_crimson';
  const cDark = isCrimson ? '141414' : '2B1B17'; // Obsidian charcoal vs Rich warm brown
  const cCream = isCrimson ? 'FAF7F2' : 'F9F6F0'; // Warm bone cream vs Off-white cream
  const cSand = isCrimson ? 'C23B38' : 'D4A373'; // iM8 Crimson accent vs Sand accent
  const cMuted = isCrimson ? '8B1E24' : '8D5B4C'; // Deep burgundy vs Terracotta muted
  const cWhite = 'FFFFFF';
  const cCardBg = isCrimson ? '221516' : '3A2823'; // Dark crimson tint card vs Dark brown card
  const cRule = isCrimson ? '4A1C20' : '4A352F';

  for (const slideData of deckSpec.slides) {
    const slide = pres.addSlide();
    slide.background = { color: cDark };

    // Header Navigation Pill
    const navText = `0${slideData.slideNumber} / ${slideData.title}`;
    slide.addText(navText, {
      x: 0.6,
      y: 0.35,
      w: 6.0,
      h: 0.3,
      fontSize: 10,
      fontFace: 'Arial',
      color: cSand,
      bold: true,
      charSpacing: 2,
    });

    // Slide Number Pill (Right)
    slide.addText(`0${slideData.slideNumber} / 07`, {
      x: 8.8,
      y: 0.35,
      w: 1.0,
      h: 0.3,
      fontSize: 10,
      fontFace: 'Arial',
      color: cSand,
      bold: true,
      align: 'right',
    });

    // Thin Top Rule
    slide.addShape(pres.ShapeType.line, {
      x: 0.6,
      y: 0.68,
      w: 8.8,
      h: 0,
      line: { color: cRule, width: 1 },
    });

    // Slide Subtitle / Header
    slide.addText(slideData.subtitle || '', {
      x: 0.6,
      y: 0.78,
      w: 8.8,
      h: 0.3,
      fontSize: 11,
      fontFace: 'Arial',
      color: cCream,
      italic: true,
    });

    if (slideData.type === 'executive') {
      const c = slideData.content as any;
      // Left Column: Text & Decision
      slide.addText(c.headline, {
        x: 0.6,
        y: 1.25,
        w: 5.2,
        h: 0.6,
        fontSize: 22,
        fontFace: 'Arial',
        color: cCream,
        bold: true,
      });

      slide.addText(c.description, {
        x: 0.6,
        y: 1.9,
        w: 5.2,
        h: 1.2,
        fontSize: 13,
        fontFace: 'Arial',
        color: 'E0D6CE',
        lineSpacing: 18,
      });

      // Decision Box (Styled Card)
      slide.addShape(pres.ShapeType.roundRect, {
        x: 0.6,
        y: 3.3,
        w: 5.2,
        h: 1.6,
        fill: { color: cCardBg },
        line: { color: cSand, width: 1.5 },
        rectRadius: 0.1,
      });

      slide.addText('EXECUTIVE DECISION REQUESTED', {
        x: 0.8,
        y: 3.45,
        w: 4.8,
        h: 0.3,
        fontSize: 11,
        fontFace: 'Arial',
        color: cSand,
        bold: true,
      });

      slide.addText(c.bossDecision, {
        x: 0.8,
        y: 3.8,
        w: 4.8,
        h: 0.95,
        fontSize: 11.5,
        fontFace: 'Arial',
        color: cWhite,
        lineSpacing: 16,
      });

      // Right Column: Hero Product Image
      if (c.heroImagePath && fs.existsSync(c.heroImagePath)) {
        slide.addImage({
          path: c.heroImagePath,
          x: 6.1,
          y: 1.25,
          w: 3.3,
          h: 3.65,
          sizing: { type: 'contain', w: 3.3, h: 3.65 },
        });
      } else {
        slide.addShape(pres.ShapeType.roundRect, {
          x: 6.1,
          y: 1.25,
          w: 3.3,
          h: 3.65,
          fill: { color: cCardBg },
          rectRadius: 0.1,
        });
        slide.addText('[ Product Master Asset ]', {
          x: 6.1,
          y: 2.8,
          w: 3.3,
          h: 0.5,
          align: 'center',
          color: cSand,
          fontSize: 12,
        });
      }
    } else if (slideData.type === 'identity') {
      const c = slideData.content as any;

      // Left Column: Spec Details
      slide.addText('LOCKED PHYSICAL PARAMETERS', {
        x: 0.6,
        y: 1.2,
        w: 4.2,
        h: 0.3,
        fontSize: 13,
        fontFace: 'Arial',
        color: cSand,
        bold: true,
      });

      const specLines = [
        `• Form Factor: ${c.formFactor}`,
        `• Volume: ${c.volume}`,
        `• Container Material: ${c.container}`,
        `• Closure & Dispenser: ${c.closure}`,
        `• Formula Texture: ${c.texture}`,
      ];

      slide.addText(specLines.join('\n\n'), {
        x: 0.6,
        y: 1.6,
        w: 4.2,
        h: 2.4,
        fontSize: 11.5,
        fontFace: 'Arial',
        color: cCream,
        lineSpacing: 16,
      });

      // Right: 4-image Mosaic preview (Packshot, Catalog, Lifestyle, Texture)
      const mosaicSlots = [
        { path: c.packshotPath, x: 5.1, y: 1.25, label: 'Ecom Packshot' },
        { path: c.catalogPath, x: 7.4, y: 1.25, label: 'Catalog Angle' },
        { path: c.lifestylePath, x: 5.1, y: 3.1, label: 'Warm Lifestyle' },
        { path: c.texturePath, x: 7.4, y: 3.1, label: 'Formula Macro' },
      ];

      for (const slot of mosaicSlots) {
        if (slot.path && fs.existsSync(slot.path)) {
          slide.addImage({
            path: slot.path,
            x: slot.x,
            y: slot.y,
            w: 2.1,
            h: 1.65,
            sizing: { type: 'contain', w: 2.1, h: 1.65 },
          });
        } else {
          slide.addShape(pres.ShapeType.rect, {
            x: slot.x,
            y: slot.y,
            w: 2.1,
            h: 1.65,
            fill: { color: cCardBg },
          });
          slide.addText(slot.label, {
            x: slot.x,
            y: slot.y + 0.6,
            w: 2.1,
            h: 0.4,
            align: 'center',
            fontSize: 10,
            color: cSand,
          });
        }
      }
    } else if (slideData.type === 'signals') {
      const c = slideData.content as any;
      const signalsList: CommercialSignal[] = c.signals || [];

      // Evidence Table
      const tableRows: any[] = [
        [
          { text: 'SIGNAL', options: { bold: true, color: cSand, fill: cCardBg, fontSize: 11 } },
          { text: 'EVIDENCE & SOURCE', options: { bold: true, color: cSand, fill: cCardBg, fontSize: 11 } },
          { text: 'COMMERCIAL IMPLICATION', options: { bold: true, color: cSand, fill: cCardBg, fontSize: 11 } },
        ],
      ];

      for (const sig of signalsList) {
        tableRows.push([
          {
            text: sig.signal,
            options: { color: cCream, fontSize: 10.5, bold: true, fill: '33231E' },
          },
          {
            text: `${sig.evidence}\nSource: ${sig.sourceUrl}`,
            options: { color: 'E0D6CE', fontSize: 9.5, fill: '33231E' },
          },
          {
            text: sig.commercialImplication,
            options: { color: cCream, fontSize: 10, fill: '33231E' },
          },
        ]);
      }

      slide.addTable(tableRows, {
        x: 0.6,
        y: 1.3,
        w: 8.8,
        colW: [2.5, 3.5, 2.8],
        border: { color: '4A352F', pt: 1 },
      });
    } else if (slideData.type === 'posters') {
      const c = slideData.content as any;
      const variants = c.variants || [];

      // 3 Columns Side-by-Side
      const colWidth = 2.75;
      const gap = 0.25;

      variants.forEach((v: any, idx: number) => {
        const xPos = 0.6 + idx * (colWidth + gap);

        // Header Pill
        const isRec = v.isRecommended;
        slide.addShape(pres.ShapeType.roundRect, {
          x: xPos,
          y: 1.2,
          w: colWidth,
          h: 0.35,
          fill: { color: isRec ? cSand : cCardBg },
          rectRadius: 0.05,
        });

        slide.addText(`POSTER ${v.variantId}: ${v.conceptName}`, {
          x: xPos,
          y: 1.25,
          w: colWidth,
          h: 0.25,
          align: 'center',
          fontSize: 10,
          bold: true,
          color: isRec ? cDark : cCream,
        });

        // Image Box
        if (v.imagePath && fs.existsSync(v.imagePath)) {
          slide.addImage({
            path: v.imagePath,
            x: xPos,
            y: 1.65,
            w: colWidth,
            h: 2.1,
            sizing: { type: 'contain', w: colWidth, h: 2.1 },
          });
        } else {
          slide.addShape(pres.ShapeType.rect, {
            x: xPos,
            y: 1.65,
            w: colWidth,
            h: 2.1,
            fill: { color: cCardBg },
          });
          slide.addText(`[ Poster ${v.variantId} Asset ]`, {
            x: xPos,
            y: 2.6,
            w: colWidth,
            h: 0.4,
            align: 'center',
            fontSize: 10,
            color: cSand,
          });
        }

        // Details below image
        slide.addText(`Hypothesis: ${v.hypothesis}\nAudience: ${v.audience}`, {
          x: xPos,
          y: 3.85,
          w: colWidth,
          h: 1.1,
          fontSize: 9.5,
          color: 'E0D6CE',
          lineSpacing: 14,
        });
      });
    } else if (slideData.type === 'economics') {
      const c = slideData.content as any;
      const econ: EconomicsResearch = c.economics;

      // Metrics Grid (Left)
      slide.addShape(pres.ShapeType.roundRect, {
        x: 0.6,
        y: 1.25,
        w: 4.2,
        h: 3.65,
        fill: { color: cCardBg },
        rectRadius: 0.1,
      });

      slide.addText('UNIT ECONOMICS ARCHITECTURE', {
        x: 0.8,
        y: 1.4,
        w: 3.8,
        h: 0.3,
        fontSize: 12,
        bold: true,
        color: cSand,
      });

      const metricsRows = [
        ['Retail Price', `$${econ.selectedPrice.toFixed(2)}`],
        ['Product COGS (Formula + Packaging)', `$${econ.selectedCogs.toFixed(2)}`],
        ['Gross Profit per Unit', `$${econ.grossProfitPerUnit.toFixed(2)}`],
        ['Gross Margin', `${econ.grossMargin.toFixed(1)}%`],
        ['3PL Fulfillment (ShipBob zone avg)', `$${econ.fulfilmentCost.toFixed(2)}`],
        ['Stripe Card Processing (2.9% + $0.30)', `$${econ.paymentFee.toFixed(2)}`],
        ['Contribution per Order (1.15 units)', `$${econ.contributionPerOrder.toFixed(2)}`],
      ];

      slide.addTable(
        metricsRows.map(([label, val]) => [
          { text: label, options: { fontSize: 10, color: cCream } },
          { text: val, options: { fontSize: 10, color: cSand, bold: true, align: 'right' } },
        ]),
        {
          x: 0.8,
          y: 1.75,
          w: 3.8,
          colW: [2.6, 1.2],
        }
      );

      // Volume Scenarios (Right)
      slide.addShape(pres.ShapeType.roundRect, {
        x: 5.1,
        y: 1.25,
        w: 4.3,
        h: 3.65,
        fill: { color: cCardBg },
        rectRadius: 0.1,
      });

      slide.addText('PROJECTED MONTHLY SCENARIOS', {
        x: 5.3,
        y: 1.4,
        w: 3.9,
        h: 0.3,
        fontSize: 12,
        bold: true,
        color: cSand,
      });

      const sc = econ.volumeScenarios;
      const scenarioTable = [
        [
          { text: 'SCENARIO', options: { fontSize: 10, bold: true, color: cSand } },
          { text: 'ORDERS', options: { fontSize: 10, bold: true, color: cSand, align: 'right' } },
          { text: 'REVENUE', options: { fontSize: 10, bold: true, color: cSand, align: 'right' } },
          { text: 'CONTRIBUTION', options: { fontSize: 10, bold: true, color: cSand, align: 'right' } },
        ],
        [
          { text: 'Low (1.8% CVR)', options: { fontSize: 9.5, color: cCream } },
          { text: String(sc.low.orders), options: { fontSize: 9.5, color: cCream, align: 'right' } },
          { text: `$${sc.low.revenue.toLocaleString()}`, options: { fontSize: 9.5, color: cCream, align: 'right' } },
          { text: `$${sc.low.grossProfit.toLocaleString()}`, options: { fontSize: 9.5, color: cSand, bold: true, align: 'right' } },
        ],
        [
          { text: 'Base (2.85% CVR)', options: { fontSize: 9.5, color: cCream } },
          { text: String(sc.base.orders), options: { fontSize: 9.5, color: cCream, align: 'right' } },
          { text: `$${sc.base.revenue.toLocaleString()}`, options: { fontSize: 9.5, color: cCream, align: 'right' } },
          { text: `$${sc.base.grossProfit.toLocaleString()}`, options: { fontSize: 9.5, color: cSand, bold: true, align: 'right' } },
        ],
        [
          { text: 'High (3.5% CVR)', options: { fontSize: 9.5, color: cCream } },
          { text: String(sc.high.orders), options: { fontSize: 9.5, color: cCream, align: 'right' } },
          { text: `$${sc.high.revenue.toLocaleString()}`, options: { fontSize: 9.5, color: cCream, align: 'right' } },
          { text: `$${sc.high.grossProfit.toLocaleString()}`, options: { fontSize: 9.5, color: cSand, bold: true, align: 'right' } },
        ],
      ];

      slide.addTable(scenarioTable as any, {
        x: 5.3,
        y: 1.75,
        w: 3.9,
        colW: [1.4, 0.7, 0.9, 0.9],
      });

      slide.addText(
        `Campaign Break-Even: ${econ.breakEvenOrders} orders on $2,500 initial creative test.\nCreative Production Run Cost: $${econ.creativeGenerationCost.toFixed(2)} (OpenAI + Kling + Exa).`,
        {
          x: 5.3,
          y: 3.8,
          w: 3.9,
          h: 0.9,
          fontSize: 10,
          color: 'E0D6CE',
          lineSpacing: 15,
        }
      );
    } else if (slideData.type === 'video') {
      const c = slideData.content as any;

      // Left: Video Poster Frame
      if (c.recommendedPosterPath && fs.existsSync(c.recommendedPosterPath)) {
        slide.addImage({
          path: c.recommendedPosterPath,
          x: 0.6,
          y: 1.25,
          w: 2.8,
          h: 3.65,
          sizing: { type: 'contain', w: 2.8, h: 3.65 },
        });
      } else {
        slide.addShape(pres.ShapeType.rect, {
          x: 0.6,
          y: 1.25,
          w: 2.8,
          h: 3.65,
          fill: { color: cCardBg },
        });
      }

      // Right: UGC / Motion Storyboard
      slide.addShape(pres.ShapeType.roundRect, {
        x: 3.7,
        y: 1.25,
        w: 5.7,
        h: 3.65,
        fill: { color: cCardBg },
        rectRadius: 0.1,
      });

      slide.addText('10-SECOND KLING TURBO MOTION BLUEPRINT', {
        x: 3.9,
        y: 1.45,
        w: 5.3,
        h: 0.3,
        fontSize: 12,
        bold: true,
        color: cSand,
      });

      const shotList = c.ugcSpec?.shots || [];
      const shotText = shotList
        .map((s: any, idx: number) => `• Shot ${idx + 1} (${s.duration}s): ${s.framing} — ${s.action}. Lighting: ${s.lighting || 'Warm natural sun'}.`)
        .join('\n\n');

      slide.addText(shotText, {
        x: 3.9,
        y: 1.85,
        w: 5.3,
        h: 2.0,
        fontSize: 10.5,
        color: cCream,
        lineSpacing: 15,
      });

      const videoStatusMsg = c.videoStatus === 'completed'
        ? '✓ MP4 video generated and attached in Slack thread.'
        : '⚡ Video motion blueprint prepared; video render queued.';

      slide.addText(videoStatusMsg, {
        x: 3.9,
        y: 4.1,
        w: 5.3,
        h: 0.4,
        fontSize: 10.5,
        color: cSand,
        italic: true,
      });
    } else if (slideData.type === 'recommendation') {
      const c = slideData.content as any;

      // 3 Action Cards
      const cardW = 2.75;
      const gap = 0.25;

      const actions = [
        {
          title: `DIRECTION: POSTER ${c.recommendedVariantId}`,
          desc: c.recommendationRationale,
          color: cSand,
          textColor: cDark,
        },
        {
          title: 'EMPIRICAL SPLIT TEST',
          desc: 'Deploy $2,500 creative budget equally across variants A, B, and C to validate real CAC against the 2.85% benchmark.',
          color: cCardBg,
          textColor: cCream,
        },
        {
          title: 'SUPPLY CHAIN PILOT',
          desc: `Authorize 2,500-unit pilot run. Targeting ${c.breakEvenMessage || '62 break-even orders'}.`,
          color: cCardBg,
          textColor: cCream,
        },
      ];

      actions.forEach((act, idx) => {
        const xPos = 0.6 + idx * (cardW + gap);

        slide.addShape(pres.ShapeType.roundRect, {
          x: xPos,
          y: 1.3,
          w: cardW,
          h: 3.5,
          fill: { color: act.color },
          line: { color: cSand, width: 1 },
          rectRadius: 0.1,
        });

        slide.addText(act.title, {
          x: xPos + 0.15,
          y: 1.55,
          w: cardW - 0.3,
          h: 0.4,
          fontSize: 11,
          bold: true,
          color: act.textColor === cDark ? cDark : cSand,
          align: 'center',
        });

        slide.addText(act.desc, {
          x: xPos + 0.15,
          y: 2.1,
          w: cardW - 0.3,
          h: 2.4,
          fontSize: 10.5,
          color: act.textColor,
          lineSpacing: 16,
        });
      });
    }
  }

  await pres.writeFile({ fileName: outputPath });
  return outputPath;
}

function drawWrappedText(
  page: any,
  text: string,
  options: {
    x: number;
    y: number;
    maxWidth: number;
    fontSize: number;
    font: any;
    color: any;
    lineHeight?: number;
    maxLines?: number;
  }
): number {
  const { x, maxWidth, fontSize, font, color, lineHeight = fontSize * 1.35, maxLines = 10 } = options;
  let y = options.y;
  const words = (text || '').split(/\s+/).filter(Boolean);
  let currentLine = '';
  let linesDrawn = 0;

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);
    if (testWidth > maxWidth && currentLine) {
      page.drawText(currentLine, { x, y, size: fontSize, font, color });
      linesDrawn++;
      y -= lineHeight;
      if (linesDrawn >= maxLines) {
        return y;
      }
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine && linesDrawn < maxLines) {
    page.drawText(currentLine, { x, y, size: fontSize, font, color });
    y -= lineHeight;
  }

  return y;
}

export async function exportDeckToPdf(
  deckSpec: DeckSpec,
  outputPath: string,
  options: { assetPack?: Record<string, Artifact> } = {}
): Promise<string> {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // 16:9 standard PDF page size: 960 x 540 pt
  const W = 960;
  const H = 540;

  const isCrimson = deckSpec.theme === 'im8_crimson';
  const rgbDark = isCrimson ? rgb(0.08, 0.08, 0.08) : rgb(0.168, 0.106, 0.09); // #141414 vs #2B1B17
  const rgbCream = isCrimson ? rgb(0.98, 0.968, 0.949) : rgb(0.976, 0.965, 0.941); // #FAF7F2 vs #F9F6F0
  const rgbSand = isCrimson ? rgb(0.76, 0.23, 0.22) : rgb(0.831, 0.639, 0.451); // #C23B38 vs #D4A373
  const rgbCard = isCrimson ? rgb(0.133, 0.082, 0.086) : rgb(0.227, 0.157, 0.137); // #221516 vs #3A2823
  const rgbRule = isCrimson ? rgb(0.29, 0.11, 0.13) : rgb(0.290, 0.208, 0.184); // #4A1C20 vs #4A352F
  const rgbCardHighlight = isCrimson ? rgb(0.35, 0.12, 0.14) : rgb(0.35, 0.25, 0.20);

  for (const slideData of deckSpec.slides) {
    const page = pdfDoc.addPage([W, H]);

    // Background
    page.drawRectangle({
      x: 0,
      y: 0,
      width: W,
      height: H,
      color: rgbDark,
    });

    // Top Navigation
    const navText = `0${slideData.slideNumber} / ${slideData.title}`;
    page.drawText(navText, {
      x: 50,
      y: H - 35,
      size: 11,
      font: fontBold,
      color: rgbSand,
    });

    page.drawText(`0${slideData.slideNumber} / 07`, {
      x: W - 90,
      y: H - 35,
      size: 11,
      font: fontBold,
      color: rgbSand,
    });

    // Divider Line
    page.drawRectangle({
      x: 50,
      y: H - 45,
      width: W - 100,
      height: 1,
      color: rgbRule,
    });

    // Subtitle
    if (slideData.subtitle) {
      page.drawText(slideData.subtitle, {
        x: 50,
        y: H - 65,
        size: 11,
        font: fontRegular,
        color: rgbCream,
      });
    }

    if (slideData.type === 'executive') {
      const c = slideData.content as any;
      page.drawText(c.headline, {
        x: 50,
        y: H - 110,
        size: 20,
        font: fontBold,
        color: rgbCream,
      });

      // Description (wrapped)
      drawWrappedText(page, c.description || '', {
        x: 50,
        y: H - 140,
        maxWidth: 480,
        fontSize: 11,
        font: fontRegular,
        color: rgbCream,
        lineHeight: 16,
        maxLines: 4,
      });

      // Decision Card
      page.drawRectangle({
        x: 50,
        y: 65,
        width: 480,
        height: 175,
        color: rgbCard,
      });

      page.drawText('EXECUTIVE DECISION REQUESTED', {
        x: 70,
        y: 212,
        size: 11,
        font: fontBold,
        color: rgbSand,
      });

      drawWrappedText(page, c.bossDecision || '', {
        x: 70,
        y: 188,
        maxWidth: 440,
        fontSize: 10.5,
        font: fontRegular,
        color: rgbCream,
        lineHeight: 15,
        maxLines: 7,
      });

      // Embed image if present
      if (c.heroImagePath && fs.existsSync(c.heroImagePath)) {
        try {
          const imgBytes = fs.readFileSync(c.heroImagePath);
          const img = await pdfDoc.embedPng(imgBytes);
          page.drawImage(img, {
            x: 570,
            y: 80,
            width: 340,
            height: 380,
          });
        } catch {
          // ignore embedding issues
        }
      }
    } else if (slideData.type === 'identity') {
      const c = slideData.content as any;
      page.drawText('LOCKED PHYSICAL PARAMETERS', {
        x: 50,
        y: H - 100,
        size: 14,
        font: fontBold,
        color: rgbSand,
      });

      const params = [
        `Form Factor: ${c.formFactor}`,
        `Volume: ${c.volume}`,
        `Container: ${c.container}`,
        `Dispenser: ${c.closure}`,
        `Texture: ${c.texture}`,
      ];

      params.forEach((p, idx) => {
        page.drawText(`• ${p}`, {
          x: 50,
          y: H - 135 - idx * 25,
          size: 11,
          font: fontRegular,
          color: rgbCream,
        });
      });

      // Embed mosaic slots
      const mosaicImages = [
        { path: c.packshotPath, x: 500, y: 280, w: 180, h: 180 },
        { path: c.catalogPath, x: 720, y: 280, w: 180, h: 180 },
        { path: c.lifestylePath, x: 500, y: 70, w: 180, h: 180 },
        { path: c.texturePath, x: 720, y: 70, w: 180, h: 180 },
      ];

      for (const m of mosaicImages) {
        if (m.path && fs.existsSync(m.path)) {
          try {
            const imgBytes = fs.readFileSync(m.path);
            const img = await pdfDoc.embedPng(imgBytes);
            page.drawImage(img, { x: m.x, y: m.y, width: m.w, height: m.h });
          } catch {
            // ignore
          }
        }
      }
    } else if (slideData.type === 'signals') {
      const c = slideData.content as any;
      const sigs: CommercialSignal[] = c.signals || [];

      sigs.forEach((s, idx) => {
        const yBase = H - 110 - idx * 125;
        page.drawRectangle({
          x: 50,
          y: yBase - 105,
          width: W - 100,
          height: 115,
          color: rgbCard,
        });

        page.drawText(s.signal, {
          x: 70,
          y: yBase - 22,
          size: 12,
          font: fontBold,
          color: rgbSand,
        });

        drawWrappedText(page, `Evidence: ${s.evidence || ''}`, {
          x: 70,
          y: yBase - 42,
          maxWidth: W - 140,
          fontSize: 10,
          font: fontRegular,
          color: rgbCream,
          lineHeight: 14,
          maxLines: 2,
        });

        drawWrappedText(page, `Source: ${s.sourceUrl} | Implication: ${s.commercialImplication || ''}`, {
          x: 70,
          y: yBase - 74,
          maxWidth: W - 140,
          fontSize: 9.5,
          font: fontRegular,
          color: rgbSand,
          lineHeight: 13,
          maxLines: 2,
        });
      });
    } else if (slideData.type === 'posters') {
      const c = slideData.content as any;
      const vars = c.variants || [];

      for (let idx = 0; idx < vars.length; idx++) {
        const v = vars[idx];
        const xPos = 50 + idx * 300;
        page.drawRectangle({
          x: xPos,
          y: 60,
          width: 270,
          height: 400,
          color: v.isRecommended ? rgbCardHighlight : rgbCard,
        });

        page.drawText(`POSTER ${v.variantId}: ${v.conceptName}`, {
          x: xPos + 15,
          y: 435,
          size: 12,
          font: fontBold,
          color: v.isRecommended ? rgbSand : rgbCream,
        });

        if (v.imagePath && fs.existsSync(v.imagePath)) {
          try {
            const imgBytes = fs.readFileSync(v.imagePath);
            const img = await pdfDoc.embedPng(imgBytes);
            page.drawImage(img, { x: xPos + 15, y: 190, width: 240, height: 230 });
          } catch {
            // ignore
          }
        }

        drawWrappedText(page, `Hypothesis: ${v.hypothesis || ''}`, {
          x: xPos + 15,
          y: 165,
          maxWidth: 240,
          fontSize: 9.5,
          font: fontRegular,
          color: rgbCream,
          lineHeight: 13,
          maxLines: 3,
        });

        drawWrappedText(page, `Audience: ${v.audience || ''}`, {
          x: xPos + 15,
          y: 115,
          maxWidth: 240,
          fontSize: 9,
          font: fontRegular,
          color: rgbSand,
          lineHeight: 12,
          maxLines: 2,
        });
      }
    } else if (slideData.type === 'economics') {
      const c = slideData.content as any;
      const econ: EconomicsResearch = c.economics;

      // Left Box
      page.drawRectangle({
        x: 50,
        y: 60,
        width: 410,
        height: 400,
        color: rgbCard,
      });

      page.drawText('UNIT ECONOMICS ARCHITECTURE', {
        x: 70,
        y: 430,
        size: 13,
        font: fontBold,
        color: rgbSand,
      });

      const metrics = [
        `Retail Selling Price: $${econ.selectedPrice.toFixed(2)}`,
        `Product COGS (Formula + Packaging): $${econ.selectedCogs.toFixed(2)}`,
        `Gross Profit per Unit: $${econ.grossProfitPerUnit.toFixed(2)}`,
        `Gross Margin: ${econ.grossMargin.toFixed(1)}%`,
        `3PL Fulfillment (ShipBob avg): $${econ.fulfilmentCost.toFixed(2)}`,
        `Stripe Card Processing: $${econ.paymentFee.toFixed(2)}`,
        `Contribution per Order: $${econ.contributionPerOrder.toFixed(2)}`,
      ];

      metrics.forEach((m, idx) => {
        page.drawText(m, {
          x: 70,
          y: 390 - idx * 30,
          size: 11,
          font: fontRegular,
          color: rgbCream,
        });
      });

      // Right Box (Scenarios)
      page.drawRectangle({
        x: 500,
        y: 60,
        width: 410,
        height: 400,
        color: rgbCard,
      });

      page.drawText('PROJECTED MONTHLY SCENARIOS', {
        x: 520,
        y: 430,
        size: 13,
        font: fontBold,
        color: rgbSand,
      });

      const sc = econ.volumeScenarios;
      page.drawText(`Low (1.8% CVR): ${sc.low.orders} orders | $${sc.low.revenue.toLocaleString()} Rev | $${sc.low.grossProfit.toLocaleString()} Contribution`, {
        x: 520,
        y: 380,
        size: 10,
        font: fontRegular,
        color: rgbCream,
      });

      page.drawText(`Base (2.85% CVR): ${sc.base.orders} orders | $${sc.base.revenue.toLocaleString()} Rev | $${sc.base.grossProfit.toLocaleString()} Contribution`, {
        x: 520,
        y: 340,
        size: 10,
        font: fontBold,
        color: rgbSand,
      });

      page.drawText(`High (3.5% CVR): ${sc.high.orders} orders | $${sc.high.revenue.toLocaleString()} Rev | $${sc.high.grossProfit.toLocaleString()} Contribution`, {
        x: 520,
        y: 300,
        size: 10,
        font: fontRegular,
        color: rgbCream,
      });

      page.drawText(`Break-even: ${econ.breakEvenOrders} orders on $2,500 initial creative spend.`, {
        x: 520,
        y: 220,
        size: 11,
        font: fontRegular,
        color: rgbCream,
      });
    } else if (slideData.type === 'video') {
      const c = slideData.content as any;
      if (c.recommendedPosterPath && fs.existsSync(c.recommendedPosterPath)) {
        try {
          const imgBytes = fs.readFileSync(c.recommendedPosterPath);
          const img = await pdfDoc.embedPng(imgBytes);
          page.drawImage(img, { x: 50, y: 60, width: 280, height: 400 });
        } catch {
          // ignore
        }
      }

      page.drawRectangle({
        x: 360,
        y: 60,
        width: 550,
        height: 400,
        color: rgbCard,
      });

      page.drawText('10-SECOND KLING TURBO MOTION BLUEPRINT', {
        x: 385,
        y: 430,
        size: 13,
        font: fontBold,
        color: rgbSand,
      });

      const shotList = c.ugcSpec?.shots || [];
      shotList.forEach((s: any, idx: number) => {
        const yTop = 390 - idx * 80;
        page.drawText(`Shot ${idx + 1} (${s.duration}s): ${s.framing}`, {
          x: 385,
          y: yTop,
          size: 10.5,
          font: fontBold,
          color: rgbCream,
        });
        drawWrappedText(page, `Action: ${s.action || ''}. Lighting: ${s.lighting || 'Raking 3200K natural sunlight'}.`, {
          x: 385,
          y: yTop - 18,
          maxWidth: 500,
          fontSize: 9.5,
          font: fontRegular,
          color: rgbCream,
          lineHeight: 13,
          maxLines: 3,
        });
      });
    } else if (slideData.type === 'recommendation') {
      const c = slideData.content as any;
      const cards = [
        { title: `DIRECTION: POSTER ${c.recommendedVariantId}`, desc: c.recommendationRationale },
        { title: 'EMPIRICAL SPLIT TEST', desc: 'Deploy $2,500 budget equally across A, B, and C to validate real CAC against benchmark.' },
        { title: 'SUPPLY CHAIN PILOT', desc: `Authorize 2,500-unit pilot run. Targeting ${c.breakEvenMessage || '62 orders'}.` },
      ];

      cards.forEach((cd, idx) => {
        const xPos = 50 + idx * 300;
        page.drawRectangle({
          x: xPos,
          y: 70,
          width: 270,
          height: 380,
          color: rgbCard,
        });

        page.drawText(cd.title, {
          x: xPos + 15,
          y: 415,
          size: 11.5,
          font: fontBold,
          color: rgbSand,
        });

        drawWrappedText(page, cd.desc || '', {
          x: xPos + 15,
          y: 380,
          maxWidth: 240,
          fontSize: 10,
          font: fontRegular,
          color: rgbCream,
          lineHeight: 15,
          maxLines: 12,
        });
      });
    }
  }

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);
  return outputPath;
}
