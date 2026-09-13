# Launch Room Creative Agent

## Implementation prompts and product contract

Status: implementation brief  
Date: 2026-09-13  
Primary surface: local Slack workflow through the existing CopilotKit Channels integration

The product, brand, audience, and reference product image are runtime inputs for the
future demo. Do not bake a specific product into the implementation.

For implementation review only, use this replaceable demo fixture:

    demoBrand: Stackifier
    demoProductType: moisturizer
    brandReferenceUrl: https://im8health.com/
    logoStatus: not supplied; provisional wordmark only
    watermarkStatus: not supplied; do not invent an approved watermark
    facePolicy: faceless by default
    videoMode: five-second single clip

Stackifier is a working name, not a permanent product decision. The IM8 site is
a user-supplied reference for premium, science-aware, performance-oriented
brand direction, typography cues, and voice. It is not permission to copy IM8's
logo, claims, celebrities, scientific credentials, imagery, or product design.

In the real Slack run, these values arrive in the message, attachments, or a
brand-reference URL. The demo fixture only lets us test the full flow before a
real brand is available.

This document turns the architecture decisions into an implementation plan for the hackathon demo. It is intentionally local-first and optimized for one convincing, end-to-end creative workflow.

## 1. The outcome we must demonstrate

The user posts an ugly product photo in a Slack thread and writes:

    Make this our brand and prepare it for my boss.

The agent should:

1. Understand the product and the requested brand direction.
2. Generate three distinct poster concepts for qualitative A/B comparison.
3. Put the three posters into an editable pitch deck.
4. Include market signals, commercial reasoning, and transparent economics.
5. Animate the recommended poster into a short video.
6. Export both an editable PPTX and a PDF.
7. Send the images, video, PPTX, and PDF back into the same Slack thread.
8. Continue from the thread when the user says:

       Make Poster B more retro.

The revision must use the existing context and artifact. It must not restart the research loop.

This is a creative concept test, not a claim that one poster has statistically won. The deck should label the outputs as concepts or hypotheses unless real performance data exists.

## 2. Locked decisions

### Product scope

- One flexible CreativeAgent, not separate image, video, and deck agents.
- The first-class object is a locked `ProductIdentitySpec`. Every downstream
  image, poster, video, slide, and revision must reference the same product
  identity version.
- If the user attaches a real product image and says to adapt it, preserve the
  product's form, proportions, size, closure, dispenser, material, finish,
  label placement, and physical behavior. Creative direction may change the
  scene around it, not the product itself.
- If the user supplies only a competitor page, moodboard, or reference video,
  treat it as category and style inspiration. Design a new product identity
  first; do not reproduce the reference brand, logo, label copy, or distinctive
  trade dress.
- The same pipeline must support lotion, moisturizer, serum, toner, sunscreen,
  cleanser, and related skincare form factors. Product-type behavior is a
  parameter, not a separate agent.
- If a new product's physical form is not specified, ask one concise intake
  question before creating the canonical product: “Should the moisturizer be a
  tube, pump bottle, or jar?” Do not silently choose a form that would change
  the product identity.
- Three poster variants by default: A, B, and C.
- Five-second single-clip product video by default. A fourteen-second UGC pack
  is a later mode composed from several short provider clips.
- Seven-slide pitch deck by default.
- PPTX and PDF are both required outputs.
- The deck includes economics and evidence-backed commercial signals.
- Local files and local thread state are sufficient for the hackathon.
- The product, brand, audience, logo/watermark assets, and reference assets
  arrive with the Slack request later.

### Provider choices

- Reasoning model: the existing OpenAI model adapter. Use `MODEL_PROVIDER=openai` and the configured OpenAI chat model. Do not use OpenRouter for this build.
- Image generation: OpenAI model gpt-image-2.5-flare-2026-09-08.
- Video generation: fal endpoint fal-ai/kling-video/v3/turbo/standard/image-to-video.
- Research: Exa through a dedicated unit-economics and market-signals skill, only when new research is needed.
- Slides: local JavaScript presentation generation using the installed presentation tooling.
- PDF: local PDF generation from the rendered deck.

OpenAI API access must be verified separately from Codex subscription or usage credits. fal requires a working API key and billing. Do not assume either provider is covered by Codex credits.

### Explicit non-goals

- No skill marketplace.
- No arbitrary terminal or shell access.
- No Higgsfield CLI dependency.
- No sandboxed worker.
- No Ambiguous dependency on the critical path.
- No production database, queue, object store, or multi-tenant system.
- No automatic deterministic or sample-output fallback.
- No Exa cache.
- No automatic second research loop for a visual or wording revision.
- No statistical A/B performance claim without real experiment data.

### Failure behavior

If the LLM is unavailable, return exactly a clear availability message such as:

    The agent is currently unavailable because the language model is down. Please retry shortly.

Do not generate a fake deck, sample image, deterministic substitute, or mock result.

If OpenAI, fal, or Exa fails, report the provider failure clearly. Do not silently substitute another provider.

