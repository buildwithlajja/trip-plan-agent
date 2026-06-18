import type { DayPlan, DestinationSuggestion, ParsedTripRequest } from "../types.js";

const THEMES = [
  {
    title: "Arrival, orientation, and neighbourhood food",
    morning: "Arrive, check in, and keep the first transfer simple.",
    afternoon: "Walk the central neighbourhoods and choose one low-friction landmark.",
    evening: "Book dinner close to the hotel so the first day is not overloaded."
  },
  {
    title: "Old town, signature sights, and local markets",
    morning: "Start early at the headline historic sight before peak crowds.",
    afternoon: "Use a nearby market or casual lunch stop, then explore adjacent streets on foot.",
    evening: "Choose a relaxed tasting menu, tapas crawl, or family-run restaurant."
  },
  {
    title: "Culture day with a slower afternoon",
    morning: "Visit one major museum or cultural site and avoid stacking distant attractions.",
    afternoon: "Schedule cafe time and a second nearby stop only if energy allows.",
    evening: "Find a viewpoint, waterfront walk, or live music option."
  },
  {
    title: "Beach, nature, or day-trip loop",
    morning: "Take the shortest sensible route to a beach, garden, or nearby town.",
    afternoon: "Keep the return flexible and avoid late cross-city transfers.",
    evening: "Eat near the return point rather than crossing town again."
  },
  {
    title: "Open choice and departure buffer",
    morning: "Use this slot for a favourite neighbourhood, shopping, or one missed sight.",
    afternoon: "Leave a buffer for packing, airport transfer, or train station logistics.",
    evening: "If staying overnight, finish with a simple dinner near accommodation."
  }
];

export function runItineraryAgent(
  destination: DestinationSuggestion,
  parsed: ParsedTripRequest
): DayPlan[] {
  const days = parsed.days ?? 5;
  return Array.from({ length: days }, (_, index) => {
    const theme = THEMES[Math.min(index, THEMES.length - 1)];
    return {
      day: index + 1,
      title: `${destination.name}: ${theme.title}`,
      morning: personalize(theme.morning, destination, parsed),
      afternoon: personalize(theme.afternoon, destination, parsed),
      evening: personalize(theme.evening, destination, parsed),
      realismNote:
        "Sequencing keeps activities in the same area where possible; exact travel times should be checked against live maps and opening hours."
    };
  });
}

function personalize(
  text: string,
  destination: DestinationSuggestion,
  parsed: ParsedTripRequest
): string {
  const interest = parsed.interests.find((item) => destination.bestFor.includes(item));
  if (!interest) return text;
  return `${text} Prioritise ${interest} because it was named in the request.`;
}
