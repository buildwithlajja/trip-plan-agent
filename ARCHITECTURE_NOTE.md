# Production Architecture Note

On Azure, I would deploy the React build to Azure Static Web Apps or Front Door + Storage, and the Node API to Azure Container Apps. Infrastructure would be provisioned with Terraform or Bicep through CI/CD, with separate dev, staging, and production environments. Agent calls would move behind an internal orchestration service using Azure OpenAI or approved external model gateways, with retries, timeouts, prompt/version tracking, and per-agent circuit breakers. Audit data would be stored in Azure PostgreSQL or Cosmos DB with append-only interaction records and retention policies.

For 500+ concurrent users, Container Apps would autoscale on HTTP concurrency and queue depth. Slow agent work could be moved to Azure Service Bus plus worker containers when requests become long-running, with the frontend receiving progress over Server-Sent Events or WebSockets. Caching destination metadata and model-independent parsing would reduce repeated model calls.

Enterprise authentication would use Microsoft Entra ID with OIDC. The API would validate JWTs, map users and groups to application roles, and enforce row-level access for audit logs and admin metrics. Secrets would live in Azure Key Vault with managed identities, not environment files.

Monitoring would use Application Insights, Log Analytics, distributed tracing, structured JSON logs, model latency/error metrics, token/cost dashboards, and alerts for elevated failure rates, latency, and budget anomalies. I would also add prompt evaluation tests and red-team checks before production rollout.
