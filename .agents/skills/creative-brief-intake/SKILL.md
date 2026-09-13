---
name: creative-brief-intake
description: Turns a Slack message, product image, brand context, audience, and boss-facing goal into a structured brief. Handles adapt_existing_product vs design_new_product_from_reference classification.
---

# Creative Brief Intake

Turn raw user messages, ugly product photos, and competitor reference URLs into an authoritative, structured creative brief.

## Purpose
Intake is the front door of the Launch Room Creative Agent. It extracts:
1. **Intake Mode**:
   - `adapt_existing_product`: When an image is attached, or the user says "adapt this photo", "use this bottle", or "ugly product photo". In this mode, physical geometry, materials, closure, and label layouts are locked from the image.
   - `design_new_product_from_reference`: When only a reference URL (e.g., `https://im8health.com/`), brand concept, or competitor description is provided. In this mode, visual tone is inspired by the reference without copying trademarked trade dress.
2. **Product Classification**: Infers product category (`moisturizer`, `lotion`, `serum`, `toner`, `sunscreen`, `cleanser`).
3. **Target Audience & Core Benefit**: Identifies performance skin needs and consumer reason-to-believe.
4. **Boss-Facing Objective**: Captures the concrete commercial decision required from leadership (e.g. approving a 2,500-unit pilot run and test ad spend).

## Output Contract
Produces a structured `CreativeBriefInput` with `threadId`, `brandName`, `productType`, `rawText`, `referenceUrl`, and `attachedImageLocalPath`.
