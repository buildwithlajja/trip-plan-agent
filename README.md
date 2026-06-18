# Multi-Agent Trip Planner

A take-home assignment implementation for a React 18 + TypeScript web app with a Node.js backend. The app routes natural-language trip requests through three distinct agents:

- Destination Agent: suggests destinations that satisfy hard constraints.
- Itinerary Agent: creates a realistic day-by-day plan.
- Budget Agent: estimates cost and flags over-budget plans.



## Run Locally

1. Install Node.js 20 or newer.
2. Copy environment settings:

```bash
cp .env.example .env
```

3. Install dependencies:

```bash
npm install
```

4. Start the app in development:

```bash
npm run dev
```

5. Open `http://localhost:5173`.

The frontend runs on Vite and proxies `/api` requests to the backend on `http://localhost:8787`.

## Production Build

```bash
npm run build
npm start
```

Then open `http://localhost:8787`. In production mode the Node server serves the compiled React app and API from one process.

## Optional Groq API

The app works without an API key using deterministic agent logic. To enable live model synthesis, set these in `.env`:

```bash
GROQ_API_KEY=your_free_groq_key
GROQ_MODEL=llama-3.3-70b-versatile
```

The agent rules and budget checks stay deterministic. Groq only polishes the final wording when a key is available.

## Useful Commands

```bash
npm run typecheck
npm test
npm run build
```

## Deploy

Use a free Node-capable host such as Render, Fly.io, Railway, or Azure App Service free/student credits.

- Build command: `npm install && npm run build`
- Start command: `npm start`
- Environment: copy `.env.example` values, but never commit real keys.

For Vercel, deploy as a Node server only if using custom server support; otherwise split the Vite app and API into separate services.

## Review Notes

The most important file to walk through is `server/services/orchestrator.ts`. It shows the chain from prompt parsing to destination selection, itinerary building, budget checking, final synthesis, and audit logging.

The destination data is intentionally small. I used it as a stand-in for a travel API so the assignment stays focused on orchestration rather than external data plumbing.
