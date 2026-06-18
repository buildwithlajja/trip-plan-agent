export type AgentName = "destination" | "itinerary" | "budget";

export type UserRole = "traveler" | "reviewer";

export interface TripRequest {
  prompt: string;
  role: UserRole;
}

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

export interface DestinationSuggestion {
  name: string;
  country: string;
  whyItFits: string[];
  estimatedDailyCostGbp: number;
  estimatedFlightGbp: number;
  climate: "warm" | "mild" | "cold";
  bestFor: string[];
}

export interface DayPlan {
  day: number;
  title: string;
  morning: string;
  afternoon: string;
  evening: string;
  realismNote: string;
}

export interface BudgetEstimate {
  destination: string;
  totalGbp: number;
  budgetGbp?: number;
  status: "within_budget" | "over_budget" | "unknown_budget";
  breakdown: Array<{ item: string; amountGbp: number }>;
  recommendation: string;
}

export interface AgentContribution {
  agent: AgentName;
  reason: string;
  status: "completed" | "failed" | "skipped";
  summary: string;
  data?: unknown;
  error?: string;
}

export interface OrchestratedTripResponse {
  id: string;
  createdAt: string;
  parsedRequest: ParsedTripRequest;
  chosenDestination?: DestinationSuggestion;
  answer: string;
  contributions: AgentContribution[];
}

export interface AuditEntry {
  id: string;
  createdAt: string;
  prompt: string;
  role: UserRole;
  parsedRequest: ParsedTripRequest;
  agents: Array<{
    agent: AgentName;
    reason: string;
    status: AgentContribution["status"];
  }>;
  durationMs: number;
}

export interface AuditMetrics {
  totalRequests: number;
  agentCounts: Record<string, number>;
  averageDurationMs: number;
  logFileBytes: number;
  storage: "jsonl" | "memory" | "upstash-redis";
}
