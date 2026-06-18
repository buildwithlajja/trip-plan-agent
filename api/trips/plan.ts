import { appendAuditEntry } from "../../server/services/auditStore.js";
import { orchestrateTripRequest } from "../../server/services/orchestrator.js";
import type { UserRole } from "../../server/types.js";

export default {
  async fetch(request: Request) {
    if (request.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const startedAt = Date.now();
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const role: UserRole = body.role === "reviewer" ? "reviewer" : "traveler";

    if (prompt.length < 8 || prompt.length > 2000) {
      return Response.json(
        { error: "Describe the trip in 8 to 2000 characters." },
        { status: 400 }
      );
    }

    try {
      const result = await orchestrateTripRequest({ prompt, role });
      await appendAuditEntry({
        id: result.id,
        createdAt: result.createdAt,
        prompt,
        role,
        parsedRequest: result.parsedRequest,
        agents: result.contributions.map((contribution) => ({
          agent: contribution.agent,
          reason: contribution.reason,
          status: contribution.status
        })),
        durationMs: Date.now() - startedAt
      });

      return Response.json(result);
    } catch (error) {
      return Response.json(
        { error: error instanceof Error ? error.message : "Unexpected planning failure" },
        { status: 500 }
      );
    }
  }
};
