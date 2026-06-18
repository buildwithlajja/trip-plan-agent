import type {
  BudgetEstimate,
  DayPlan,
  DestinationSuggestion,
  ParsedTripRequest
} from "../types.js";
import { formatGbp, toGbp } from "../lib/currency.js";

export function runBudgetAgent(
  destination: DestinationSuggestion,
  days: DayPlan[],
  parsed: ParsedTripRequest
): BudgetEstimate {
  const accommodation = destination.estimatedDailyCostGbp * days.length * 0.48;
  const food = destination.estimatedDailyCostGbp * days.length * 0.28;
  const localTransport = destination.estimatedDailyCostGbp * days.length * 0.1;
  const activities = destination.estimatedDailyCostGbp * days.length * 0.14;
  const flights = destination.estimatedFlightGbp;
  const total = Math.round(accommodation + food + localTransport + activities + flights);
  const budgetGbp = toGbp(parsed.budget);
  const status = budgetGbp === undefined
    ? "unknown_budget"
    : total <= budgetGbp
      ? "within_budget"
      : "over_budget";

  return {
    destination: destination.name,
    totalGbp: total,
    budgetGbp,
    status,
    breakdown: [
      { item: "Return flights or rail", amountGbp: Math.round(flights) },
      { item: "Accommodation", amountGbp: Math.round(accommodation) },
      { item: "Food and drinks", amountGbp: Math.round(food) },
      { item: "Local transport", amountGbp: Math.round(localTransport) },
      { item: "Activities", amountGbp: Math.round(activities) }
    ],
    recommendation: recommendation(status, total, budgetGbp)
  };
}

function recommendation(
  status: BudgetEstimate["status"],
  total: number,
  budgetGbp?: number
): string {
  if (status === "unknown_budget") {
    return "No hard budget was provided, so this is a planning estimate rather than a pass/fail check.";
  }

  if (status === "within_budget") {
    return `Estimated total ${formatGbp(total)} is within the stated budget of ${formatGbp(budgetGbp ?? 0)}.`;
  }

  return `Estimated total ${formatGbp(total)} exceeds the stated budget of ${formatGbp(
    budgetGbp ?? 0
  )}. Reduce hotel standard, shorten the trip, or switch to a lower-cost destination such as Malaga or Valencia.`;
}
