import type { ParsedTripRequest } from "../types.js";

const INTEREST_KEYWORDS = [
  "beach",
  "food",
  "history",
  "culture",
  "hiking",
  "nightlife",
  "family",
  "romantic",
  "museums",
  "wine",
  "architecture",
  "nature"
];

const DESTINATION_HINTS = [
  "barcelona",
  "lisbon",
  "porto",
  "athens",
  "crete",
  "malaga",
  "valencia",
  "rome",
  "palermo",
  "split",
  "dubrovnik",
  "madeira",
  "tenerife",
  "seville"
];

export function parseTripRequest(prompt: string): ParsedTripRequest {
  const normalized = prompt.toLowerCase();
  const days = extractDays(normalized);
  const budget = extractBudget(normalized);
  const destinationHint = DESTINATION_HINTS.find((destination) =>
    normalized.includes(destination)
  );
  const interests = INTEREST_KEYWORDS.filter((keyword) => normalized.includes(keyword));

  return {
    rawPrompt: prompt,
    days,
    budget,
    destinationHint,
    climate: normalized.includes("warm")
      ? "warm"
      : normalized.includes("cold")
        ? "cold"
        : normalized.includes("mild")
          ? "mild"
          : undefined,
    region: normalized.includes("europe") ? "Europe" : undefined,
    interests,
    travelers: extractTravelers(normalized)
  };
}

function extractDays(prompt: string): number | undefined {
  const numeric = prompt.match(/(\d{1,2})\s*(day|days|night|nights)/);
  if (numeric) return clampDays(Number(numeric[1]));

  const words: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10
  };

  for (const [word, value] of Object.entries(words)) {
    if (prompt.includes(`${word} day`) || prompt.includes(`${word}-day`)) {
      return clampDays(value);
    }
  }

  return undefined;
}

function extractBudget(prompt: string): ParsedTripRequest["budget"] {
  const match = prompt.match(
    /(?:under|below|less than|budget|up to|max(?:imum)?|for)?\s*(?:£|gbp|eur|€|usd|\$)?\s*(\d{3,5})(?:\s*(pounds?|gbp|euros?|eur|usd|dollars?))?/
  );
  if (!match) return undefined;

  const currencyToken = `${match[0]} ${match[2] ?? ""}`.toLowerCase();
  const currency = currencyToken.includes("eur") || currencyToken.includes("€")
    ? "EUR"
    : currencyToken.includes("usd") || currencyToken.includes("$") || currencyToken.includes("dollar")
      ? "USD"
      : "GBP";

  return {
    amount: Number(match[1]),
    currency
  };
}

function extractTravelers(prompt: string): number {
  const people = prompt.match(/(\d{1,2})\s*(people|travellers|travelers|adults|friends)/);
  return people ? Math.max(1, Math.min(12, Number(people[1]))) : 1;
}

function clampDays(days: number): number {
  return Math.max(1, Math.min(14, days));
}
