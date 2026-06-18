import { readAuditEntries } from "../server/services/auditStore.js";

export default {
  async fetch(request: Request) {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? 25);
    return Response.json({ entries: await readAuditEntries(limit) });
  }
};
