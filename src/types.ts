export type AgentName = "destination" | "itinerary" | "budget";

export interface ParsedTripRequest {
  rawPrompt: string;
  days?: number;
  budget?: {
    amount: number;
    currency: "GBP" | "EUR" | "USD";
  };
  destinationHint?: string;
  climate?: "warm" | "mild" | "cold";
  region?: string;
  interests: string[];
  travelers: number;
}

export interface AgentContribution {
  agent: AgentName;
  reason: string;
  status: "completed" | "failed" | "skipped";
  summary: string;
  data?: unknown;
  error?: string;
}

export interface TripResponse {
  id: string;
  createdAt: string;
  parsedRequest: ParsedTripRequest;
  chosenDestination?: {
    name: string;
    country: string;
  };
  answer: string;
  contributions: AgentContribution[];
}

export interface AuditEntry {
  id: string;
  createdAt: string;
  prompt: string;
  role: "traveler" | "reviewer";
  agents: Array<{
    agent: AgentName;
    reason: string;
    status: AgentContribution["status"];
  }>;
  durationMs: number;
}

export interface Metrics {
  totalRequests: number;
  agentCounts: Record<string, number>;
  averageDurationMs: number;
  logFileBytes: number;
  storage: "jsonl" | "memory" | "upstash-redis";
}
