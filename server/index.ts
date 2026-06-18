import { createReadStream, existsSync, readFileSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import path, { extname } from "node:path";
import { fileURLToPath } from "node:url";
import { appendAuditEntry, auditMetrics, readAuditEntries } from "./services/auditStore.js";
import { orchestrateTripRequest } from "./services/orchestrator.js";
import type { UserRole } from "./types.js";

loadDotEnv();

const port = Number(process.env.PORT ?? 8787);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, "../client");

const server = createServer(async (req, res) => {
  try {
    await route(req, res);
  } catch (error) {
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : "Unexpected server error"
    });
  }
});

server.listen(port, () => {
  console.log(`Trip planner API listening on http://localhost:${port}`);
});

async function route(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, { ok: true, timestamp: new Date().toISOString() });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/trips/plan") {
    await handlePlanTrip(req, res);
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/audit") {
    const limit = Number(url.searchParams.get("limit") ?? 25);
    sendJson(res, 200, { entries: await readAuditEntries(limit) });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/metrics") {
    sendJson(res, 200, await auditMetrics());
    return;
  }

  if (req.method === "GET") {
    serveStatic(url.pathname, res);
    return;
  }

  sendJson(res, 405, { error: "Method not allowed" });
}

async function handlePlanTrip(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const startedAt = Date.now();
  const body = await readJson(req);
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const role: UserRole = body.role === "reviewer" ? "reviewer" : "traveler";

  if (prompt.length < 8 || prompt.length > 2000) {
    sendJson(res, 400, { error: "Describe the trip in 8 to 2000 characters." });
    return;
  }

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

  sendJson(res, 200, result);
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let total = 0;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > 1_000_000) throw new Error("Request body is too large");
    chunks.push(buffer);
  }

  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>;
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload)
  });
  res.end(payload);
}

function serveStatic(requestPath: string, res: ServerResponse): void {
  const safePath = requestPath === "/" ? "/index.html" : requestPath;
  const filePath = path.resolve(clientDist, `.${safePath}`);
  const targetPath = filePath.startsWith(clientDist) && existsSync(filePath)
    ? filePath
    : path.join(clientDist, "index.html");

  if (!existsSync(targetPath)) {
    sendJson(res, 404, { error: "Client build not found. Run npm run build first." });
    return;
  }

  res.writeHead(200, { "Content-Type": contentType(extname(targetPath)) });
  createReadStream(targetPath).pipe(res);
}

function contentType(extension: string): string {
  return {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".ico": "image/x-icon"
  }[extension] ?? "application/octet-stream";
}

function loadDotEnv(): void {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;

  const content = readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!match || process.env[match[1]] !== undefined) continue;
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}
