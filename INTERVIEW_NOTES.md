# Interview Notes

Use this as your own checklist while screen sharing.

## Short Opening

This project is a small multi-agent trip planner. The key part is the backend orchestrator: it parses the request, decides the agent order, records why each agent ran, and returns one answer to the UI.

## Files To Open

1. `src/main.tsx` - form, loading state, result, agent trace, audit panel.
2. `src/api.ts` - the frontend API calls.
3. `server/index.ts` - HTTP routes and audit write after each plan request.
4. `server/services/orchestrator.ts` - main assignment logic.
5. `server/agents/destinationAgent.ts` - hard constraints and destination ranking.
6. `server/agents/itineraryAgent.ts` - day-by-day plan generation.
7. `server/agents/budgetAgent.ts` - cost estimate and over-budget warning.
8. `server/services/auditStore.ts` - JSONL persistence.
9. `ARCHITECTURE_NOTE.md` - Azure production plan.

## What To Say About AI Assistance

The assignment says AI coding assistants are allowed. A good answer is:

"I used AI assistance to move faster on scaffolding and then reviewed the structure myself. The design choices I own are the orchestrator-first backend, separate agent modules, deterministic budget checks, and JSONL audit trail."

## Tradeoffs To Mention

- No full authentication because the time box is about orchestration.
- No live flight or hotel API because that would shift the work away from agents.
- JSONL is enough for the assignment, but production should use PostgreSQL or Cosmos DB.
- Groq is optional; the app still works without a key.