## 3. Architecture

    Slack
      |
      v
    CopilotKit Channels
      |  thread identity, subscription, progress, file delivery
      v
      CreativeAgent
      |  one agent loop with local skill guidance
      |
      +--> product_identity_lock
      |       |
      |       +--> ProductIdentitySpec + canonical product master
      |
      +--> asset_pack_director
      |       |
      |       +--> packshot, catalog, lifestyle, texture, posters
      |
      +--> poster_ab_test
      |       |
      |       +--> OpenAI image adapter
      |
      +--> commercial_signals
      |       |
      |       +--> Exa, only on explicit or necessary new research
      |
      +--> unit_economics_research
      |       |
      |       +--> Exa + live pricing / operator / category sources
      |
      +--> fal_video
      |       |
      |       +--> Kling Turbo image-to-video
      |
      +--> launch_pitch_deck
      |       |
      |       +--> editable PPTX
      |       +--> rendered slide previews
      |       +--> PDF
      |
      +--> artifact_publisher
              |
              +--> Slack thread files

    Local workspace
      .data/runs/<run-id>/
        thread.json
        product-spec.json
        product-master.png
        assets/
        poster-A.png
        poster-B.png
        poster-C.png
        video.mp4
        pitch-deck.pptx
        pitch-deck.pdf
        manifest.json

### CopilotKit's role

CopilotKit owns the conversation surface:

- managed Slack delivery
- thread identity and subscription
- agent invocation
- progress messages
- native Slack components where useful
- file posting through the thread

The existing Slack implementation already subscribes a thread after the first mention so later replies can continue the same conversation. Preserve that behavior.

The existing CopilotKit Channels path requires the configured Channel Code and Intelligence API key. If that managed Slack path cannot run with the available credentials, stop and decide whether to obtain access or replace only the transport with a direct Slack adapter. Do not build both paths during the hackathon.

### Ambiguous AI's role

Ambiguous is optional and out of the critical path.

If access becomes available later, Ambiguous can mirror or store:

- an editable shared document
- a collaborative slide record
- a Drive artifact

The local PPTX/PDF files remain the source of truth for the demo. Do not call Ambiguous to create the deck unless the local path has already passed the demo.

## 4. Runtime flow and state rules

The flexible agent follows a thin harness and fat skills pattern:

    Slack message + attachments
        -> resolve thread/run state
        -> classify adapt-existing vs design-new-from-reference
        -> create or load ProductIdentitySpec
        -> create or load canonical product master
        -> run only the skills needed by the request
        -> write derived artifacts with lineage
        -> build PPTX and matching PDF when requested
        -> upload artifacts to the same Slack thread

The harness owns thread identity, permissions, provider calls, artifact IDs,
local persistence, and delivery. Skills own product identity, form-factor
behavior, research, poster concepts, UGC shot planning, deck quality, and
provider-specific prompts.

### Revision routing

- “Make it more retro,” “change the background,” or “rewrite the headline”
  resolves an existing artifact and runs only the affected creative skill.
- “Change the bottle to a jar,” “make this a sunscreen,” or a new product image
  creates a new product identity version and invalidates dependent assets.
- “Update the economics” refreshes the economics skill only when commercial
  inputs changed or the user explicitly requests fresh research.
- “Create a new deck” can reuse the latest valid asset pack without rerunning
  product generation or Exa.

### Thread editing and iteration contract

The Slack thread is the working document. After the first mention, the channel
must remain subscribed so the user can reply without mentioning the agent again.
Every later message is interpreted against the current `ThreadState`, including
attachments and references such as “this,” “Poster B,” “the hero image,” or
“the version from two messages ago.”

The user can revise in-thread:

- brand name, audience, tone, logo, watermark, or approved copy;
- product form factor, when explicitly changing the product identity;
- one poster, image treatment, headline, crop, or background;
- the UGC shot plan or five-second video treatment;
- economics inputs or the recommendation;
- the deck or PDF without regenerating unrelated assets.

Each revision must:

1. resolve the target artifact or field from thread state;
2. reuse the latest valid ProductIdentitySpec and parent artifacts;
3. run only the skills affected by the edit;
4. create a new artifact revision with `parentArtifactId`;
5. preserve earlier versions for comparison and rollback;
6. post a concise change summary and the new file back into the same thread.

If the edit changes physical packaging—such as tube to pump bottle or jar—ask
for confirmation when the user has not been explicit, create a new product
identity version, and mark dependent assets stale. A simple style edit must not
trigger a new product render, economics research, or Exa call.

There is no deterministic or sample-output fallback. If the LLM is down, say so
clearly. If a required provider fails, report that provider failure and preserve
the previous valid artifacts.

## 5. Economics research skill

Create a local project skill named `unit_economics_research`. It owns the research
needed to make the economics slide useful without pretending that generic numbers
are the product's actual costs.

### Inputs

    product description or image-derived category
    target brand and audience, when supplied
    target geography
    channel: DTC, wholesale, retail, marketplace, or mixed
    pack size, weight, and dimensions when known
    known price, COGS, supplier quote, or fulfilment quote

If geography or channel is absent, use US DTC as a clearly labeled planning default
for the demo. Do not interrupt a creative run for missing inputs that research can
reasonably estimate.

### Research behavior

1. Infer the product category from the brief and attached image.
2. Search Exa for current competitor and retailer price bands in the target market.
3. Search manufacturer, co-packer, packaging, or category sources for COGS ranges.
4. Search 3PL and carrier sources for fulfilment drivers. Prefer a quote or a
   weight/zone-based model over a flat invented number.
5. Use the payment provider's current official pricing for transaction fees.
6. Model expected volume from traffic, conversion, average order value, units per
   order, and repeat purchase assumptions. Do not invent one magical sales number.
7. Return low, base, and high scenarios with confidence and source links.
8. Mark every number as `observed`, `inferred`, `assumption`, or `user-supplied`.

Do not cache Exa results. Do not research again for a simple creative revision.
Refresh economics only when the product, geography, channel, or commercial brief
changes, or when the user explicitly asks for an update.

