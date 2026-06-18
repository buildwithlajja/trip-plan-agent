import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AuditEntry, AuditMetrics } from "../types.js";

const dataDir = process.env.APP_DATA_DIR ?? "./data";
const auditPath = path.resolve(dataDir, "audit-log.jsonl");
const auditKey = process.env.AUDIT_REDIS_KEY ?? "trip-planner:audit-log";
const maxAuditEntries = 100;
const memoryAuditLog: AuditEntry[] = [];

export async function appendAuditEntry(entry: AuditEntry): Promise<void> {
  if (hasUpstash()) {
    await redisCommand<number>(["LPUSH", auditKey, JSON.stringify(entry)]);
    await redisCommand<string>(["LTRIM", auditKey, 0, maxAuditEntries - 1]);
    return;
  }

  if (isVercel()) {
    memoryAuditLog.unshift(entry);
    memoryAuditLog.splice(maxAuditEntries);
    return;
  }

  await mkdir(path.dirname(auditPath), { recursive: true });
  await writeFile(auditPath, `${JSON.stringify(entry)}\n`, { flag: "a" });
}

export async function readAuditEntries(limit = 25): Promise<AuditEntry[]> {
  if (hasUpstash()) {
    const rows = await redisCommand<string[]>(["LRANGE", auditKey, 0, Math.max(0, limit - 1)]);
    return rows.map(parseAuditEntry).filter(Boolean) as AuditEntry[];
  }

  if (isVercel()) {
    return memoryAuditLog.slice(0, limit);
  }

  try {
    const content = await readFile(auditPath, "utf8");
    return content
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as AuditEntry)
      .reverse()
      .slice(0, limit);
  } catch {
    return [];
  }
}

export async function auditMetrics(): Promise<AuditMetrics> {
  const entries = await readAuditEntries(1000);
  const agentCounts: Record<string, number> = {};
  let totalDuration = 0;

  for (const entry of entries) {
    totalDuration += entry.durationMs;
    for (const agent of entry.agents) {
      agentCounts[agent.agent] = (agentCounts[agent.agent] ?? 0) + 1;
    }
  }

  const logFileBytes = storageMode() === "jsonl"
    ? await stat(auditPath).then((value) => value.size).catch(() => 0)
    : 0;

  return {
    totalRequests: entries.length,
    agentCounts,
    averageDurationMs: entries.length ? Math.round(totalDuration / entries.length) : 0,
    logFileBytes,
    storage: storageMode()
  };
}

function hasUpstash(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function isVercel(): boolean {
  return process.env.VERCEL === "1";
}

function storageMode(): AuditMetrics["storage"] {
  if (hasUpstash()) return "upstash-redis";
  if (isVercel()) return "memory";
  return "jsonl";
}

async function redisCommand<T>(command: Array<string | number>): Promise<T> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) throw new Error("Upstash Redis is not configured");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(command)
  });

  const payload = await response.json() as { result?: T; error?: string };
  if (!response.ok || payload.error) {
    throw new Error(payload.error ?? `Upstash request failed with ${response.status}`);
  }

  return payload.result as T;
}

function parseAuditEntry(value: string): AuditEntry | undefined {
  try {
    return JSON.parse(value) as AuditEntry;
  } catch {
    return undefined;
  }
}
