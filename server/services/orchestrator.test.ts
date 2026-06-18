import { describe, expect, it } from "vitest";
import { orchestrateTripRequest } from "./orchestrator.js";

describe("orchestrateTripRequest", () => {
  it("runs all three agents for a normal constrained trip request", async () => {
    const response = await orchestrateTripRequest({
      role: "traveler",
      prompt: "Plan a five day trip somewhere warm in Europe for under 1500 pounds."
    });

    expect(response.contributions.map((item) => item.agent)).toEqual([
      "destination",
      "itinerary",
      "budget"
    ]);
    expect(response.answer).toContain("Budget check");
  });

  it("does not pick a destination that breaks a hard budget", async () => {
    const response = await orchestrateTripRequest({
      role: "traveler",
      prompt: "Plan a seven day warm Europe trip for under 600 pounds."
    });

    expect(response.chosenDestination).toBeUndefined();
    expect(response.answer).toContain("could not find");
  });
});
