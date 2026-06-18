import type { ParsedTripRequest } from "../types.js";

const RATES_TO_GBP = {
  GBP: 1,
  EUR: 0.85,
  USD: 0.78
} as const;

export function toGbp(budget: ParsedTripRequest["budget"]): number | undefined {
  if (!budget) return undefined;
  return Math.round(budget.amount * RATES_TO_GBP[budget.currency]);
}

export function formatGbp(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0
  }).format(amount);
}
