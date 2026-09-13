---
name: fal-kling-video
description: Turns the selected poster into the short Kling Turbo video through the fal API with transparent provider status reporting.
---

# fal Kling Video Integration

Renders a high-fidelity 5-second product motion video from the canonical product master using the Kling Turbo model on fal.

## Execution Directives
- **Model Endpoint**: `fal-ai/kling-video/v3/turbo/standard/image-to-video`.
- **Duration**: 5 seconds.
- **Aspect Ratio**: 9:16 vertical mobile video.
- **Transparent Status Reporting**:
  - When `FAL_KEY` is configured: Submits job, polls queue status until completed, and saves local MP4.
  - When `FAL_KEY` is missing: Reports status as `failed` with clear message ("FAL_KEY is not configured in the environment"). Never generates fake or mock video files.
