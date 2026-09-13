# Creative Studio: an agent inside the product-launch workflow

**OpenAI + CopilotKit React + Ambiguous AI + Exa**

Creative Studio is the focused evolution of the earlier Mission Room idea. A
user uploads one product reference, describes the outcome, optionally pastes a
brand URL, and gets one coherent creative pack: a rendered hero image when
OpenAI image generation is configured, a 10-second UGC treatment, poster
directions, and a pitch-deck outline. The same operator can be used from the
embedded web chat or from a Slack thread.

## Get started

Complete the [root clone/install steps](../../README.md#get-started). Configure
`.env` with the providers you want:

```dotenv
MODEL_PROVIDER=openai
OPENAI_API_KEY=your-key
MODEL=gpt-5.6-sol
EXA_API_KEY=your-exa-key
EXA_SEARCH_TYPE=fast
AMBIGUOUS_API_KEY=your-workspace-key
```

Choose a model your account can use. Keys remain server-side. OpenAI powers the
operator and image edit; without the image key, the app still returns a clearly
labeled sample direction rather than pretending a hero was rendered. Exa and
Ambiguous are optional: their tools are only exposed when their keys exist.

```bash
npm run dev:web
```

Open `http://127.0.0.1:3100` or `http://localhost:3100` and upload a product
reference. The app binds to loopback by default.

## Try the Creative Studio flow

1. Upload the supplied bottle screenshot or another PNG/JPEG/WebP product image.
2. Keep the default brief or ask for a different product, audience, or launch
   outcome. Select the desired outputs and camera treatment.
3. Optionally paste a brand URL. The server extracts a small brand profile for
   the agent; it does not expose a filesystem path or secret.
4. Generate the pack. The app stores the reference by an opaque asset ID,
   sends the stored image plus the composed prompt to OpenAI Image Edits, and
   keeps UGC, poster, and deck outputs linked to the same run.
5. In CopilotChat, ask the agent to change the route; the visible
   `generate_creative_pack` frontend tool calls the same workflow.

For Slack, mention the Channel with the same brief and attachment. The Channel
posts a native “Creative Studio is on it” update, passes Slack multimodal
content parts to the agent, and exposes `creative_progress` cards for real
transitions. Managed Channel credentials are still required for a live Slack
connection.

## Customize these files

| Piece | File |
| --- | --- |
| Creative Studio UI | [src/app/page.tsx](src/app/page.tsx) and [src/components/creative-studio.tsx](src/components/creative-studio.tsx) |
| Creative prompt and pack lineage | [src/lib/creative.ts](src/lib/creative.ts) |
| Session-scoped image storage | [src/lib/server/creative-assets.ts](src/lib/server/creative-assets.ts) and [src/app/api/assets](src/app/api/assets) |
| OpenAI image edit route | [src/app/api/creative/route.ts](src/app/api/creative/route.ts) |
| Brand URL extraction | [src/app/api/brand-profile/route.ts](src/app/api/brand-profile/route.ts) |
| CopilotKit context and frontend tool | [src/components/creative-control.tsx](src/components/creative-control.tsx) |
| Exa research route | [src/app/api/research/route.ts](src/app/api/research/route.ts) |
| Agent endpoint | [src/app/api/copilotkit/[[...path]]/route.ts](src/app/api/copilotkit/[[...path]]/route.ts) |
| Slack/Teams Channel | [../../apps/channel/src/channel.tsx](../../apps/channel/src/channel.tsx) and [../../apps/channel/src/components.tsx](../../apps/channel/src/components.tsx) |

The agent can research, draft, edit, create visual direction, coordinate, and
replan autonomously. Raw Ambiguous MCP tools are exposed only when
`AMBIGUOUS_API_KEY` is configured. Exa results include source URLs, highlights,
representative images, and extracted image links when the key is configured;
video searches return pages/URLs, not video bytes.

## Provider responsibility split

- CopilotKit: embedded chat, shared context, frontend tools, generative UI,
  native channel components, and visible tool status.
- OpenAI: text agent runtime through CopilotKit plus the direct image-edit call
  that turns the stored reference into a hero render.
- Exa: optional live web evidence and visual-reference discovery.
- Ambiguous: optional workplace persistence through MCP—documents, tasks,
  slides, chat, drive, calendar, CRM, and other connected modules.

There is no magical CopilotKit-to-Ambiguous button: the connection is normal
agent/tool wiring. Never claim a workplace record exists without the provider
result and a fresh readback.

## Verify

```bash
npm run verify
npm run build --workspace web
```

The automated checks cover the creative prompt/pack, existing approval and
provider error paths, and channel tool delivery. A live Exa search, Ambiguous
write/readback, or Slack delivery still requires the corresponding credentials.
