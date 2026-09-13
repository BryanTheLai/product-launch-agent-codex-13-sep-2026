---
name: thread-revision
description: Resolves "this", "Poster B", or style changes from thread state and avoids unrelated regeneration or research.
---

# Thread Revision Router

Enables conversational in-thread revisions with strict orthogonality and resource preservation.

## Revision Routing Logic
1. **Aesthetic Revision** (e.g., "Make Poster B more retro"):
   - Resolves target variant (`Poster B`).
   - Generates revised poster asset (`poster-B-rev<timestamp>.png`) with updated prompt while preserving locked product geometry.
   - Re-exports PPTX & PDF with the updated image.
   - **DOES NOT** re-run Exa research or regenerate Posters A and C.
2. **Commercial Revision** (e.g., "Add supplier quote of $8.20"):
   - Parses quote ($8.20).
   - Recalculates unit economics, Stripe fees, and volume scenarios with label `user-supplied`.
   - Re-exports PPTX & PDF with updated slide 5.
   - **DOES NOT** regenerate any images.
3. **Form Factor Mutation** (e.g., "Change bottle to jar"):
   - Confirms user intent, creates new product identity version (v2), and regenerates the canonical product master.