### Output contract

    EconomicsResearch
      productCategory
      geography
      channel
      priceRange
      selectedPrice
      cogsRange
      selectedCogs
      packagingCost
      fulfilmentCost
      paymentFee
      channelFees
      returnsAllowance
      trafficAssumption
      conversionRateAssumption
      unitsPerOrder
      volumeScenarios
      grossProfitPerUnit
      grossMargin
      contributionPerOrder
      breakEvenOrders
      sources[]
      confidence
      evidenceLabels[]

### Research anchors already found

These are research anchors for the skill, not hard-coded product defaults:

- [Stripe pricing](https://stripe.com/pricing) currently lists 2.9% + $0.30
  per successful domestic card transaction on standard pricing.
- [Shopify's 2026 ecommerce benchmarks](https://www.shopify.com/blog/ecommerce-conversion-rate)
  lists consumer goods at 2.85% and food and beverage at 6.22% in its cited
  twelve-month category data. The skill should use the product category, not a
  blended global average.
- [ShipBob's fulfilment pricing guidance](https://www.shipbob.com/pricing/)
  says fulfilment quotes vary with weight, dimensions, destination, service, and
  volume. This is why the skill should request or model those drivers.
- [Eightx's beverage unit economics analysis](https://eightx.co/blog/beverage-brand-unit-economics)
  gives directional beverage planning ranges, including 45% to 55% gross margin
  and illustrative packaging costs. Treat these as operator estimates, not facts
  about the user's product.

Expected volume should be calculated rather than asserted:

    orders = qualified sessions * conversion rate
    units = orders * units per order
    revenue = orders * average order value
    contribution per order = revenue - COGS - fulfilment - payment fee - channel fees - returns allowance

For a product with no traffic plan, show the scenario formula and a break-even
threshold instead of pretending to know demand.

## 6. Product identity and asset lineage

The agent must distinguish a product reference from a product specification.
The Skin1004 page, supplied images, and the local UGC clip are references for
form factor, lighting, pacing, and shot grammar only. They are not the user's
brand or product to copy.

### Two intake modes

`adapt_existing_product`

- A supplied product photo, CAD render, or approved product image is the
  canonical source.
- Preserve silhouette, proportions, dimensions, net volume, cap or dispenser,
  container material, finish, color, label geometry, logo placement, printed
  text, and visible formula behavior.
- Do not silently turn a tube into a jar, change a 30 ml pack into a 75 ml
  pack, swap a flip-top for a dropper, or invent a different liquid or cream.

`design_new_product_from_reference`

- A URL, competitor page, moodboard, or reference video supplies category,
  audience cues, and visual direction only.
- First create a `ProductIdentitySpec`, then generate one canonical product
  master image/render for approval, then derive all other assets from it.
- Never reproduce a reference brand name, logo, label copy, ingredient claim,
  or distinctive trade dress. Use the user's brand and approved copy; when no
  brand is supplied, use a clearly marked provisional text-only wordmark.

When the mode is ambiguous, infer from the user's language: “make this exact
product ours” means adapt; “make a product like this” with only a reference
means design new. Ask only when the ambiguity would change the physical product.

### BrandContext is a runtime input

Brand identity is separate from product identity. Slack can provide it as text,
an uploaded logo, a watermark file, a website, or a combination:

    BrandContext
      brandName
      logoAsset: supplied | provisional | none
      watermarkAsset: supplied | provisional | none
      referenceUrls[]
      paletteAndTypographyCues
      toneOfVoice
      approvedClaims[]
      prohibitedClaims[]
      audience
      usageRightsAndNotes

The agent may extract direction from a reference site—such as an elevated,
science-aware, performance-oriented tone—but must not present a reference
company's logo, credentials, celebrity association, or claims as the user's.
If no logo or watermark is supplied, the demo may use a visibly provisional
text-only wordmark; it must not be described as approved.

### ProductIdentitySpec

    ProductIdentitySpec
      productIdentityVersion
      intakeMode: adapt_existing_product | design_new_product_from_reference
      productType: lotion | moisturizer | serum | toner | sunscreen | cleanser | other
      formFactor: tube | pump_bottle | jar | dropper_bottle | mist_bottle | other
      silhouetteAndProportions
      dimensionsAndNetVolume
      capClosureOrDispenser
      containerMaterialAndFinish
      bodyColorAndFormulaColor
      labelLayoutAndApprovedCopy
      logoTreatment
      textureAndViscosity
      physicalUsageBehavior
      allowedCreativeChanges
      forbiddenProductChanges
      sourceAssets[]
      assumptions[]
      confidence

`allowedCreativeChanges` can include scene, background, camera angle, lighting,
prop styling, model or hand presence, crop, color grade, headline treatment,
and poster hypothesis. `forbiddenProductChanges` always wins over the creative
treatment.

### Form-factor behavior rules

| Product type | Preserve / depict | Do not invent |
|---|---|---|
| Lotion or cream | pump or squeeze action; spreadable cream or gel texture | watery serum pour, impossible nozzle, or detached liquid |
| Moisturizer | jar, pump, or tube geometry; cream or gel application | a different container or a texture inconsistent with the spec |
| Serum | dropper or approved pump; cohesive droplet and realistic flow | thick cream extrusion or a random dropper cap |
| Toner | pour, pump, or mist behavior approved in the spec; watery liquid | gel-like beads or a squeeze-tube action unless specified |
| Sunscreen | tube or pump; cream/lotion application and cosmetic finish | unapproved SPF, medical, or treatment claims |

Claims must come from user-approved copy or a current, attributable source.
The agent must not copy a competitor's claims or infer medical efficacy from a
reference image.

### Canonical asset sequence

    user brief + reference assets
        -> ProductIdentitySpec
        -> canonical product master image/render
        -> derived asset pack
             1. isolated white-background hero / packshot
             2. catalog angles and detail crops
             3. brand/lifestyle photography
             4. model or hand application, faceless by default
             5. texture / ingredient / usage macro
             6. poster A/B/C variants
             7. UGC short video
             8. boss-facing PPTX and PDF

Every derived artifact records `productIdentityVersion` and
`sourceProductArtifactId`. A downstream result that changes the product's
geometry, label, closure, size, or material is invalid and must be regenerated.

### Same product, multiple creative variations

The default request is not to invent several moisturizers. It is to create one
main moisturizer product and show several ways to market that same product.
Poster A/B/C, packshot, catalog, lifestyle, and UGC variations may change:

- composition and crop;
- background, props, palette, and lighting;
- headline, layout, and audience emphasis;
- model presence, hand pose, and application context;
- editorial, clinical, retro, or creator-style treatment.

They may not change the base product's silhouette, size, cap or dispenser,
material, label, logo treatment, or moisturizer texture unless the user
explicitly requests a new product identity version.

### Prompt separation

Do not put the whole creative brief into one undifferentiated prompt. Compose
each provider request from five blocks:

1. `ProductSpec` — immutable physical identity and approved copy.
2. `CreativeTreatment` — mood, palette, lighting, environment, and audience.
3. `ShotPlan` — framing, action, camera motion, duration, and composition.
4. `NegativeConstraints` — product drift, bad text, impossible physics, artifacts.
5. `ClaimsPolicy` — allowed claims, prohibited claims, and required attribution.

This lets a user say “make it more retro” or “use a warmer background” without
restarting product design, economics, or unrelated assets.

### Reusable visual treatment profiles

Use these as named treatments applied to the locked product, not as new product
prompts:

- `ecommerce_packshot`: pure white or approved neutral background, subtle
  contact shadow, soft strip-light definition, readable label, clean edges, and
  no altered cap or silhouette.
- `clean_beauty_portrait`: optional model or faceless hand, eye-level crop,
  soft beauty lighting, natural skin texture, and the product held close enough
  for the label and nearest eye to stay legible.
- `warm_editorial_flatlay`: top-down or diagonal composition, warm wood or
  tactile surface, hard raking sunlight, crisp cast shadows, and minimal
  cleanup that preserves material authenticity.
- `macro_tactile_ugc`: vertical 9:16, close dispensing or application action,
  warm directional light with restrained cool fill, shallow depth of field,
  real skin pores, and product-specific texture physics.

Lens, ISO, f-stop, and Kelvin values are creative intent rather than hard
provider requirements. Prefer semantic cues such as “macro,” “shallow depth of
field,” “warm hard light,” and “soft studio fill” unless the provider explicitly
supports camera metadata. This avoids technically detailed prompts that cause
the model to sacrifice product accuracy.

## 7. Artifact and thread contracts

Every generated output must receive an artifact ID and remain linked to its parent.

    Artifact
      id
      runId
      threadId
      kind: product_master | packshot | catalog | lifestyle | texture | poster | video | pptx | pdf
      variantId: A | B | C | null
      localPath
      parentArtifactId
      sourceProductArtifactId
      productIdentityVersion
      prompt
      provider
      providerModel
      createdAt
      status

Poster variants should also record:

    PosterVariant
      variantId
      conceptName
      hypothesis
      audience
      visualDirection
      headline
      imageArtifactId

Thread state must at minimum track:

    ThreadState
      threadId
      brandContext
      currentBrief
      productIdentitySpec
      productIdentityVersion
      assetPack
      posterVariants
      recommendedVariantId
      latestArtifactId
      artifactHistory

Persist `ThreadState` under the local run/thread store; do not rely only on the
LLM transcript to remember product geometry or artifact parents. The transcript
is conversational context, while the structured state is the source of truth
for revisions and stale-asset checks.

When the user says “this”, “Poster B”, or “make it more retro”, resolve the referenced artifact from this state. Ask a concise clarification if multiple artifacts are equally plausible.

## 8. The slide deck contract

The default deck has seven slides.

The supplied `Brown and White Modern Skincare Presentation.pptx` is a visual
template, not product content. The implementation inspected all fifteen slides:
it is 16:9, image-led, warm brown and cream, and uses Aileron/Aileron Bold for
body and navigation with League Spartan for oversized headlines. Its repeated
top navigation, thin rules, slide-number pill, footer, full-bleed photography,
and image mosaics should be reused while replacing all placeholder copy and
images. The output remains seven slides by default; the fifteen-slide file is
the visual language, not a required slide count.

### Slide 1: Executive concept

Show the product concept, the recommended direction, and the decision requested from the boss.

### Slide 2: Canonical product identity and asset system

Show the approved `ProductIdentitySpec` and the canonical product master. Make
the product lock visible: product type, form factor, volume, closure, material,
texture, label treatment, and the rules that all derived images must obey.
Use a small contact sheet or image strip to preview the intended packshot,
catalog, lifestyle, texture, and application treatments.

### Slide 3: Customer and market signals

Use a clean evidence table:

    Signal | Evidence/source | Commercial implication

Possible signals include:

- customer language from reviews
- competitor visual positioning
- price bands
- search demand or recurring language
- channel or distribution cues
- unmet needs visible in public sources

Every external claim needs a source in speaker notes or a visible source footer. Exa results are evidence, not proof of causality.

### Slide 4: Poster A/B/C comparison

Place the three generated posters side by side. Each needs:

- variant label
- concept name
- one-line hypothesis
- short audience description

The same source product may appear in all three posters because comparison is the point.

### Slide 5: Economics

Show transparent assumptions, not invented certainty:

    Retail price
    Product COGS
    Packaging cost
    Fulfilment and payment fees
    Traffic, conversion rate, AOV, and expected volume scenarios
    Returns or refund allowance
    Gross profit per unit
    Gross margin
    Channel economics
    Creative generation cost

Core formulas:

    Gross profit per unit = selling price - variable unit costs
    Gross margin = gross profit per unit / selling price
    Creative cost = image calls + video seconds + model/search usage

Unknown values must be labeled as assumptions or left blank for the user.

### Why this may sell

Connect the evidence to the commercial hypothesis:

    Signal -> customer interpretation -> reason to believe -> test

Do not write generic claims such as “the market is ready” without evidence.

### Slide 6: Launch video

Show the selected poster, video thumbnail, shot description, and a link or QR code to the MP4. Slack should receive the actual video file separately.

### Slide 7: Recommendation and next test

State:

- recommended creative direction
- why it fits the supplied brand brief
- what must be tested in the market
- the next concrete action

## 9. Slide quality skill

Create a local project skill named launch_pitch_deck. It must behave as a creative director, copy editor, commercial analyst, and layout reviewer.

The skill must:

1. Establish the audience and decision before writing slides.
2. Give every slide one clear job.
3. Use direct titles that name the actual subject or supported finding.
4. Remove vague, flowery, repetitive, and AI-generated language.
5. Keep economics, evidence, and assumptions visibly distinct.
6. Use the generated product images as meaningful evidence.
7. Keep required tables, diagrams, and charts editable.
8. Avoid dense card grids and dashboard-like layouts.
9. Preserve strong aspect ratios and avoid bad crops.
10. Keep the canonical product visually consistent across every slide and
    reject a product-drifting image rather than hiding it with layout.
11. Render every slide before delivery.
12. Check overflow, contrast, typography, spacing, crop quality, and narrative
    order against the supplied template.
13. Produce an editable PPTX and a visually matching PDF.
14. In revision mode, change only the requested slide or artifact.
15. Do not run Exa for a simple image, copy, or style revision.

The current presentation guidance requires JavaScript ES modules and @oai/artifact-tool for local PPTX creation. Do not use python-pptx.

## 10. PPTX and PDF implementation

Use one DeckSpec as the source for both outputs.

    DeckSpec
      |
      +--> @oai/artifact-tool --> editable pitch-deck.pptx
      |
      +--> artifact-tool render --> high-resolution slide PNGs
                                      |
                                      +--> local PDF library --> pitch-deck.pdf

The PDF is a delivery copy. The PPTX is the editable source.

Use the presentation skill's artifact-tool renderer for slide previews and visual inspection. Use a local JavaScript PDF library, with pdf-lib as the default if it is available in the workspace, to place each rendered 16:9 slide image on a matching PDF page. Do not require LibreOffice or a CLI converter for the hackathon path.

For Slack delivery:

- upload the three poster images
- upload the MP4
- upload the PPTX
- upload the PDF
- include a short summary and the recommended variant

Verify the Slack app has the file-upload permission required by the current Channels adapter.

If a PowerPoint template or reference is available, use it. The implementation
must inspect its slide dimensions, masters, fonts, colors, spacing, image crops,
and repeated footer elements before creating the DeckSpec. Reuse the template's
structure and visual language while keeping the generated objects editable.

For the current skincare template, prefer:

- warm brown background blocks with cream or white type;
- oversized, short headlines rather than paragraph-heavy slides;
- full-bleed product or lifestyle imagery and restrained image mosaics;
- the existing top navigation, thin horizontal rules, slide-number pill, and
  footer rhythm where they support the story;
- Aileron for body/navigation and League Spartan for display headlines;
- native editable text, tables, source notes, and economic formulas in the PPTX;
- the same slide dimensions and intentional image crops in the PDF.

## 11. Agent skills roadmap

These are the skills to create as local project skills. The first group is needed
for the hackathon path; the rest can follow after the demo works.

### Build for the hackathon

| Skill | Job |
|---|---|
| `creative_brief_intake` | Turn a Slack message, product image, brand context, audience, and boss-facing goal into a structured brief. |
| `brand_direction_extractor` | Read a supplied brand site or reference and extract typography cues, palette, voice, imagery, and usage rules without copying identity or claims. |
| `product_identity_lock` | Resolve adapt-versus-design-new mode, create `ProductIdentitySpec`, generate the canonical product master, and reject product drift. |
| `skincare_form_factor_adapter` | Apply realistic geometry, texture, dispensing, application, and claim constraints for lotion, moisturizer, serum, toner, and sunscreen. |
| `asset_pack_director` | Derive packshot, catalog, lifestyle, texture, application, poster, and video inputs from one product identity. |
| `poster_ab_test` | Generate distinct A/B/C poster hypotheses, preserve product identity, and record variant lineage. |
| `unit_economics_research` | Research current price, COGS, packaging, fulfilment, fees, and volume assumptions with sources and confidence. |
| `market_signals` | Find current customer, competitor, pricing, and channel signals through Exa without caching or over-researching. |
| `ugc_shot_planner` | Convert a reference clip and product spec into a reusable vertical UGC shot plan without copying the reference brand. |
| `claims_and_cosmetic_safety` | Keep ingredient, efficacy, SPF, and treatment language within approved or sourced claims. |
| `launch_pitch_deck` | Act as creative director, copy editor, commercial analyst, and visual QA reviewer for the editable deck. |
| `pptx_template_following` | Inspect a supplied PPTX, reuse its visual system, and compare rendered output against the reference. |
| `pdf_export_qa` | Render the editable deck and create a matching PDF with page-count, crop, font, and integrity checks. |
| `fal_kling_video` | Turn the selected poster into the short Kling Turbo video through the fal API. |
| `artifact_lineage` | Track parent artifacts, provider/model metadata, local paths, and revision history. |
| `slack_artifact_publisher` | Post summaries and upload images, MP4, PPTX, and PDF to the same Slack thread. |
| `thread_revision` | Resolve “this,” “Poster B,” or style changes from thread state and avoid unrelated regeneration or research. |

### Create later

| Skill | Why it can wait |
|---|---|
| `brand_kit_builder` | Extract reusable colors, type, logo treatment, packaging rules, and tone from a real brand. |
| `reference_video_analyzer` | Extract shot grammar, pacing, lighting, and overlay conventions from an uploaded reference video. |
| `video_storyboard` | Expand one short clip into shot lists, timing, camera motion, captions, and multiple aspect ratios. |
| `multi_clip_assembler` | Render a fourteen-second UGC sequence from several provider clips with local cuts, captions, and audio. |
| `channel_economics` | Add separate DTC, wholesale, retail, marketplace, and subscription contribution models. |
| `experiment_planner` | Convert creative hypotheses into real test plans, tracking events, sample sizes, and readouts. |
| `asset_variant_manager` | Generate more than three variants, deduplicate assets, and compare creative dimensions systematically. |
| `external_skill_reader` | Read approved third-party skill references, including future Higgsfield guidance, without adding a marketplace or CLI dependency. |
| `approval_and_publishing` | Add human checkpoints for public publishing, paid media, customer sends, and other consequential actions. |
| `shared_artifact_store` | Move from local `.data/runs` to durable storage only when public deployment requires it. |

Do not create a skill marketplace, terminal-access skill, or sandbox-worker layer
for this demo. They are product-surface decisions, not prerequisites for winning
the hackathon.

## 12. Provider tool prompts

### Master implementation prompt

    You are implementing the Launch Room CreativeAgent in the existing launch-room repository.

    Read launch-room/AGENTS.md and the relevant app README before editing.
    Preserve the existing CopilotKit Channels behavior and thread subscription flow.
    Build the local-first creative workflow described in
    launch-room/dev-docs/implementation-prompts.md.

    Implement one flexible agent with typed tools for:
    poster A/B/C generation, on-demand market and unit-economics research,
    Kling video generation,
    local PPTX/PDF generation, and Slack artifact publishing.

    Do not use OpenRouter. Do not add a skill marketplace, terminal access, CLI dependency,
    sandbox worker, Ambiguous dependency, production database, or deterministic
    fallback. If the LLM is unavailable, say that the LLM is down.

    Use gpt-image-2.5-flare-2026-09-08 for images and
    fal-ai/kling-video/v3/turbo/standard/image-to-video for video.

    Before editing, inspect the current implementation and report the files
    that must change. Then implement in small phases and run typecheck and the
    repository verification commands after each phase.

### Product identity prompt

    Resolve the intake mode from the user's language and references.

    If an approved product image is being adapted, treat it as canonical and
    preserve its geometry, proportions, volume, closure, material, finish,
    label layout, printed text, and formula behavior exactly.

    If the user supplied only a URL, competitor page, moodboard, or reference
    video, use it for category and style cues only. Do not reproduce its brand,
    logo, label copy, claims, or distinctive trade dress.

    Produce a ProductIdentitySpec for the selected product type and form factor.
    State assumptions and unresolved fields. Create one canonical product
    master image before requesting derived scenes. Reject any downstream asset
    that changes the product identity.

### Asset pack prompt

    Starting from the locked ProductIdentitySpec and canonical product master,
    create a coherent asset pack: isolated white-background packshot, catalog
    detail, warm lifestyle/brand photograph, model-or-hand application shot,
    texture or ingredient macro, three poster hypotheses, and one video input.

    Keep ProductSpec immutable. Change only CreativeTreatment and ShotPlan
    between assets. The reference images define visual direction, not the
    product to copy. Preserve the same silhouette, closure, label, scale,
    material, and product behavior everywhere.

### Poster A/B/C prompt

    Create three materially different poster concepts from the canonical product
    master and brand brief.

    Keep the product identity exactly consistent across variants. Change only
    the creative hypothesis, composition, visual language, headline treatment,
    and audience emphasis. Do not alter the product's form, label, volume,
    closure, material, or formula behavior.

    Return structured data for each variant:
    variantId, conceptName, hypothesis, audience, visualDirection, headline,
    prompt, and imageArtifactId.

    Generate each image with the pinned OpenAI Flare model. Do not claim that
    any variant has won a real market test. Label the outputs as creative concepts.

### Commercial signals prompt

    Research only when the user requests new market context, the brief changes,
    or the economics need fresh inputs.

    Use Exa for fresh, inspectable sources. Do not cache Exa results.
    Separate observed evidence from inference and assumptions.

    Return signal, source URL, concise evidence, commercial implication, and
    confidence. Route price, COGS, fulfilment, fees, and volume calculations to
    unit_economics_research.

    Do not fabricate demand, pricing, conversion, competitor, or margin data.

### Economics prompt

    Use the unit_economics_research skill to gather current inputs for the
    product category, geography, and channel. Prefer observed sources or
    user-supplied quotes. Use low/base/high scenarios when no exact quote exists.

    Calculate gross profit, gross margin, contribution per order, and break-even
    orders. Label each field as observed, inferred, assumption, or user-supplied.
    Include creative production cost using actual provider rates where known.
    Never present an illustrative estimate as the user's actual cost.

### Video prompt

    Take the canonical product master or recommended poster artifact as the
    starting image. The product identity block is immutable.

    Analyze any uploaded reference UGC video for shot grammar only: vertical
    macro framing, squeeze or dispensing action, tactile texture, warm hard
    light, handheld product reveal, concise overlay language, and a clean final
    product moment. Do not copy its brand, logo, product, or unsupported claims.

    Generate one five-second product-focused clip through:
    fal-ai/kling-video/v3/turbo/standard/image-to-video.

    Compose the request from ProductSpec, CreativeTreatment, ShotPlan,
    NegativeConstraints, and ClaimsPolicy. Match the dispensing and texture
    physics to the product type: cream or gel for lotion/moisturizer, cohesive
    droplet for serum, watery pour or mist for toner, and approved
    cream/lotion behavior for sunscreen.

    The fourteen-second reference-style UGC mode is not one giant prompt. Split
    it into several short clips—hook or application, product hero, texture or
    benefit detail, and final product/CTA—then assemble them locally. Only add
    that mode when the multi-clip assembler exists.

    Return the provider request ID, output URL, local artifact path, product
    identity version, and status. Do not use a CLI. Do not silently switch
    video providers.

### UGC storyboard contract

    UGCSpec
      durationMode: five_second_single_clip | fourteen_second_multi_clip
      aspectRatio: 9:16
      audio: none | native_provider_audio | added_later
      referenceVideoId
      productIdentityVersion
      shots[]
        duration
        framing
        action
        cameraMotion
        texturePhysics
        lighting
        overlayCopy
        transition
      claimsPolicy
      negativeConstraints

For the current reference style, a valid shot plan can be:

1. Close macro hook: product dispenses a physically correct amount onto a
   fingertip or hand, with natural skin texture and no floating gel.
2. Handheld hero: the same product rotates into warm directional light, with
   the label readable and the background softly out of focus.
3. Texture/detail: show the formula or application behavior appropriate to the
   product type; use only approved benefit language.
4. Clean final frame: product and one concise call to action, with no fake
   watermark or competitor handle.

The user-supplied 14-second prompt is a creative reference for this structure.
Do not send all four shots as one image-to-video prompt; each shot needs its own
source frame and artifact lineage.

### Deck and PDF prompt

    Create the seven-slide DeckSpec defined in this document.

    Use the canonical product identity, asset-pack previews, A/B/C poster set,
    selected video thumbnail, commercial signals, economics, assumptions, and
    recommendation. Use the supplied Brown and White Modern Skincare deck as a
    visual template only: preserve its 16:9 proportions, warm brown/cream
    palette, editorial image-led layouts, typography hierarchy, top navigation,
    rules, slide-number pill, and footer rhythm, while replacing all content.

    The seven-slide narrative is: executive concept; canonical product and
    asset system; signals; poster comparison; economics plus why it may sell;
    launch video; recommendation and next test.

    Keep the deck editable. Use one composition per slide, readable type,
    direct titles, native tables for economics, and source notes for researched
    claims. Render and inspect the PPTX before creating the PDF.

    Return PPTX path, PDF path, slide preview paths, and a validation summary.

### Revision prompt

    Treat this as a revision to the existing thread artifact.

    Identify the referenced variant or slide from thread state. Reuse existing
    brand context, ProductIdentitySpec, and assets. A request such as “make it
    more retro,” “use a warmer background,” or “change the headline” changes
    CreativeTreatment only; it must not change product geometry or restart
    product design. Do not run Exa unless the user explicitly asks for new
    research. Do not regenerate unrelated posters, video clips, or slides.

    Create a new artifact revision with parentArtifactId set to the previous
    artifact. Update only the affected slide or output.

## 13. Environment configuration

    MODEL_PROVIDER=openai
    OPENAI_API_KEY=...
    MODEL=gpt-5.6-sol

    OPENAI_IMAGE_MODEL=gpt-image-2.5-flare-2026-09-08
    EXA_API_KEY=...
    FAL_KEY=...

    CHANNEL_CODE=...
    INTELLIGENCE_API_KEY=...

    # Optional only. Do not require for the demo.
    AMBIGUOUS_API_KEY=...

Keep all keys server-side. Never put provider keys in browser code, Slack messages, generated decks, or source control.

## 14. Current integration check

Checked locally on 2026-09-13:

- The root `.env` contains non-placeholder values for the OpenAI key, model,
  Channel Code, Exa key, and CopilotKit Intelligence key alias.
- `npm run channel:status` authenticated against the CopilotKit project and
  reported Slack as `attached` for Channel `launch-2027`.
- A fresh runtime smoke start with `PORT=3001 npm run dev:slack` reported
  `Channel "launch-2027" online`.
- Port 3000 was already occupied by an existing channel runtime. It was not
  stopped or modified.
- The installed Channels core exposes `Thread.postFile()`, and the installed
  Slack adapter implements it with Slack `files.uploadV2`.
- The current Slack app manifest exposes the file permissions needed by the
  adapter: `files:read` and `files:write`. A real Slack smoke test still needs
  to upload a small PNG or PDF after the artifact publisher exists; permissions
  being present does not prove that the end-to-end upload path works.
- The status command warned that no explicit Intelligence gateway WebSocket URL
  is set. The fresh runtime still came online using the hosted configuration,
  but set the WebSocket URL explicitly if the warning turns into a timeout.

### Gap audit

Green now:

- TypeScript checks pass.
- The existing test suite passes.
- CopilotKit Channels already subscribes a thread on first mention and routes
  later unmentioned replies through `onMessage`.
- Native progress cards, thread history, Exa source delivery, and Slack file
  permissions are represented in the starter.

Still required for the creative demo:

- Replace the starter incident tools with the CreativeAgent tools for intake,
  product identity, image generation, posters, Kling video, deck/PDF, and
  artifact publishing.
- Persist structured `ThreadState` and artifact lineage locally so revisions
  are real edits rather than fresh generic prompts.
- Implement the tube/pump/jar intake question and the product identity lock.
- Pin the OpenAI image model to the selected model and add the fal video call.
- Build the editable PPTX/PDF pipeline and render/inspect it before delivery.
- Upload the actual generated PNG, MP4, PPTX, and PDF into the same Slack thread.
- Add an end-to-end Slack smoke test for first run, “make Poster B more retro,”
  form-factor change, and economics-only refresh.
- Remove the unused OpenRouter auto-selection path if the no-OpenRouter decision
  remains final; current resolver tests still cover it.

The current browser Creative Studio is a useful visual prototype, but it still
returns a sample pack or one hero image plus drafted concepts. It is not yet the
production of record for the Slack hackathon workflow.

## 15. Acceptance criteria

The implementation is ready for the demo when all of the following work:

Before the poster run, the agent must create a `ProductIdentitySpec` and
canonical product master. All packshots, lifestyle images, posters, and video
must preserve that identity and record artifact lineage. Unsupported cosmetic,
SPF, or medical claims must not be invented.

Thread iteration is a release gate: a user must be able to reply in the same
Slack thread without another mention, change one creative field, receive a new
artifact revision, and see that unrelated artifacts and research were reused.

1. A Slack mention with an attached image starts a creative run.
2. The agent generates three labeled poster variants.
3. The posters appear in the same Slack thread.
4. A deck contains all three posters.
5. The deck contains signals, economics, assumptions, and recommendation.
6. A five-second Kling Turbo video is generated from the selected poster.
7. The deck includes a video thumbnail/link.
8. Both PPTX and PDF are created locally.
9. Slack receives the PPTX, PDF, images, and MP4.
10. “Make Poster B more retro” changes only Poster B and the affected deck content.
11. The revision does not call Exa.
12. LLM failure produces an explicit LLM-down message and no fake artifact.
13. Missing economics are shown as assumptions or requested from the user.
14. The deck passes type, layout, render, and artifact integrity checks.
15. npm run typecheck and the repository verification command pass.

The revision path must also change only the referenced artifact and its creative
treatment, and must not call Exa for a simple visual or wording revision.

## 16. Demo script

Use one Slack thread:

    @launch Call the brand Stackifier. Design one moisturizer inspired by this
    reference direction: https://im8health.com/. Use the site's typography and
    voice as high-level inspiration only. Keep the product faceless and make a
    five-second video. Create the canonical moisturizer first, then the
    packshot, lifestyle photography, three variations for poster comparison,
    explain which one you recommend, research the economics and market signals,
    and prepare the deck and PDF for my boss.

This is a demo fixture. In production, the same fields are supplied by the
Slack user or collected by a short intake question. The agent should not need
the implementation document at runtime.

If the user attaches an approved product image instead, use the same command
with “adapt this exact product.” That selects `adapt_existing_product` and
locks the supplied geometry and packaging rather than redesigning it.

Then demonstrate:

    Make Poster B more retro and update the deck without doing the research again.

Then demonstrate:

    Add the supplier quote I just gave you and update the economics without
    repeating the creative research.

The final thread should show:

- three poster alternatives
- recommendation
- signals with sources
- economics with assumptions
- video
- editable PPTX
- PDF

## 17. Still vague or requiring a decision

These items have sensible defaults but are not fully specified yet:

1. Intake mode rule. Recommended: an approved attached product image means
   `adapt_existing_product`; a URL, competitor page, or moodboard means
   `design_new_product_from_reference`.
2. The real product, brand, logo, audience, approved copy, and source image for
   the recorded demo. This is intentionally deferred and arrives at runtime.
3. Behavior when no logo is supplied. Recommended: create a provisional
   text-only wordmark and label it provisional until the user approves it.
4. UGC mode. Recommended for the hackathon: one five-second Kling clip. The
   supplied 14-second-style sequence should be a later multi-clip mode because
   it requires several provider calls and local assembly.
5. Face policy. Recommended: faceless hands and product-first framing by
   default; add a model only when requested or supplied.
6. The number of poster variants. The default is three.
7. The target geography and channel for economics research. Default: US DTC,
   clearly labeled.
8. Whether the recommended poster is selected by the agent or explicitly
   chosen by the user. Default: agent recommends, user can override.
9. Whether generated video audio should be enabled. Default: no audio unless
   the clip benefits from it.
10. Which ingredient, efficacy, SPF, and treatment claims are approved. Until
    supplied or sourced, the agent must use descriptive copy rather than make
    a regulated or medical claim.
11. The Slack upload smoke test. The current manifest exposes `files:read` and
    `files:write`; the publisher still needs to prove a real PNG/PDF upload.
12. The exact local PDF package available in the workspace. Default to pdf-lib
    after checking installed dependencies.

Do not block the first implementation on production deployment, Ambiguous, marketplace design, or terminal access.
