"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CopilotChat, useConfigureSuggestions } from "@copilotkit/react-core/v2";
import { GenerativeUI } from "@/components/generative-ui";
import {
  CREATIVE_OUTPUTS,
  normalizeCreativeOutputs,
  normalizeCreativeStyles,
  STYLE_PRESETS,
  type BrandProfile,
  type CreativeOutput,
  type CreativePack,
  type CreativeStyleId,
} from "@/lib/creative";
import {
  CreativeControl,
  type CreativeGenerateResult,
  type CreativeGenerationArgs,
} from "@/components/creative-control";

type Reference = {
  assetId: string;
  name: string;
  mimeType: string;
  size: number;
  url: string;
};

type ProgressItem = {
  label: string;
  detail: string;
  state: "done" | "active" | "waiting";
};

const DEFAULT_INSTRUCTION =
  "Turn this bottle into our original cobalt-blue energy drink. Keep the useful silhouette and believable glass highlights, but replace all third-party branding. Build a kinetic, premium launch world with an exploded-product reveal, a 10-second UGC idea, posters, and a pitch deck for my boss.";

function sessionIdForTab() {
  if (typeof window === "undefined") return "server-preview";
  const current = window.sessionStorage.getItem("creative-studio-session");
  if (current) return current;
  const next = window.crypto?.randomUUID?.() || `session-${Date.now().toString(36)}`;
  window.sessionStorage.setItem("creative-studio-session", next);
  return next;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function outputLabel(output: CreativeOutput) {
  return { hero: "Hero", ugc: "10s UGC", poster: "Posters", deck: "Deck" }[output];
}

function OutputCard({
  title,
  eyebrow,
  children,
  className = "",
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <article className={`studio-output-card ${className}`}>
      <div className="studio-output-card__topline">
        <span>{eyebrow}</span>
        <span className="studio-output-card__dot" aria-hidden="true" />
      </div>
      <h3>{title}</h3>
      {children}
    </article>
  );
}

export function CreativeStudio() {
  // Keep the server render and the first client render identical. The real
  // browser-tab session is attached after hydration so the session label never
  // causes a client/server mismatch.
  const [sessionId, setSessionId] = useState("server-preview");
  const [reference, setReference] = useState<Reference | null>(null);
  const [instruction, setInstruction] = useState(DEFAULT_INSTRUCTION);
  const [outputs, setOutputs] = useState<CreativeOutput[]>([...CREATIVE_OUTPUTS]);
  const [styles, setStyles] = useState<CreativeStyleId[]>(["exploded-fpv"]);
  const [brandUrl, setBrandUrl] = useState("");
  const [brand, setBrand] = useState<BrandProfile | null>(null);
  const [pack, setPack] = useState<CreativePack | null>(null);
  const [busy, setBusy] = useState<"uploading" | "branding" | "generating" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState<ProgressItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSessionId(sessionIdForTab());
  }, []);

  useConfigureSuggestions(
    {
      suggestions: [
        {
          title: "Build the blue energy drink pack",
          message: "Use the uploaded reference and create the hero, 10-second UGC treatment, poster system, and pitch deck.",
        },
        {
          title: "Make it feel like an FPV product film",
          message: "Choose the strongest camera, lighting, and physics direction for an exploded-product FPV reveal, then generate the pack.",
        },
        {
          title: "Turn this into a boss-ready pitch",
          message: "Create a sharp product story, a poster direction, a 10-second UGC concept, and a concise pitch deck outline.",
        },
      ],
      available: "before-first-message",
    },
    [],
  );

  const activeStyleLabels = useMemo(
    () => styles.map((id) => STYLE_PRESETS.find((preset) => preset.id === id)?.label).filter(Boolean),
    [styles],
  );

  const uploadReference = useCallback(async (file: File) => {
    setError("");
    setNotice("");
    setBusy("uploading");
    setProgress([
      { label: "Reference image", detail: "Storing this session's source image…", state: "active" },
      { label: "Creative direction", detail: "Waiting for a brief", state: "waiting" },
    ]);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("sessionId", sessionId);
      const response = await fetch("/api/assets", { method: "POST", body: form });
      const body = (await response.json()) as Reference & { message?: string };
      if (!response.ok) throw new Error(body.message || "Reference upload failed.");
      setReference(body);
      setProgress([
        { label: "Reference image", detail: `${body.name} · ${formatBytes(body.size)} · stored for this session`, state: "done" },
        { label: "Creative direction", detail: "Ready to turn the source into a pack", state: "active" },
      ]);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Reference upload failed.");
      setProgress([]);
    } finally {
      setBusy(null);
    }
  }, [sessionId]);

  const readBrand = useCallback(async () => {
    if (!brandUrl.trim()) return;
    setError("");
    setBusy("branding");
    setNotice("");
    try {
      const response = await fetch("/api/brand-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: brandUrl.trim() }),
      });
      const body = (await response.json()) as { profile?: BrandProfile; message?: string };
      if (!response.ok || !body.profile) throw new Error(body.message || "Could not read that brand URL.");
      setBrand(body.profile);
      setNotice(`Brand profile loaded from ${new URL(body.profile.sourceUrl).hostname}.`);
    } catch (brandError) {
      setError(brandError instanceof Error ? brandError.message : "Could not read that brand URL.");
    } finally {
      setBusy(null);
    }
  }, [brandUrl]);

  const generate = useCallback(async ({
    instruction: nextInstruction,
    outputs: nextOutputs,
    styles: nextStyles,
  }: CreativeGenerationArgs = {}): Promise<CreativeGenerateResult> => {
    const resolvedInstruction = nextInstruction?.trim() || instruction.trim();
    const resolvedOutputs = nextOutputs?.length ? normalizeCreativeOutputs(nextOutputs) : outputs;
    const resolvedStyles = nextStyles?.length ? normalizeCreativeStyles(nextStyles) : styles;
    if (!reference) {
      const result = { status: "needs_reference" as const, message: "Upload a reference image before generating the pack." };
      setError(result.message);
      return result;
    }
    if (!resolvedInstruction) {
      const result = { status: "error" as const, message: "Add a creative direction before generating the pack." };
      setError(result.message);
      return result;
    }
    setError("");
    setNotice("");
    setBusy("generating");
    setProgress([
      { label: "Reference image", detail: `${reference.name} is attached to the creative run`, state: "done" },
      { label: "Creative direction", detail: `Writing ${activeStyleLabels.join(" + ") || "editorial"} treatment`, state: "active" },
      { label: "Output pack", detail: `Preparing ${resolvedOutputs.map(outputLabel).join(", ")}`, state: "waiting" },
    ]);
    try {
      const response = await fetch("/api/creative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          assetId: reference.assetId,
          instruction: resolvedInstruction,
          outputs: resolvedOutputs,
          styles: resolvedStyles,
          brand,
        }),
      });
      const body = (await response.json()) as CreativePack & { message?: string; notice?: string };
      if (!response.ok) throw new Error(body.message || "Creative generation failed.");
      setPack(body);
      setNotice(body.notice || "Creative pack ready.");
      setProgress([
        { label: "Reference image", detail: `${reference.name} is attached to the creative run`, state: "done" },
        { label: "Creative direction", detail: "Camera, lighting, physics, and style recipe composed", state: "done" },
        { label: "Output pack", detail: body.mode === "openai" ? "Hero render returned; UGC, posters, and deck are ready" : "Sample pack ready; connect OpenAI for the hero render", state: "done" },
      ]);
      return body;
    } catch (generationError) {
      const message = generationError instanceof Error ? generationError.message : "Creative generation failed.";
      setError(message);
      setProgress((current) => current.map((item) => item.state === "active" ? { ...item, detail: message, state: "waiting" } : item));
      return { status: "error", message };
    } finally {
      setBusy(null);
    }
  }, [activeStyleLabels, brand, instruction, outputs, reference, sessionId, styles]);

  const handleAgentGenerate = useCallback((args: CreativeGenerationArgs) => generate(args), [generate]);

  const toggleOutput = (output: CreativeOutput) => {
    setOutputs((current) => current.includes(output) ? current.filter((item) => item !== output) : [...current, output]);
  };

  const toggleStyle = (style: CreativeStyleId) => {
    setStyles((current) => current.includes(style) ? (current.length === 1 ? current : current.filter((item) => item !== style)) : [...current, style]);
  };

  const copyDeck = async () => {
    if (!pack) return;
    const text = [pack.deck.title, ...pack.deck.slides.map((slide, index) => `${index + 1}. ${slide.title}\n${slide.body}`)].join("\n\n");
    await navigator.clipboard?.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <>
      <GenerativeUI />
      <CreativeControl
        sessionId={sessionId}
        reference={reference ? { assetId: reference.assetId, name: reference.name, url: reference.url } : null}
        instruction={instruction}
        outputs={outputs}
        styles={styles}
        brand={brand}
        onGenerate={handleAgentGenerate}
      />

      <main className="studio-shell">
        <header className="studio-topbar">
          <div className="studio-brand" aria-label="Creative Studio">
            <span className="studio-brand__mark" aria-hidden="true">✳</span>
            <span>Creative Studio</span>
          </div>
          <div className="studio-session"><span className="studio-live-dot" aria-hidden="true" /> session {sessionId.slice(-6)}</div>
          <button type="button" className="studio-quiet-button" onClick={() => { setPack(null); setNotice(""); setError(""); setProgress([]); }}>
            New brief
          </button>
        </header>

        <div className="studio-layout">
          <section className="studio-workbench" aria-labelledby="studio-title">
            <div className="studio-heading">
              <div className="studio-kicker">REFERENCE → CAMPAIGN</div>
              <h1 id="studio-title">Make the product impossible to ignore.</h1>
              <p>Drop one image. Give the studio a direction. The agent turns it into a visual system you can show your team.</p>
            </div>

            <div className="studio-brief-grid">
              <div className="studio-reference-column">
                <input
                  ref={inputRef}
                  className="studio-hidden-input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  aria-label="Reference image"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadReference(file);
                  }}
                />
                <button type="button" className={`studio-dropzone ${reference ? "has-reference" : ""}`} onClick={() => inputRef.current?.click()}>
                  {reference ? (
                    <>
                      <img src={reference.url} alt="Uploaded product reference" />
                      <span className="studio-reference-overlay">Replace reference</span>
                    </>
                  ) : (
                    <span className="studio-dropzone__empty">
                      <span className="studio-dropzone__plus" aria-hidden="true">+</span>
                      <strong>Drop product image</strong>
                      <small>PNG, JPG, or WebP · 12 MB max</small>
                    </span>
                  )}
                </button>
                {reference && <div className="studio-reference-meta"><strong>{reference.name}</strong><span>{formatBytes(reference.size)} · stored in this session</span></div>}
              </div>

              <div className="studio-brief-column">
                <label className="studio-field-label" htmlFor="creative-direction">Creative direction</label>
                <textarea id="creative-direction" value={instruction} onChange={(event) => setInstruction(event.target.value)} rows={7} />
                <div className="studio-output-controls" aria-label="Requested outputs">
                  {CREATIVE_OUTPUTS.map((output) => (
                    <button key={output} type="button" className={`studio-chip ${outputs.includes(output) ? "is-selected" : ""}`} onClick={() => toggleOutput(output)} aria-pressed={outputs.includes(output)}>
                      {outputLabel(output)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <section className="studio-brand-row" aria-labelledby="brand-profile-title">
              <div>
                <div className="studio-field-label" id="brand-profile-title">Brand DNA <span>optional</span></div>
                {brand ? <p className="studio-brand-loaded"><strong>{brand.name}</strong> · {brand.mission}</p> : <p className="studio-brand-help">Paste a site and the agent will borrow its mission, voice, palette, and visual patterns.</p>}
              </div>
              <div className="studio-brand-input">
                <input value={brandUrl} onChange={(event) => setBrandUrl(event.target.value)} placeholder="https://yourbrand.com" type="url" aria-label="Brand website URL" />
                <button type="button" onClick={() => void readBrand()} disabled={busy === "branding" || !brandUrl.trim()}>{busy === "branding" ? "Reading…" : "Read brand"}</button>
              </div>
            </section>

            <section className="studio-style-row" aria-labelledby="style-title">
              <div className="studio-field-label" id="style-title">Camera + treatment</div>
              <div className="studio-style-chips">
                {STYLE_PRESETS.map((preset) => (
                  <button key={preset.id} type="button" className={`studio-style-chip ${styles.includes(preset.id) ? "is-selected" : ""}`} onClick={() => toggleStyle(preset.id)} aria-pressed={styles.includes(preset.id)}>{preset.label}</button>
                ))}
              </div>
            </section>

            <div className="studio-action-row">
              <button type="button" className="studio-generate-button" onClick={() => void generate()} disabled={busy !== null || !reference}>
                <span>{busy === "generating" ? "Building the pack…" : "Generate creative pack"}</span>
                <span className="studio-keycap">⌘ ↵</span>
              </button>
              <span className="studio-action-note">The agent can also run this from the chat.</span>
            </div>

            {(notice || error) && <div className={`studio-notice ${error ? "is-error" : ""}`} role={error ? "alert" : "status"}>{error || notice}</div>}

            <section className="studio-progress" aria-label="Creative progress">
              <div className="studio-progress__header"><span>Run status</span><span>{busy ? "working" : pack ? "complete" : "ready"}</span></div>
              {progress.length === 0 ? <p className="studio-progress__empty">Your run will show its work here as it moves from image to campaign.</p> : <ol>{progress.map((item) => <li key={item.label} className={`is-${item.state}`}><span className="studio-progress__icon" aria-hidden="true">{item.state === "done" ? "✓" : item.state === "active" ? "◌" : "·"}</span><div><strong>{item.label}</strong><span>{item.detail}</span></div></li>)}</ol>}
            </section>

            <section className="studio-results" aria-labelledby="output-pack-title">
              <div className="studio-results__header"><div><div className="studio-kicker">OUTPUT PACK</div><h2 id="output-pack-title">The product, evolved.</h2></div>{pack && <span className={`studio-mode-badge ${pack.mode}`}>{pack.mode === "openai" ? "OpenAI render" : "sample direction"}</span>}</div>
              {!pack ? <div className="studio-results__empty"><span className="studio-results__glyph" aria-hidden="true">◈</span><p>Upload a reference and press generate. The studio will keep the source image, the prompt recipe, and the output lineage together.</p></div> : <div className="studio-output-grid">
                <OutputCard title={pack.hero.label} eyebrow="01 · visual anchor" className="studio-output-card--hero">
                  <div className="studio-hero-preview">{pack.hero.url ? <img src={pack.hero.url} alt="Generated hero direction" /> : <><img src={pack.reference.url} alt="Reference used for the sample direction" /><span className="studio-sample-stamp">Reference preview<br />add OpenAI to render</span></>}</div>
                  <p>{pack.hero.description}</p>
                </OutputCard>
                <OutputCard title="10-second UGC" eyebrow="02 · story beat" className="studio-output-card--ugc">
                  <p className="studio-output-lead">{pack.ugc.hook}</p>
                  <ol className="studio-shot-list">{pack.ugc.shots.map((shot) => <li key={shot.time}><time>{shot.time}</time><span><strong>{shot.visual}</strong><em>{shot.audio}</em></span></li>)}</ol>
                  <div className="studio-caption">{pack.ugc.caption}</div>
                </OutputCard>
                <OutputCard title="Poster system" eyebrow="03 · campaign surfaces" className="studio-output-card--poster">
                  <div className="studio-poster-preview"><span>{pack.poster.headline}</span><small>{pack.poster.subline}</small></div>
                  <p>{pack.poster.layout}</p>
                  <div className="studio-treatment-list">{pack.poster.treatments.map((treatment) => <span key={treatment}>{treatment}</span>)}</div>
                </OutputCard>
                <OutputCard title={pack.deck.title} eyebrow="04 · alignment artifact" className="studio-output-card--deck">
                  <ol className="studio-deck-list">{pack.deck.slides.map((slide, index) => <li key={slide.title}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{slide.title}</strong><p>{slide.body}</p></div></li>)}</ol>
                  <button type="button" className="studio-copy-button" onClick={() => void copyDeck()}>{copied ? "Copied" : "Copy deck outline"}</button>
                </OutputCard>
              </div>}
            </section>
          </section>

          <aside className="studio-agent-panel" aria-labelledby="agent-title">
            <div className="studio-agent-panel__head"><div><div className="studio-kicker">AGENT</div><h2 id="agent-title">Studio copilot</h2></div><span className="studio-agent-status"><span className="studio-live-dot" aria-hidden="true" /> online</span></div>
            <p className="studio-agent-panel__intro">Tell it what you want. It can choose the treatment, research references, and run the pack while you watch the work change.</p>
            <CopilotChat className="studio-chat" labels={{ welcomeMessageText: "Give me a product and an outcome. I’ll build the creative route.", chatInputPlaceholder: "Ask the agent to change the direction…" }} />
          </aside>
        </div>

        <footer className="studio-footer"><span>Each tab gets an isolated session. References are stored server-side by session and never exposed as filesystem paths.</span><span>web · Slack · same creative operator</span></footer>
      </main>
    </>
  );
}
