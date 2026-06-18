import { auditMetrics } from "../server/services/auditStore.js";

export default {
  async fetch() {
    return Response.json(await auditMetrics());
  }
};
