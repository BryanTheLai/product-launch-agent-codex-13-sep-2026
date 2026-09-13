import * as fs from 'fs';
import * as path from 'path';

interface SkillDef {
  name: string;
  description: string;
  content: string;
}

const skills: SkillDef[] = [
  {
    name: 'creative-brief-intake',
    description: 'Turns a Slack message, product image, brand context, audience, and boss-facing goal into a structured brief. Handles adapt_existing_product vs design_new_product_from_reference classification.',
    content: `# Creative Brief Intake

Turn raw user messages, ugly product photos, and competitor reference URLs into an authoritative, structured creative brief.

## Purpose
Intake is the front door of the Launch Room Creative Agent. It extracts:
1. **Intake Mode**:
   - \`adapt_existing_product\`: When an image is attached, or the user says "adapt this photo", "use this bottle", or "ugly product photo". In this mode, physical geometry, materials, closure, and label layouts are locked from the image.
   - \`design_new_product_from_reference\`: When only a reference URL (e.g., \`https://im8health.com/\`), brand concept, or competitor description is provided. In this mode, visual tone is inspired by the reference without copying trademarked trade dress.
2. **Product Classification**: Infers product category (\`moisturizer\`, \`lotion\`, \`serum\`, \`toner\`, \`sunscreen\`, \`cleanser\`).
3. **Target Audience & Core Benefit**: Identifies performance skin needs and consumer reason-to-believe.
4. **Boss-Facing Objective**: Captures the concrete commercial decision required from leadership (e.g. approving a 2,500-unit pilot run and test ad spend).

## Output Contract
Produces a structured \`CreativeBriefInput\` with \`threadId\`, \`brandName\`, \`productType\`, \`rawText\`, \`referenceUrl\`, and \`attachedImageLocalPath\`.
`,
  },
  {
    name: 'brand-direction-extractor',
    description: 'Reads a supplied brand site or competitor reference and extracts typography cues, palette, voice, imagery, and usage rules without copying identity or claims.',
    content: `# Brand Direction Extractor

Extracts ambient brand cues, aesthetic palettes, typography hierarchy, and tone-of-voice from reference URLs or moodboards.

## Rules & Invariants
1. **No Trademark Infringement**: Never copy third-party brand logos, protected wordmarks, exact trade dress, or proprietary slogans.
2. **Extract Semantic Style**:
   - Palette: warm earth tones, tactile neutrals, stone hues, high-contrast black/cream accents.
   - Typography: modern geometric sans-serif for display headlines, clinical tracked sans-serif for functional descriptions.
   - Imagery: natural directional sunlight, tactile organic props, macro skin textures, clean architectural surfaces.
3. **Audience Demographics**: Extracts performance expectations (e.g., non-greasy barrier repair for active professionals).
`,
  },
  {
    name: 'product-identity-lock',
    description: 'Resolves adapt-versus-design-new mode, creates ProductIdentitySpec, generates the canonical product master, and rejects product drift.',
    content: `# Product Identity Lock

Locks physical packaging invariants into an immutable \`ProductIdentitySpec\` to prevent generative AI product drift across all downstream assets.

## Physical Invariants Locked
- **Silhouette & Proportions**: Explicit container diameter-to-height ratio.
- **Dimensions & Net Volume**: Calibrated volume (e.g., 50 ml / 1.7 fl. oz.).
- **Cap, Closure & Dispenser**: Explicit functional closure (amber glass jar with matte black screw lid and inner barrier seal).
- **Container Material & Finish**: Tactile finish (frosted heavy-weight glass with ceramic matte coating).
- **Formula Texture & Color**: Emulsion consistency (whipped cloud-white barrier cream with soft peaks).
- **Label Layout & Wordmark**: Exact typographic hierarchy with provisional sans-serif wordmark.

## 5-Block Prompt Standard
All downstream generation prompts compose 5 explicit blocks:
\`\`\`
1. [PRODUCT SPECIFICATION (IMMUTABLE PHYSICAL IDENTITY)]
2. [CREATIVE TREATMENT]
3. [SHOT PLAN & COMPOSITION]
4. [NEGATIVE CONSTRAINTS (STRICTLY FORBIDDEN)]
5. [CLAIMS POLICY]
\`\`\`
`,
  },
  {
    name: 'skincare-form-factor-adapter',
    description: 'Applies realistic geometry, texture, dispensing, application, and claim constraints for lotion, moisturizer, serum, toner, sunscreen, and cleanser.',
    content: `# Skincare Form Factor Adapter

Maps cosmetic formulations to physically correct packaging geometries, dispensing mechanisms, and fluid viscosities.

## Form Factor Taxonomy
1. **Moisturizer**:
   - Packaging: Cylindrical wide-mouth amber glass jar with screw lid and barrier disc.
   - Viscosity: Rich whipped cream emulsion, cohesive soft peaks, velvety melt.
2. **Lotion**:
   - Packaging: Slender cylindrical bottle with precision twist-lock lotion pump.
   - Viscosity: Smooth spreadable emulsion, semi-viscous ribbon.
3. **Serum**:
   - Packaging: Classic apothecary glass dropper bottle with graduated pipette.
   - Viscosity: Translucent viscous droplet, surface tension, controlled vertical tear.
4. **Toner**:
   - Packaging: Frosted cylindrical bottle with fine atomizing micro-mist spray nozzle.
   - Viscosity: Water-light transparent fluid, micro-droplet suspension.
5. **Sunscreen**:
   - Packaging: Flexible matte tube with flip-top cap or airless precision pump.
   - Viscosity: Sheer non-greasy lotion, zero white-cast blend.
6. **Cleanser**:
   - Packaging: Wide-bore pump dispenser bottle.
   - Viscosity: Silky gel-to-foam emulsion, delicate micro-bubbles.
`,
  },
  {
    name: 'asset-pack-director',
    description: 'Derives packshot, catalog, lifestyle, texture, application, poster, and video inputs from one locked product identity.',
    content: `# Asset Pack Director

Orchestrates the derivation of omnichannel visual assets from the canonical product master image.

## Derived Asset Roster
1. **Hero Packshot** (\`assets/packshot.png\`): Isolated container on pure white (#FFFFFF), razor-sharp label readability, subtle ground shadow.
2. **Travertine Catalog Angle** (\`assets/catalog.png\`): 45-degree three-quarter isometric perspective on polished travertine pedestal.
3. **Warm Lifestyle Photograph** (\`assets/lifestyle.png\`): Product placed in a natural cedar and stone vanity bathed in morning raking sunlight.
4. **Macro Formula Texture** (\`assets/texture.png\`): Extreme close-up of formula ribbon on raw stone tile demonstrating rich barrier melt.
5. **Poster Variations A, B, C**: 3 qualitative creative hypotheses for A/B testing.
6. **Motion Input**: 5-second video asset blueprint.

Every derived asset records \`parentArtifactId: product_master.id\` to ensure complete genealogical traceability.
`,
  },
  {
    name: 'poster-ab-test',
    description: 'Generates distinct A/B/C poster hypotheses, preserves product identity, and records variant lineage.',
    content: `# Poster A/B Test Director

Generates three materially different qualitative poster directions from the locked product master while preserving container geometry.

## Variant Directives
- **Poster A: Clinical Efficacy & Performance Science**:
  - Creative Hypothesis: Clinical authority messaging and dermatological precision convert high-intent consumers.
  - Composition: Cool architectural marble slab, pristine clinical lighting, bold tracked headline "CLINICAL BARRIER REPAIR".
- **Poster B: Warm Earth Ritual & Tactile Luxury**:
  - Creative Hypothesis: Daily self-care ritual context increases emotional connection and AOV.
  - Composition: Raw walnut timber, warm golden-hour sun flare, serif headline "DAILY HEALING RITUAL".
- **Poster C: Bold Modern & Urban Defense**:
  - Creative Hypothesis: Monolithic contrast and urban protection cues maximize paid social feed CTR.
  - Composition: Deep graphite slate, dramatic rim lighting, contemporary display headline "ACTIVE BARRIER SHIELD".
`,
  },
  {
    name: 'unit-economics-research',
    description: 'Researches current price, COGS, packaging, fulfilment, fees (Stripe 2.9% + $0.30), and volume assumptions (Shopify 2.85% CVR) with sources and confidence.',
    content: `# Unit Economics Research

Models rigorous direct-to-consumer (DTC) unit economics, transaction processing fees, fulfillment costs, and contribution margins.

## Financial Formulas & Standards
- **Stripe Domestic Card Fee**: \`Retail Price * 2.9% + $0.30\` (\$1.87 on \$54.00 item).
- **Shopify 2026 Category Benchmark**: \`2.85% CVR\` for consumer goods.
- **Packaging & Formulation Allocation**: Amber glass container + secondary box (\$3.20) + active cosmetic bulk (\$7.30) = default \$10.50 COGS.
- **3PL Fulfillment**: Sub-1lb pick, pack, and zone delivery modeled at \$5.85 (ShipBob benchmark).
- **Net Contribution Per Unit**: \`Retail Price - COGS - Fulfillment - Payment Fee - Returns Allowance\`.
- **Break-Even Volume**: \`Campaign Test Budget ($2,500) / Contribution Per Order\`.

## Evidence Categorization
Every parameter in the model must be labeled:
- \`observed\`: Verifiable real-world data (e.g. Stripe pricing page, Shopify benchmark).
- \`inferred\`: Derived through category heuristics (e.g. packaging cost breakdowns).
- \`assumption\`: Working baseline parameters (e.g. 10,000 monthly site visitors).
- \`user-supplied\`: Explicit human overrides (e.g. supplier quote of \$8.20).
`,
  },
  {
    name: 'market-signals',
    description: 'Finds current customer, competitor, pricing, and channel signals through Exa without caching or over-researching.',
    content: `# Market Signals Engine

Discovers real-time competitor pricing compression and verified consumer review pain points via Exa live web search.

## Search Methodology
1. **Competitor Price Band Query**: Queries active US DTC pricing distributions for the category to find market whitespace.
2. **Customer Friction Query**: Scans verified review datasets for recurring product complaints (e.g., greasy occlusives, pilling under makeup).
3. **Synthesis**: Produces structured commercial signals with verified source URLs, raw text excerpts, and strategic commercial implications.
4. **No Phantom URLs**: Every source URL must be an inspectable, legitimate web citation.
`,
  },
  {
    name: 'ugc-shot-planner',
    description: 'Converts a reference clip and product spec into a reusable vertical 9:16 UGC shot plan without copying the reference brand.',
    content: `# UGC Shot Planner

Designs a high-converting 5-second vertical (9:16) video blueprint optimized for Kling Turbo image-to-video execution.

## 5-Second Blueprint Architecture
- **Shot 1 (0.0s – 2.0s)**: Tight macro framing. Faceless natural hand unseals container; physically correct dispensing action matching product viscosity.
- **Shot 2 (2.0s – 5.0s)**: Ascending low-angle camera lift. Container catches golden directional light flare; label typography remains crisp and legible; clean absorption into skin.
- **Audio Mood**: Warm ambient lofi beats (default: silent provider video with native overlay copy).
- **Negative Directives**: No morphing container geometry, no floating ungrounded liquid droplets, no distorted text.
`,
  },
  {
    name: 'claims-and-cosmetic-safety',
    description: 'Keeps ingredient, efficacy, SPF, and treatment language within approved or sourced claims; rejects unapproved medical statements.',
    content: `# Claims & Cosmetic Safety Guardrails

Enforces FDA cosmetic regulatory boundaries and prevents unauthorized medical or clinical efficacy assertions.

## Regulatory Boundaries
1. **Forbidden Statements**:
   - No prescription medical claims ("cures eczema", "treats rosacea", "eliminates acne").
   - No unverified SPF numbers unless laboratory testing documentation is supplied by the user.
   - No fabricated clinical trial percentages ("98% wrinkle reduction").
2. **Approved Cosmetic Descriptions**:
   - Hydrates and softens skin texture.
   - Reinforces surface moisture barrier.
   - Formulated with nourishing botanical lipids.
   - Lightweight, non-comedogenic daily wear.
`,
  },
  {
    name: 'launch-pitch-deck',
    description: 'Acts as creative director, copy editor, commercial analyst, and visual QA reviewer for the 7-slide editable deck.',
    content: `# Launch Pitch Deck Director

Assembles the comprehensive 7-slide executive pitch deck communicating creative, visual, and commercial viability to executive leadership.

## Slide Roster & Narrative Arc
1. **Executive Concept & Decision Request**: Brand thesis, product headline, and the specific decision requested from leadership (pilot production run & test ad spend).
2. **Locked Product Specification**: Container dimensions, materials, closures, and 4-surface asset mosaic (packshot, catalog, lifestyle, texture).
3. **Commercial Signals & Market Intelligence**: 3 sourced market insights from Exa with clickable links.
4. **Aesthetic Direction Comparison**: Side-by-side presentation of Posters A, B, and C with creative hypotheses.
5. **Unit Economics & Financial Model**: Retail price, COGS, Stripe fees, 3PL fulfillment, and low/base/high monthly volume projections.
6. **5-Second Social Launch Blueprint**: Kling Turbo motion video storyboard, camera angles, and shot breakdown.
7. **Recommendation & Go-To-Market Roadmap**: The agent's recommended poster direction, supply chain pilot milestones, and ad spend allocation.
`,
  },
  {
    name: 'pptx-template-following',
    description: 'Inspects a supplied PPTX, reuses its visual system (Brown & White Modern Skincare aesthetic), and maintains editable native elements.',
    content: `# PPTX Template Following

Generates a fully native, editable Microsoft PowerPoint presentation (.pptx) adhering to modern luxury cosmetic presentation design standards.

## Design Language Specifications
- **Dimensions**: 16:9 Widescreen (10.0 x 5.625 inches).
- **Color Palette**:
  - Dark Brown Background: \`#2B1B17\`
  - Card Fill: \`#3A2823\`
  - Sand Accent: \`#D4A373\`
  - Cream Off-White Text: \`#F9F6F0\`
  - Terracotta Muted: \`#8D5B4C\`
- **Typography & Structure**:
  - Top Navigation Pill: \`0X / TITLE\` in uppercase tracked Sand.
  - Slide Counter: \`0X / 07\` aligned right.
  - Thin Rule Divider: 1pt rule across top banner.
- **Native Editable Objects**: Uses pptxgenjs native shapes, text frames, and tables so slides can be edited directly in Microsoft PowerPoint or Google Slides.
`,
  },
  {
    name: 'pdf-export-qa',
    description: 'Renders the editable deck and creates a matching PDF with page-count, crop, font, and integrity checks using pdf-lib.',
    content: `# PDF Export QA

Compiles a high-resolution, vector-crisp PDF document matching the 16:9 presentation without requiring external LibreOffice or system binaries.

## Standards & Integrity Checks
- **Page Geometry**: 960 x 540 pt (exact 16:9 aspect ratio).
- **Page Count**: Exactly 7 slides matching the PPTX master.
- **Image Embeds**: High-resolution PNG embedding with aspect-ratio preservation and centering.
- **Font Standards**: Clean StandardFonts (Helvetica / Helvetica-Bold) with verified contrast ratios against dark backgrounds.
- **File Integrity**: Magic byte validation (\`%PDF-\`) and non-empty buffer assertions.
`,
  },
  {
    name: 'fal-kling-video',
    description: 'Turns the selected poster into the short Kling Turbo video through the fal API with transparent provider status reporting.',
    content: `# fal Kling Video Integration

Renders a high-fidelity 5-second product motion video from the canonical product master using the Kling Turbo model on fal.

## Execution Directives
- **Model Endpoint**: \`fal-ai/kling-video/v3/turbo/standard/image-to-video\`.
- **Duration**: 5 seconds.
- **Aspect Ratio**: 9:16 vertical mobile video.
- **Transparent Status Reporting**:
  - When \`FAL_KEY\` is configured: Submits job, polls queue status until completed, and saves local MP4.
  - When \`FAL_KEY\` is missing: Reports status as \`failed\` with clear message ("FAL_KEY is not configured in the environment"). Never generates fake or mock video files.
`,
  },
  {
    name: 'artifact-lineage',
    description: 'Tracks parent artifacts, provider/model metadata, local paths, SHA-256 hashes, and revision history in manifest.json.',
    content: `# Artifact Lineage & Storage

Maintains immutable genealogical tracking and SHA-256 integrity verification for every creative artifact generated during a run.

## Directory Structure
\`\`\`
.data/runs/<run-id>/
├── assets/
│   ├── packshot.png
│   ├── catalog.png
│   ├── lifestyle.png
│   └── texture.png
├── product-master.png
├── poster-A.png
├── poster-B.png
├── poster-C.png
├── poster-B-rev<timestamp>.png
├── pitch-deck.pptx
├── pitch-deck.pdf
├── product-spec.json
├── thread.json
└── manifest.json
\`\`\`

## Manifest Contract
Each entry in \`manifest.json\` records:
\`id\`, \`runId\`, \`threadId\`, \`kind\`, \`variantId\`, \`localPath\`, \`parentArtifactId\`, \`sourceProductArtifactId\`, \`productIdentityVersion\`, \`prompt\`, \`provider\`, \`providerModel\`, \`createdAt\`, \`status\`.
`,
  },
  {
    name: 'slack-artifact-publisher',
    description: 'Posts summaries and uploads images, MP4, PPTX, and PDF to the same Slack thread using thread.postFile().',
    content: `# Slack Artifact Publisher

Delivers all generated launch assets directly back into the initiating Slack thread using CopilotKit Channels.

## Delivery Protocol
1. **Multi-File Thread Uploads**:
   - Calls \`thread.postFile({ bytes, filename, title, altText })\` for each visual and document artifact.
   - Uploads: Poster A, Poster B, Poster C, Kling MP4 (if enabled), \`pitch-deck.pptx\`, and \`pitch-deck.pdf\`.
2. **Concise Decision Brief**:
   - Posts a high-level summary with the recommended poster direction, rationale, and key unit economics (retail price, COGS, Stripe fees, break-even orders).
3. **Interactive Thread Continuity**:
   - Keeps the thread subscribed so users can iterate without re-mentioning the agent.
`,
  },
  {
    name: 'thread-revision',
    description: 'Resolves "this", "Poster B", or style changes from thread state and avoids unrelated regeneration or research.',
    content: `# Thread Revision Router

Enables conversational in-thread revisions with strict orthogonality and resource preservation.

## Revision Routing Logic
1. **Aesthetic Revision** (e.g., "Make Poster B more retro"):
   - Resolves target variant (\`Poster B\`).
   - Generates revised poster asset (\`poster-B-rev<timestamp>.png\`) with updated prompt while preserving locked product geometry.
   - Re-exports PPTX & PDF with the updated image.
   - **DOES NOT** re-run Exa research or regenerate Posters A and C.
2. **Commercial Revision** (e.g., "Add supplier quote of $8.20"):
   - Parses quote (\$8.20).
   - Recalculates unit economics, Stripe fees, and volume scenarios with label \`user-supplied\`.
   - Re-exports PPTX & PDF with updated slide 5.
   - **DOES NOT** regenerate any images.
3. **Form Factor Mutation** (e.g., "Change bottle to jar"):
   - Confirms user intent, creates new product identity version (v2), and regenerates the canonical product master.
`,
  },
];

const baseDir = path.resolve('.agents/skills');

for (const skill of skills) {
  const skillDir = path.join(baseDir, skill.name);
  if (!fs.existsSync(skillDir)) {
    fs.mkdirSync(skillDir, { recursive: true });
  }
  const filePath = path.join(skillDir, 'SKILL.md');
  const frontmatter = [
    '---',
    `name: ${skill.name}`,
    `description: ${skill.description}`,
    '---',
    '',
    skill.content,
  ].join('\n');

  fs.writeFileSync(filePath, frontmatter, 'utf-8');
  console.log(`Created skill: ${skill.name}`);
}

console.log(`\nAll ${skills.length} skills created successfully in ${baseDir}!`);
