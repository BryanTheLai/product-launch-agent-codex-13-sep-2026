---
name: artifact-lineage
description: Tracks parent artifacts, provider/model metadata, local paths, SHA-256 hashes, and revision history in manifest.json.
---

# Artifact Lineage & Storage

Maintains immutable genealogical tracking and SHA-256 integrity verification for every creative artifact generated during a run.

## Directory Structure
```
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
```

## Manifest Contract
Each entry in `manifest.json` records:
`id`, `runId`, `threadId`, `kind`, `variantId`, `localPath`, `parentArtifactId`, `sourceProductArtifactId`, `productIdentityVersion`, `prompt`, `provider`, `providerModel`, `createdAt`, `status`.
