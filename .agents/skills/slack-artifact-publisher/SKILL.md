---
name: slack-artifact-publisher
description: Posts summaries and uploads images, MP4, PPTX, and PDF to the same Slack thread using thread.postFile().
---

# Slack Artifact Publisher

Delivers all generated launch assets directly back into the initiating Slack thread using CopilotKit Channels.

## Delivery Protocol
1. **Multi-File Thread Uploads**:
   - Calls `thread.postFile({ bytes, filename, title, altText })` for each visual and document artifact.
   - Uploads: Poster A, Poster B, Poster C, Kling MP4 (if enabled), `pitch-deck.pptx`, and `pitch-deck.pdf`.
2. **Concise Decision Brief**:
   - Posts a high-level summary with the recommended poster direction, rationale, and key unit economics (retail price, COGS, Stripe fees, break-even orders).
3. **Interactive Thread Continuity**:
   - Keeps the thread subscribed so users can iterate without re-mentioning the agent.
