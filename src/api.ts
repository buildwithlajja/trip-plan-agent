import type { AuditEntry, Metrics, TripResponse } from "./types";

export async function planTrip(prompt: string, role: "traveler" | "reviewer"): Promise<TripResponse> {
  const response = await fetch("/api/trips/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, role })
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ? JSON.stringify(body.error) : "Trip planning failed");
  }

  return response.json();
}

export async function loadAudit(): Promise<AuditEntry[]> {
  const response = await fetch("/api/audit?limit=10");
  if (!response.ok) throw new Error("Audit log failed to load");
  const body = await response.json() as { entries: AuditEntry[] };
  return body.entries;
}

export async function loadMetrics(): Promise<Metrics> {
  const response = await fetch("/api/metrics");
  if (!response.ok) throw new Error("Metrics failed to load");
  return response.json();
}
