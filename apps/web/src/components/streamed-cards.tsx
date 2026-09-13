import React from "react";

// Tool arguments arrive incrementally, before schema defaults are applied.
export interface IncidentCardProps {
  headline?: string;
  summary?: string;
  facts?: Array<{ label?: string; value?: string } | null> | null;
  nextSteps?: Array<string | null> | null;
  tone?: string;
}

export interface TimelineProps {
  title?: string;
  columns?: Array<string | null> | null;
  rows?: Array<Array<string | null> | null> | null;
}

const toneColor = { neutral: "var(--muted)", good: "#2e7d5b", attention: "var(--accent)" } as const;

export function IncidentCard({ headline, summary, facts, nextSteps, tone }: IncidentCardProps) {
  const color = tone === "good" || tone === "attention" ? toneColor[tone] : toneColor.neutral;
  return (
    <article className="ck-card" style={{ borderLeftColor: color }}>
      <h3>{headline || "Preparing incident assessment…"}</h3>
      <p>{summary || "Gathering incident details…"}</p>
      {!!facts?.length && (
        <dl className="ck-facts">
          {facts.map((fact, index) => (
            <div key={index}>
              <dt>{fact?.label || "Loading…"}</dt>
              <dd>{fact?.value || "Loading…"}</dd>
            </div>
          ))}
        </dl>
      )}
      {!!nextSteps?.length && (
        <ul className="ck-steps">
          {nextSteps.map((step, index) => (
            <li key={index}>{step || "Loading…"}</li>
          ))}
        </ul>
      )}
    </article>
  );
}

export function Timeline({ title, columns, rows }: TimelineProps) {
  return (
    <article className="ck-card">
      {title && <h3>{title}</h3>}
      {!columns?.length ? (
        <p>Preparing timeline…</p>
      ) : (
        <div className="ck-scroll">
          <table>
            <thead>
              <tr>
                {columns.map((header, index) => (
                  <th key={index}>{header || "Loading…"}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!rows?.length ? (
                <tr><td colSpan={columns.length}>Loading events…</td></tr>
              ) : rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((_, cellIndex) => (
                    <td key={cellIndex}>{row?.[cellIndex] ?? "Loading…"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}

export interface LaunchPlanProps {
  mission?: string;
  thesis?: string;
  phases?: Array<{
    name?: string;
    outcome?: string;
    actions?: string[] | null;
    owner?: string;
  } | null> | null;
  artifacts?: string[] | null;
  nextMove?: string;
}

export function LaunchPlan({
  mission,
  thesis,
  phases,
  artifacts,
  nextMove,
}: LaunchPlanProps) {
  return (
    <article className="ck-card ck-card--launch-plan">
      <div className="ck-card-kicker">Mission plan</div>
      <h3>{mission || "Preparing the mission plan…"}</h3>
      <p>{thesis || "Turning context into a sequence of useful work…"}</p>
      {!!phases?.length && (
        <ol className="ck-plan-phases">
          {phases.map((phase, index) => (
            <li key={`${phase?.name || "phase"}-${index}`}>
              <span className="ck-phase-index">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>{phase?.name || "Loading phase…"}</strong>
                {phase?.owner && <span className="ck-phase-owner">{phase.owner}</span>}
                <p>{phase?.outcome || "Defining the outcome…"}</p>
                {!!phase?.actions?.length && (
                  <ul>
                    {phase.actions.map((action, actionIndex) => (
                      <li key={actionIndex}>{action || "Loading action…"}</li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
      {!!artifacts?.length && (
        <div className="ck-artifact-strip">
          {artifacts.map((artifact, index) => (
            <span key={index}>{artifact || "Preparing artifact…"}</span>
          ))}
        </div>
      )}
      {nextMove && (
        <p className="ck-card-next"><strong>Next:</strong> {nextMove}</p>
      )}
    </article>
  );
}

export interface EvidenceBoardProps {
  question?: string;
  verdict?: string;
  confidence?: string;
  claims?: Array<{
    claim?: string;
    status?: string;
    source?: string;
    url?: string;
  } | null> | null;
  unknowns?: string[] | null;
}

export function EvidenceBoard({
  question,
  verdict,
  confidence,
  claims,
  unknowns,
}: EvidenceBoardProps) {
  return (
    <article className="ck-card ck-card--evidence">
      <div className="ck-card-kicker">Evidence board</div>
      <h3>{question || "Researching the decision…"}</h3>
      <p>{verdict || "Waiting for source-backed findings…"}</p>
      {confidence && <span className="ck-evidence-confidence">{confidence}</span>}
      {!!claims?.length && (
        <ul className="ck-evidence-list">
          {claims.map((claim, index) => (
            <li key={`${claim?.claim || "claim"}-${index}`}>
              <span className={`ck-evidence-dot ck-evidence-dot--${claim?.status || "unknown"}`} />
              <div>
                <strong>{claim?.claim || "Loading claim…"}</strong>
                <span>{claim?.status || "unverified"}</span>
                {claim?.url ? (
                  <a href={claim.url} target="_blank" rel="noreferrer">
                    {claim.source || "Open source"}
                  </a>
                ) : (
                  <em>Source link not available</em>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {!!unknowns?.length && (
        <div className="ck-unknowns">
          <strong>Still unknown</strong>
          <ul>
            {unknowns.map((unknown, index) => <li key={index}>{unknown}</li>)}
          </ul>
        </div>
      )}
    </article>
  );
}

export interface HandoffDiffProps {
  predecessor?: string;
  successor?: string;
  staleSignal?: string;
  before?: string[] | null;
  after?: string[] | null;
  autonomousWork?: string[] | null;
  checkpoint?: string;
}

export function HandoffDiff({
  predecessor,
  successor,
  staleSignal,
  before,
  after,
  autonomousWork,
  checkpoint,
}: HandoffDiffProps) {
  return (
    <article className="ck-card ck-card--handoff">
      <div className="ck-card-kicker">Agent Shift</div>
      <h3>{successor || "A successor is taking over…"}</h3>
      <p>{staleSignal || "Checking whether the inherited plan is still current…"}</p>
      <div className="ck-handoff-columns">
        <div>
          <span className="ck-column-label">Inherited from {predecessor || "predecessor"}</span>
          <ul>{(before?.length ? before : ["Loading inherited plan…"]).map((item, index) => <li key={index}>{item}</li>)}</ul>
        </div>
        <div>
          <span className="ck-column-label">Successor continuation</span>
          <ul>{(after?.length ? after : ["Preparing revised continuation…"]).map((item, index) => <li key={index}>{item}</li>)}</ul>
        </div>
      </div>
      {!!autonomousWork?.length && (
        <div className="ck-autonomy-line">
          <strong>Continues autonomously:</strong> {autonomousWork.join(" · ")}
        </div>
      )}
      {checkpoint && <p className="ck-card-next"><strong>Only checkpoint:</strong> {checkpoint}</p>}
    </article>
  );
}
