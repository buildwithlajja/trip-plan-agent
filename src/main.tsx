import React from "react";
import ReactDOM from "react-dom/client";
import { loadAudit, loadMetrics, planTrip } from "./api";
import type { AgentContribution, AuditEntry, Metrics, TripResponse } from "./types";
import "./styles.css";

const examplePrompts = [
  "Plan a five day trip somewhere warm in Europe for under 1500 pounds. I like food, beaches, and history.",
  "I want 4 days in Lisbon with good food and culture. Keep it under 900 GBP.",
  "Suggest a warm European destination for a romantic 6 day trip below 1200 GBP."
];

function App() {
  const [prompt, setPrompt] = React.useState(examplePrompts[0]);
  const [role, setRole] = React.useState<"traveler" | "reviewer">("traveler");
  const [result, setResult] = React.useState<TripResponse | null>(null);
  const [audit, setAudit] = React.useState<AuditEntry[]>([]);
  const [metrics, setMetrics] = React.useState<Metrics | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refreshAudit = React.useCallback(async () => {
    const [auditRows, metricRows] = await Promise.all([loadAudit(), loadMetrics()]);
    setAudit(auditRows);
    setMetrics(metricRows);
  }, []);

  React.useEffect(() => {
    refreshAudit().catch(() => undefined);
  }, [refreshAudit]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await planTrip(prompt, role);
      setResult(response);
      await refreshAudit();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const activeAgents = result?.contributions ?? [];

  return (
    <main className="app-shell">
      <section className="planner-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Cross-collaborative AI platform</p>
            <h1>Multi-agent trip planner</h1>
          </div>
          <div className="status-pill">
            <span aria-hidden="true">OK</span>
            Audit enabled
          </div>
        </div>

        <form onSubmit={submit} className="request-form">
          <div className="role-toggle" aria-label="User role">
            <button
              type="button"
              className={role === "traveler" ? "selected" : ""}
              onClick={() => setRole("traveler")}
            >
              Traveler
            </button>
            <button
              type="button"
              className={role === "reviewer" ? "selected" : ""}
              onClick={() => setRole("reviewer")}
            >
              Reviewer
            </button>
          </div>

          <label htmlFor="prompt">Trip request</label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={7}
            placeholder="Describe the trip, constraints, budget, and interests..."
          />

          <div className="examples">
            {examplePrompts.map((example) => (
              <button type="button" key={example} onClick={() => setPrompt(example)}>
                {example}
              </button>
            ))}
          </div>

          <button className="primary-button" type="submit" disabled={loading}>
            <span className={loading ? "spin icon" : "icon"} aria-hidden="true">
              {loading ? "..." : "GO"}
            </span>
            Plan trip
          </button>
        </form>

        {error ? <div className="error-box">{error}</div> : null}

        <section className="activity-strip" aria-label="Agent activity">
          <AgentChip
            icon="D"
            label="Destination"
            contribution={activeAgents.find((item) => item.agent === "destination")}
            loading={loading}
          />
          <AgentChip
            icon="I"
            label="Itinerary"
            contribution={activeAgents.find((item) => item.agent === "itinerary")}
            loading={loading}
          />
          <AgentChip
            icon="B"
            label="Budget"
            contribution={activeAgents.find((item) => item.agent === "budget")}
            loading={loading}
          />
        </section>
      </section>

      <section className="answer-layout">
        <article className="answer-panel">
          <div className="section-title">
            <span aria-hidden="true">*</span>
            Synthesised answer
          </div>
          {result ? (
            <pre className="answer-text">{result.answer}</pre>
          ) : (
            <div className="empty-state">
              <span className="empty-icon" aria-hidden="true">MAP</span>
              <p>Submit a request to see the orchestrated response and agent trace.</p>
            </div>
          )}
        </article>

        <aside className="side-panel">
          <div className="section-title">Agent trace</div>
          {result ? (
            result.contributions.map((contribution) => (
              <div className="trace-row" key={contribution.agent}>
                <strong>{labelForAgent(contribution.agent)}</strong>
                <span className={contribution.status}>{contribution.status}</span>
                <p>{contribution.reason}</p>
                <small>{contribution.summary}</small>
              </div>
            ))
          ) : (
            <p className="muted">Each completed request records which agents handled it and why.</p>
          )}
        </aside>
      </section>

      <section className="audit-layout">
        <div className="metrics-row">
          <Metric label="Requests" value={metrics?.totalRequests ?? 0} />
          <Metric label="Avg latency" value={`${metrics?.averageDurationMs ?? 0} ms`} />
          <Metric label="Storage" value={metrics?.storage ?? "jsonl"} />
        </div>

        <div className="audit-panel">
          <div className="section-title">Recent audit log</div>
          {audit.length === 0 ? (
            <p className="muted">No persisted requests yet.</p>
          ) : (
            audit.map((entry) => (
              <div className="audit-row" key={entry.id}>
                <div>
                  <strong>{entry.prompt}</strong>
                  <small>{new Date(entry.createdAt).toLocaleString()} - {entry.durationMs} ms</small>
                </div>
                <span>{entry.agents.map((agent) => labelForAgent(agent.agent)).join(" -> ")}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

function AgentChip({
  icon,
  label,
  contribution,
  loading
}: {
  icon: React.ReactNode;
  label: string;
  contribution?: AgentContribution;
  loading: boolean;
}) {
  return (
    <div className={`agent-chip ${contribution?.status ?? ""}`}>
      <span className={loading ? "spin icon" : "icon"} aria-hidden="true">
        {loading ? "..." : icon}
      </span>
      <div>
        <strong>{label}</strong>
        <span>{loading ? "queued" : contribution?.summary ?? "waiting"}</span>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function labelForAgent(agent: string) {
  return agent.charAt(0).toUpperCase() + agent.slice(1);
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
