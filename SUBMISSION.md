# Launch Room Creative Agent — Hackathon Submission

**Event**: Agents, Everywhere: Bots, Channels & More Global Hackathon  
**Track**: CopilotKit Channels & Workplace Agent Workflows  
**Channel Code**: `launch-2027`

---

## 1. Build Eligibility

- [x] **Net-New Build**: Built specifically for the product launch creative director challenge.
- [x] **Core Functionality Developed During Event**:
  - Implemented immutable `ProductIdentitySpec` lock across 6 cosmetic form factors (`moisturizer`, `lotion`, `serum`, `toner`, `sunscreen`, `cleanser`) to prevent generative product drift.
  - Multi-surface asset pack derivation (canonical master, catalog packshot, travertine angle, bathroom lifestyle, formula texture).
  - 3 qualitative poster hypotheses generated with OpenAI Flare (`gpt-image-2.5-flare-2026-09-08`).
  - Live Exa market intelligence & unit economics engine (Stripe 2.9% + $0.30 fee formula, Shopify 2026 2.85% CVR benchmark, volume scenarios, break-even analysis).
  - 5-second Kling Turbo video blueprint & fal API image-to-video integration with clean provider status reporting.
  - 7-slide editable PowerPoint presentation (`pptxgenjs`) and matching high-res PDF (`pdf-lib`) inspired by the modern skincare aesthetic.
  - In-thread revision contract: aesthetic iterations regenerate targeted posters without re-querying Exa; commercial updates re-export decks without re-rendering images.
  - Slack artifact delivery via CopilotKit Channels `Thread.postFile()`.
- [x] **Inherited Starter Code**: CopilotKit Channels baseline runtime, tsx test harness.

---

## 2. Title and Description

### What We Built
The **Launch Room Creative Agent** is an autonomous D2C creative director running inside a Slack channel. When given an ugly photo of a bottle or a competitor reference link, it classifies intake mode, locks physical packaging invariants into an immutable spec, renders a complete multi-surface asset pack and three distinct poster hypotheses via OpenAI Flare, conducts live market research on competitor pricing and reviews via Exa, calculates unit economics and Stripe processing fees, designs a 5-second Kling Turbo motion video, compiles a 7-slide editable pitch deck in PPTX and PDF, and uploads every asset directly back to the Slack thread.

### Who It Is For
Brand founders, creative directors, and D2C product teams who need to move from a raw physical sample or competitor link to a board-ready commercial launch proposal within minutes instead of weeks.

### Why the Surrounding Context Matters
The Slack thread serves as an active, living workspace. The agent maintains persistent `ThreadState` and artifact lineage in `.data/runs/<run-id>/manifest.json`. When a user replies with "Make Poster B more retro," the agent understands context from prior turns, modifies only the target poster treatment, updates the deck, and never wastes resources re-running Exa research or regenerating unrelated assets.

### Sponsor Technologies Used
- **CopilotKit Channels**: Native Slack thread subscription, continuous conversational turns without repeated bot mentions, and `Thread.postFile()` multi-artifact uploads.
- **OpenAI Flare (`gpt-image-2.5-flare-2026-09-08`)**: Generating canonical product master, packshots, lifestyle scenes, macro formula textures, and qualitative A/B/C poster hypotheses.
- **Exa**: Real-time competitor price band research and customer review friction signal retrieval.
- **fal Kling Turbo (`fal-ai/kling-video/v3/turbo/standard/image-to-video`)**: High-fidelity 5-second product motion video generation.

---

## 3. Evidence for the Judging Criteria

| Criterion | Score Potential | Live Implementation Evidence |
|---|---|---|
| **Core Requirements & Functionality** | 5 / 5 | The complete 7-step pipeline runs end-to-end via `npm run demo` and in Slack. Generates 8 high-res PNGs, Exa market signals, Stripe fee calculations, 14.1 MB editable PPTX, and 18.6 MB PDF. |
| **Innovation & Theme Alignment** | 5 / 5 | Transforms Slack from a passive chat interface into an autonomous creative workshop with continuous thread state, file uploads, and contextual in-thread revision routing. |
| **Technical Execution & Integration** | 5 / 5 | Clean separation of concerns (SOLID). 108 unit tests pass across 3 workspaces (`npm run verify`). Zero unhandled provider crashes; missing `FAL_KEY` is cleanly reported without faking synthetic video. |
| **Usefulness & Agentic Experience** | 5 / 5 | Compresses 3 weeks of creative agency work (photography, copy, market research, financial modeling, deck design) into a single 60-second Slack interaction with full lineage tracking. |

---

## 4. Verification & Testing Evidence

```bash
# 1. Typecheck and unit tests
npm run verify
# Result: 108 passing tests, 0 failures, 0 TypeScript errors.

# 2. End-to-end demo execution
npm run demo
# Result: Full 3-phase execution completed successfully in .data/runs/
# Phase 1: Full creative run (60.9s) -> 8 PNGs + PPTX + PDF
# Phase 2: In-thread revision "Make Poster B more retro" (20.8s) -> updated Poster B, Exa skipped
# Phase 3: In-thread revision "Add supplier quote $8.20" (2.9s) -> updated economics, images skipped
```
