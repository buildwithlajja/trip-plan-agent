import { describe, expect, it } from "vitest";
import { parseTripRequest } from "./requestParser.js";

describe("parseTripRequest", () => {
  it("extracts days, warm climate, interests, and GBP budget", () => {
    const parsed = parseTripRequest(
      "Plan a five day trip somewhere warm in Europe for under 1500 pounds with food and history."
    );

    expect(parsed.days).toBe(5);
    expect(parsed.climate).toBe("warm");
    expect(parsed.region).toBe("Europe");
    expect(parsed.budget).toEqual({ amount: 1500, currency: "GBP" });
    expect(parsed.interests).toEqual(expect.arrayContaining(["food", "history"]));
  });
});
