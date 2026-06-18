import { randomUUID } from "node:crypto";
import { runBudgetAgent } from "../agents/budgetAgent.js";
import {
  getDestinationByName,
  runDestinationAgent
} from "../agents/destinationAgent.js";
import { runItineraryAgent } from "../agents/itineraryAgent.js";
import { formatGbp } from "../lib/currency.js";
import { parseTripRequest } from "../lib/requestParser.js";
import type {
  AgentContribution,
  BudgetEstimate,
  DayPlan,
  DestinationSuggestion,
  OrchestratedTripResponse,
  TripRequest
} from "../types.js";
import { maybeGenerateWithLlm } from "./llm.js";

export async function orchestrateTripRequest(
  input: TripRequest
): Promise<OrchestratedTripResponse> {
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const parsedRequest = parseTripRequest(input.prompt);
  const contributions: AgentContribution[] = [];

  let destinationOptions: DestinationSuggestion[] = [];
  let chosenDestination: DestinationSuggestion | undefined;
  let itinerary: DayPlan[] = [];
  let budget: BudgetEstimate | undefined;

  try {
    destinationOptions = runDestinationAgent(parsedRequest);
    chosenDestination = parsedRequest.destinationHint
      ? getDestinationByName(parsedRequest.destinationHint) ?? destinationOptions[0]
      : destinationOptions[0];

    contributions.push({
      agent: "destination",
      reason: "The request needed a destination that satisfies climate, interest, and budget constraints.",
      status: "completed",
      summary: destinationOptions.length
        ? `Suggested ${destinationOptions.map((destination) => destination.name).join(", ")}.`
        : "No destination could satisfy all hard constraints.",
      data: destinationOptions
    });
  } catch (error) {
    contributions.push(failedContribution("destination", error));
  }

  if (chosenDestination) {
    try {
      itinerary = runItineraryAgent(chosenDestination, parsedRequest);
      contributions.push({
        agent: "itinerary",
        reason: "A trip plan requires day-by-day sequencing for the selected destination.",
        status: "completed",
        summary: `Built a ${itinerary.length}-day plan for ${chosenDestination.name}.`,
        data: itinerary
      });
    } catch (error) {
      contributions.push(failedContribution("itinerary", error));
    }

    try {
      budget = runBudgetAgent(chosenDestination, itinerary, parsedRequest);
      contributions.push({
        agent: "budget",
        reason: parsedRequest.budget
          ? "The user gave a hard budget, so the plan must be checked and never silently exceed it."
          : "The user did not give a budget, but an estimate helps make the plan actionable.",
        status: "completed",
        summary: budget.status === "over_budget"
          ? `Flagged an overage at ${formatGbp(budget.totalGbp)}.`
          : `Estimated total cost at ${formatGbp(budget.totalGbp)}.`,
        data: budget
      });
    } catch (error) {
      contributions.push(failedContribution("budget", error));
    }
  }

  const fallbackAnswer = buildDeterministicAnswer({
    destinationOptions,
    chosenDestination,
    itinerary,
    budget
  });

  const answer = await synthesizeAnswer(input.prompt, fallbackAnswer, contributions);

  return {
    id,
    createdAt,
    parsedRequest,
    chosenDestination,
    answer,
    contributions
  };
}

function failedContribution(agent: AgentContribution["agent"], error: unknown): AgentContribution {
  return {
    agent,
    reason: "The orchestrator attempted to run this agent for the request.",
    status: "failed",
    summary: "Agent failed; the response continues with the available outputs.",
    error: error instanceof Error ? error.message : "Unknown error"
  };
}

async function synthesizeAnswer(
  prompt: string,
  fallbackAnswer: string,
  contributions: AgentContribution[]
): Promise<string> {
  try {
    const llmAnswer = await maybeGenerateWithLlm([
      {
        role: "system",
        content:
          "You synthesize outputs from destination, itinerary, and budget agents into a concise travel-planning answer. Preserve budget warnings and uncertainty notes."
      },
      {
        role: "user",
        content: JSON.stringify({ prompt, contributions, fallbackAnswer }, null, 2)
      }
    ]);

    return llmAnswer?.trim() || fallbackAnswer;
  } catch {
    return `${fallbackAnswer}\n\nNote: The optional LLM synthesis failed, so this response uses the deterministic agent summary.`;
  }
}

function buildDeterministicAnswer(input: {
  destinationOptions: DestinationSuggestion[];
  chosenDestination?: DestinationSuggestion;
  itinerary: DayPlan[];
  budget?: BudgetEstimate;
}): string {
  if (!input.chosenDestination) {
    return "I could not find a destination that satisfies all hard constraints. Try increasing the budget, shortening the trip, or relaxing the climate/region requirement.";
  }

  const destinationLines = input.destinationOptions
    .map((destination) => {
      const reasons = destination.whyItFits.map((reason) => `  - ${reason}`).join("\n");
      return `- ${destination.name}, ${destination.country}\n${reasons}`;
    })
    .join("\n");

  const itineraryLines = input.itinerary
    .map(
      (day) =>
        `Day ${day.day}: ${day.title}\n- Morning: ${day.morning}\n- Afternoon: ${day.afternoon}\n- Evening: ${day.evening}\n- Realism: ${day.realismNote}`
    )
    .join("\n\n");

  const budgetLines = input.budget
    ? [
        `Budget check: ${input.budget.recommendation}`,
        ...input.budget.breakdown.map((item) => `- ${item.item}: ${formatGbp(item.amountGbp)}`)
      ].join("\n")
    : "Budget check: No estimate available.";

  return [
    `Recommended plan: ${input.chosenDestination.name}, ${input.chosenDestination.country}`,
    "",
    "Destination options considered:",
    destinationLines,
    "",
    "Day-by-day itinerary:",
    itineraryLines,
    "",
    budgetLines
  ].join("\n");
}
