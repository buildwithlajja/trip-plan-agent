import type { DestinationSuggestion, ParsedTripRequest } from "../types.js";
import { toGbp } from "../lib/currency.js";

const DESTINATIONS: DestinationSuggestion[] = [
  {
    name: "Lisbon",
    country: "Portugal",
    climate: "warm",
    estimatedDailyCostGbp: 125,
    estimatedFlightGbp: 180,
    bestFor: ["food", "culture", "architecture", "nightlife"],
    whyItFits: [
      "Warm shoulder-season weather and easy city logistics.",
      "Strong value compared with many western European capitals.",
      "Good mix of food, viewpoints, neighbourhood walks, and day trips."
    ]
  },
  {
    name: "Valencia",
    country: "Spain",
    climate: "warm",
    estimatedDailyCostGbp: 115,
    estimatedFlightGbp: 170,
    bestFor: ["beach", "food", "architecture", "family"],
    whyItFits: [
      "Beach, old town, and modern architecture are close together.",
      "Usually cheaper than Barcelona while still feeling lively.",
      "Works well for a relaxed trip with short local travel times."
    ]
  },
  {
    name: "Athens",
    country: "Greece",
    climate: "warm",
    estimatedDailyCostGbp: 120,
    estimatedFlightGbp: 220,
    bestFor: ["history", "food", "culture", "museums"],
    whyItFits: [
      "Excellent history and food density for a short itinerary.",
      "Warm climate and strong public transport around the centre.",
      "Can stay within a mid-range budget with careful hotel choices."
    ]
  },
  {
    name: "Malaga",
    country: "Spain",
    climate: "warm",
    estimatedDailyCostGbp: 105,
    estimatedFlightGbp: 190,
    bestFor: ["beach", "food", "museums", "nature"],
    whyItFits: [
      "Warm coastal weather and a compact historic centre.",
      "Good value for accommodation outside peak summer.",
      "Easy access to beaches and nearby Andalusian towns."
    ]
  },
  {
    name: "Barcelona",
    country: "Spain",
    climate: "warm",
    estimatedDailyCostGbp: 165,
    estimatedFlightGbp: 190,
    bestFor: ["architecture", "food", "beach", "nightlife"],
    whyItFits: [
      "Excellent fit for architecture, food, and beach access.",
      "Very easy to fill five days without long transfers.",
      "Costs are higher, so it only fits looser budgets."
    ]
  }
];

export function runDestinationAgent(parsed: ParsedTripRequest): DestinationSuggestion[] {
  const budgetGbp = toGbp(parsed.budget);
  const days = parsed.days ?? 5;

  return DESTINATIONS.filter((destination) => {
    if (parsed.climate && destination.climate !== parsed.climate) return false;

    const estimatedTotal = destination.estimatedFlightGbp + destination.estimatedDailyCostGbp * days;
    if (budgetGbp && estimatedTotal > budgetGbp) return false;

    return true;
  })
    .map((destination) => ({
      ...destination,
      whyItFits: addPreferenceJustifications(destination, parsed)
    }))
    .sort((a, b) => scoreDestination(b, parsed) - scoreDestination(a, parsed))
    .slice(0, 3);
}

export function getDestinationByName(name: string): DestinationSuggestion | undefined {
  return DESTINATIONS.find((destination) => destination.name.toLowerCase() === name.toLowerCase());
}

function addPreferenceJustifications(
  destination: DestinationSuggestion,
  parsed: ParsedTripRequest
): string[] {
  const reasons = [...destination.whyItFits];
  const matchedInterests = parsed.interests.filter((interest) =>
    destination.bestFor.includes(interest)
  );

  if (matchedInterests.length > 0) {
    reasons.push(`Matches stated interests: ${matchedInterests.join(", ")}.`);
  }

  if (parsed.budget) {
    reasons.push("Estimated costs are kept inside the stated hard budget.");
  }

  return reasons;
}

function scoreDestination(destination: DestinationSuggestion, parsed: ParsedTripRequest): number {
  const interestScore = parsed.interests.filter((interest) =>
    destination.bestFor.includes(interest)
  ).length;
  const affordabilityScore = 250 - destination.estimatedDailyCostGbp;
  return interestScore * 100 + affordabilityScore;
}
