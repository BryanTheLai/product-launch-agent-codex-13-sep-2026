---
name: unit-economics-research
description: Researches current price, COGS, packaging, fulfilment, fees (Stripe 2.9% + $0.30), and volume assumptions (Shopify 2.85% CVR) with sources and confidence.
---

# Unit Economics Research

Models rigorous direct-to-consumer (DTC) unit economics, transaction processing fees, fulfillment costs, and contribution margins.

## Financial Formulas & Standards
- **Stripe Domestic Card Fee**: `Retail Price * 2.9% + $0.30` ($1.87 on $54.00 item).
- **Shopify 2026 Category Benchmark**: `2.85% CVR` for consumer goods.
- **Packaging & Formulation Allocation**: Amber glass container + secondary box ($3.20) + active cosmetic bulk ($7.30) = default $10.50 COGS.
- **3PL Fulfillment**: Sub-1lb pick, pack, and zone delivery modeled at $5.85 (ShipBob benchmark).
- **Net Contribution Per Unit**: `Retail Price - COGS - Fulfillment - Payment Fee - Returns Allowance`.
- **Break-Even Volume**: `Campaign Test Budget ($2,500) / Contribution Per Order`.

## Evidence Categorization
Every parameter in the model must be labeled:
- `observed`: Verifiable real-world data (e.g. Stripe pricing page, Shopify benchmark).
- `inferred`: Derived through category heuristics (e.g. packaging cost breakdowns).
- `assumption`: Working baseline parameters (e.g. 10,000 monthly site visitors).
- `user-supplied`: Explicit human overrides (e.g. supplier quote of $8.20).
