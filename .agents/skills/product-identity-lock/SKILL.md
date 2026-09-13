---
name: product-identity-lock
description: Resolves adapt-versus-design-new mode, creates ProductIdentitySpec, generates the canonical product master, and rejects product drift.
---

# Product Identity Lock

Locks physical packaging invariants into an immutable `ProductIdentitySpec` to prevent generative AI product drift across all downstream assets.

## Physical Invariants Locked
- **Silhouette & Proportions**: Explicit container diameter-to-height ratio.
- **Dimensions & Net Volume**: Calibrated volume (e.g., 50 ml / 1.7 fl. oz.).
- **Cap, Closure & Dispenser**: Explicit functional closure (amber glass jar with matte black screw lid and inner barrier seal).
- **Container Material & Finish**: Tactile finish (frosted heavy-weight glass with ceramic matte coating).
- **Formula Texture & Color**: Emulsion consistency (whipped cloud-white barrier cream with soft peaks).
- **Label Layout & Wordmark**: Exact typographic hierarchy with provisional sans-serif wordmark.

## 5-Block Prompt Standard
All downstream generation prompts compose 5 explicit blocks:
```
1. [PRODUCT SPECIFICATION (IMMUTABLE PHYSICAL IDENTITY)]
2. [CREATIVE TREATMENT]
3. [SHOT PLAN & COMPOSITION]
4. [NEGATIVE CONSTRAINTS (STRICTLY FORBIDDEN)]
5. [CLAIMS POLICY]
```
