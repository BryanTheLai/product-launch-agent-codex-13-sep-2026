---
name: jinja-prompt-templating
description: Governance and standards for zero-hardcoded prompt architecture using Jinja (.jinja) templates across TypeScript and Python runtimes.
---

# Jinja Prompt Templating Standard

## Core Principle
**Zero Hardcoded Prompts in Application Code.**
Prompt strings, creative treatments, video shot choreographies, negative constraint blocks, and research queries must not be hardcoded as raw string literals in `.ts` or `.py` source files. They must be maintained in declarative `.jinja` files under `packages/agent-core/templates/`.

## Directory Structure
```
packages/agent-core/templates/
├── prompts/
│   ├── five_part_system.jinja      # 5-block canonical image generator
│   ├── product_master.jinja        # Studio product hero
│   ├── packshot.jinja              # Seamless #FFFFFF e-commerce packshot
│   ├── catalog.jinja               # 45° isometric travertine editorial
│   ├── lifestyle.jinja             # Natural morning bathroom sanctuary
│   ├── texture.jinja               # Extreme macro tactile formula peak
│   └── poster_variant.jinja        # Concept hypothesis & typographic layout
├── video/
│   ├── egg_coverage_test.jinja
│   ├── underwater_bubble_hydration.jinja
│   ├── seasonal_tap_swap.jinja
│   ├── sun_stick_dual_finish.jinja
│   ├── asmr_bingsu_recipe.jinja
│   ├── problem_solution_invisible_swatch.jinja
│   └── skin_1004_soothing_dispense.jinja
└── research/
    ├── market_signals.jinja
    └── unit_economics.jinja
```

## Syntax & Feature Support
Both the TypeScript runtime (`packages/agent-core/src/creative/templates/engine.ts`) and the Python runtime (`render.py`) support identical Jinja2 syntax:
- **Variable Interpolation**: `{{ brandName }}`, `{{ productSpec.dimensionsAndNetVolume }}`
- **Default Filters**: `{{ claimsPolicy | default('Descriptive cosmetic claims only.') }}`
- **Conditionals**: `{% if negativeConstraints %}- {{ negativeConstraints }}{% endif %}`
- **Loops**:
  ```jinja
  {% for constraint in productSpec.forbiddenProductChanges %}
  - {{ constraint }}
  {% endfor %}
  ```

## Usage in TypeScript
```ts
import { renderTemplate } from '../templates/engine';

const prompt = renderTemplate('prompts/five_part_system.jinja', {
  productSpec,
  creativeTreatment,
  shotPlan,
  negativeConstraints,
});
```

## Usage in Python
```python
from render import render_template

prompt = render_template('prompts/five_part_system.jinja', {
    'productSpec': product_spec,
    'creativeTreatment': treatment,
})
```
