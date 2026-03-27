# Cloudflare Deployment Guide — MailGuard

> **Fully free tier deployment** using Cloudflare Pages, Workers, Workers AI,
> Workers KV, and Cloudflare Tunnel.
>
> No credit card required for the free tier limits listed here.
> All services used here are free forever (not free trial).

---

## Free Tier Limits Summary

| Service | What You Get Free | MailGuard Usage |
|---------|------------------|-----------------|
| **Pages** | Unlimited bandwidth, 500 builds/mo | React frontend |
| **Workers** | 100k requests/day, 3MB script | DNS logic + routing |
| **Workers KV** | 1GB storage, 100k reads/day, 1k writes/day | History (50 entries) |
| **Workers AI** | 10k Neurons/day | AI scoring (replaces Python) |
| **Tunnel** | Completely free, no limits | Expose Go + Rust from VPS |
| **D1 (SQLite)** | 500MB/DB, 5GB total | Optional persistent history |

---

## Two Deployment Options

### Option A — Pure Cloudflare (recommended)

Everything runs on Cloudflare. The Go API DNS logic is rewritten as a TypeScript
Worker. Rust runs as a WASM Worker. AI scoring uses Workers AI (Llama 3) instead
of Claude. **$0/month, no VPS needed.**

### Option B — Hybrid (keep your Go + Python, add Cloudflare)

Go API and Python scorer run on a free VPS (Oracle Cloud Always Free or Fly.io).
Cloudflare Tunnel exposes them. React runs on Pages. Rust runs on Workers.
**$0/month, requires a free VPS account.**

---

## Option A — Pure Cloudflare

```
Browser
  |
  ↓ HTTPS
Cloudflare Pages (React build)
  |
  ↓ /api/* via Pages Function
Cloudflare Worker (DNS checker — TypeScript)
  ├── DNS lookups via 1.1.1.1 DoH API
  ├── Calls Rust Worker for parsing
  ├── Calls Workers AI for scoring
  └── Stores history in Workers KV
       |
       ├── Rust Worker (WASM)       ← parser/
       └── Workers AI               ← @cf/meta/llama-3.1-8b-instruct
```

### Step 1 — Install Wrangler

```bash
npm install -g wrangler
wrangler login
```

### Step 2 — Deploy the React Frontend to Pages

```bash
cd web
npm run build

# Deploy to Pages (first time)
wrangler pages project create mailguard

# Deploy build output
wrangler pages deploy dist --project-name mailguard
```

Your frontend is now live at `https://mailguard.pages.dev`.

For subsequent deploys, connect your GitHub repo in the Cloudflare dashboard for
auto-deploy on push (Settings → Pages → Connect Git).

### Step 3 — TypeScript Worker (replaces Go API)

The Go DNS logic is 30 lines. In a Worker it uses Cloudflare's own 1.1.1.1 API.

Create `workers/dns-checker/`:

```
workers/dns-checker/
├── wrangler.toml
├── package.json
├── tsconfig.json
└── src/
    └── index.ts
```

`wrangler.toml`:
```toml
name = "mailguard-dns"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "HISTORY"
id = "YOUR_KV_NAMESPACE_ID"     # fill after Step 4

[ai]
binding = "AI"
```

`src/index.ts`:
```ts
export interface Env {
  HISTORY: KVNamespace
  AI: Ai
}

const DOH = "https://cloudflare-dns.com/dns-query"

async function dnsLookup(name: string, type: string): Promise<any[]> {
  const url = `${DOH}?name=${encodeURIComponent(name)}&type=${type}`
  const res = await fetch(url, { headers: { Accept: "application/dns-json" } })
  const data = await res.json() as any
  return data.Answer ?? []
}

async function checkDomain(domain: string, env: Env): Promise<any> {
  const [mxAnswers, txtAnswers, dmarcAnswers] = await Promise.all([
    dnsLookup(domain, "MX"),
    dnsLookup(domain, "TXT"),
    dnsLookup(`_dmarc.${domain}`, "TXT"),
  ])

  const mx = {
    present: mxAnswers.length > 0,
    records: mxAnswers.map(r => ({
      host: r.data.split(" ")[1],
      priority: parseInt(r.data.split(" ")[0]),
    })),
  }

  const spfRecord = txtAnswers.find(r => r.data?.includes("v=spf1"))
  const spf = {
    present: !!spfRecord,
    rawRecord: spfRecord?.data ?? null,
  }

  const dmarcRecord = dmarcAnswers.find(r => r.data?.includes("v=DMARC1"))
  const dmarc = {
    present: !!dmarcRecord,
    rawRecord: dmarcRecord?.data ?? null,
  }

  // AI scoring via Workers AI
  const score = await scoreWithAI(domain, { mx, spf, dmarc }, env)

  const result = { domain, checkedAt: new Date().toISOString(), mx, spf, dmarc, score }

  // Save to KV history (LIFO, keep last 50)
  const historyRaw = await env.HISTORY.get("history")
  const history: any[] = historyRaw ? JSON.parse(historyRaw) : []
  history.unshift({ domain, checkedAt: result.checkedAt, grade: score?.grade, score: score?.score,
    hasMX: mx.present, hasSPF: spf.present, hasDMARC: dmarc.present })
  if (history.length > 50) history.pop()
  await env.HISTORY.put("history", JSON.stringify(history))

  return result
}

async function scoreWithAI(domain: string, data: any, env: Env): Promise<any> {
  try {
    const prompt = `You are an email security auditor. Analyze this DNS data and respond with ONLY valid JSON.
Domain: ${domain}
MX present: ${data.mx.present}
SPF present: ${data.spf.present}, record: ${data.spf.rawRecord ?? "none"}
DMARC present: ${data.dmarc.present}, record: ${data.dmarc.rawRecord ?? "none"}

Respond with exactly this JSON structure:
{"score":<0-100>,"grade":<"A"|"B"|"C"|"D"|"F">,"riskLevel":<"low"|"medium"|"high"|"critical">,"summary":"<one sentence>","recommendations":["<rec1>","<rec2>","<rec3>"],"breakdown":{"mxScore":<0-30>,"spfScore":<0-35>,"dmarcScore":<0-35>,"maxPossible":100},"aiGenerated":true}`

    const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      prompt,
      max_tokens: 400,
    }) as any

    const text = response.response?.trim() ?? ""
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("No JSON in response")
    return JSON.parse(jsonMatch[0])
  } catch {
    // Deterministic fallback
    return fallbackScore(data)
  }
}

function fallbackScore(data: any) {
  let score = 0
  const recs: string[] = []

  if (data.mx.present) score += 25; else recs.push("Add MX records for email delivery.")
  if (data.spf.present) {
    score += 20
    if (data.spf.rawRecord?.includes("-all")) score += 10
    else if (data.spf.rawRecord?.includes("~all")) score += 5
  } else recs.push("Add an SPF record (v=spf1 ... -all).")
  if (data.dmarc.present) {
    score += 15
    if (data.dmarc.rawRecord?.includes("p=reject")) score += 15
    else if (data.dmarc.rawRecord?.includes("p=quarantine")) score += 8
    if (!data.dmarc.rawRecord?.includes("p=reject"))
      recs.push("Upgrade DMARC to p=reject.")
  } else recs.push("Add a DMARC record.")

  while (recs.length < 3) recs.push("Monitor DMARC reports for phishing attempts.")

  const grade = score >= 90 ? "A" : score >= 75 ? "B" : score >= 50 ? "C" : score >= 25 ? "D" : "F"
  const riskLevel = score >= 75 ? "low" : score >= 50 ? "medium" : score >= 25 ? "high" : "critical"

  return { score, grade, riskLevel, summary: `Score: ${score}/100`, recommendations: recs.slice(0, 3),
    breakdown: { mxScore: data.mx.present ? 30 : 0, spfScore: data.spf.present ? 25 : 0,
      dmarcScore: data.dmarc.present ? 30 : 0, maxPossible: 100 }, aiGenerated: false }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS" }

    if (request.method === "OPTIONS") return new Response(null, { headers: cors })

    // POST /api/v1/check
    if (url.pathname === "/api/v1/check" && request.method === "POST") {
      const { domain } = await request.json() as any
      const result = await checkDomain(domain.trim(), env)
      return Response.json(result, { headers: cors })
    }

    // POST /api/v1/bulk
    if (url.pathname === "/api/v1/bulk" && request.method === "POST") {
      const { domains } = await request.json() as any
      const limited = (domains as string[]).slice(0, 20)
      const results = await Promise.all(limited.map(d => checkDomain(d.trim(), env)))
      return Response.json({ results, totalChecked: results.length }, { headers: cors })
    }

    // GET /api/v1/history
    if (url.pathname === "/api/v1/history") {
      const raw = await env.HISTORY.get("history")
      return Response.json({ entries: raw ? JSON.parse(raw) : [] }, { headers: cors })
    }

    // GET /api/v1/export
    if (url.pathname === "/api/v1/export") {
      const raw = await env.HISTORY.get("history")
      const entries: any[] = raw ? JSON.parse(raw) : []
      const csv = ["domain,checkedAt,grade,score,hasMX,hasSPF,hasDMARC",
        ...entries.map(e => `${e.domain},${e.checkedAt},${e.grade},${e.score},${e.hasMX},${e.hasSPF},${e.hasDMARC}`)
      ].join("\n")
      return new Response(csv, {
        headers: { ...cors, "Content-Type": "text/csv",
          "Content-Disposition": 'attachment; filename="mailguard-export.csv"' }
      })
    }

    return new Response("Not found", { status: 404 })
  }
}
```

### Step 4 — Create Workers KV Namespace

```bash
wrangler kv namespace create HISTORY
# Copy the ID it gives you into wrangler.toml [[kv_namespaces]] id = "..."
```

### Step 5 — Deploy the DNS Worker

```bash
cd workers/dns-checker
wrangler deploy
```

Worker is now live at `https://mailguard-dns.YOUR_SUBDOMAIN.workers.dev`.

### Step 6 — Connect Pages to the Worker

In `web/vite.config.ts`, the proxy is for dev only. For production, add a
`_routes.json` and a Pages Function to proxy `/api/*` to your Worker.

`web/public/_routes.json`:
```json
{
  "version": 1,
  "include": ["/*"],
  "exclude": []
}
```

`web/functions/api/[[path]].ts`:
```ts
export async function onRequest(context: any) {
  const url = new URL(context.request.url)
  const workerUrl = `https://mailguard-dns.YOUR_SUBDOMAIN.workers.dev${url.pathname}${url.search}`
  return fetch(workerUrl, context.request)
}
```

Redeploy Pages:
```bash
npm run build && wrangler pages deploy dist --project-name mailguard
```

### Step 7 — Rust WASM Worker (Optional for Option A)

Deploy the Rust parser as a separate Worker that the TypeScript Worker calls internally.

```bash
cd parser
cargo install worker-build
worker-build --release
wrangler deploy
```

In the TypeScript Worker, replace the inline parsing logic with a fetch to the Rust Worker URL.

---

## Option B — Hybrid (Keep Go + Python, Use Tunnel)

```
Browser
  |
  ↓ HTTPS
Cloudflare Pages (React)
  |
  ↓ /api/* via Pages Function
Cloudflare Tunnel
  |
  ↓ routes to VPS
Free VPS (Oracle Cloud Always Free)
  ├── Go API :8082
  ├── Python scorer :8000
  └── Rust parser :7070 (or run as Workers WASM)
```

### Recommended Free VPS Options

| Provider | Free Tier | Notes |
|----------|-----------|-------|
| **Oracle Cloud Always Free** | 2x AMD VMs (1 OCPU, 1GB RAM each), forever | Best option, no expiry |
| **Fly.io** | 3 shared VMs free | Good DX, may require credit card |
| **Render** | 1 free web service (spins down after 15 min idle) | Slow cold starts |

**Oracle Cloud Always Free** is the best choice for a persistent, truly free VPS.

### Step 1 — Set Up VPS

```bash
# On Oracle Cloud Ubuntu 22.04 VM

# Install Docker + Docker Compose
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu

# Clone your repo
git clone https://github.com/YOUR_USERNAME/mailguard.git
cd mailguard
```

### Step 2 — Run Services on VPS

```bash
# Copy .env.example to .env and fill in ANTHROPIC_API_KEY
cp .env.example .env

# Start Go + Rust + Python (no React — that's on Pages)
docker compose up -d api parser scorer
```

### Step 3 — Install cloudflared on VPS

```bash
# On the VPS
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

### Step 4 — Create a Tunnel

```bash
# On your local machine (authenticated)
wrangler login

# Or on VPS using API token
cloudflared tunnel login
cloudflared tunnel create mailguard-api

# This creates a tunnel ID — save it
```

### Step 5 — Configure Tunnel Routing

`~/.cloudflared/config.yml` on the VPS:
```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: /home/ubuntu/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: api.mailguard.yourdomain.com
    service: http://localhost:8082
  - service: http_status:404
```

```bash
# Add DNS record (points your subdomain at the tunnel)
cloudflared tunnel route dns mailguard-api api.mailguard.yourdomain.com

# Run tunnel (add to systemd for auto-start)
cloudflared tunnel run mailguard-api
```

### Step 6 — Systemd Service for Tunnel (auto-start)

```bash
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

### Step 7 — Update React to Point at Tunnel URL

`web/.env.production`:
```env
VITE_API_BASE_URL=https://api.mailguard.yourdomain.com
```

Update `web/src/api/client.ts`:
```ts
const BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api/v1`
  : '/api/v1'
```

Redeploy Pages.

### Step 8 — Deploy React to Pages (same as Option A)

```bash
cd web
npm run build
wrangler pages deploy dist --project-name mailguard
```

---

## Custom Domain (Optional, Free)

1. Register a domain (Cloudflare Registrar has .dev at cost price, ~$10/year)
2. Or use any registrar and point nameservers to Cloudflare (free)
3. In Pages dashboard → Custom Domains → Add `mailguard.yourdomain.com`
4. SSL/TLS is automatic via Cloudflare (Universal SSL, free)

---

## docker-compose.yml (for VPS / local dev)

```yaml
version: "3.9"

services:
  api:
    build: ./api
    ports:
      - "8082:8082"
    environment:
      - RUST_PARSER_URL=http://parser:7070
      - SCORER_URL=http://scorer:8000
      - PORT=8082
    depends_on:
      - parser
      - scorer
    restart: unless-stopped

  parser:
    build: ./parser
    ports:
      - "7070:7070"
    restart: unless-stopped

  scorer:
    build: ./scorer
    ports:
      - "8000:8000"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - MODEL=claude-sonnet-4-6
    restart: unless-stopped

networks:
  default:
    name: mailguard_net
```

`.env.example`:
```env
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Summary: Which Option to Choose

| | Option A (Pure Cloudflare) | Option B (Hybrid + Tunnel) |
|--|--|--|
| **Cost** | $0 | $0 |
| **Complexity** | Medium | Higher |
| **Keep Go/Rust/Python code** | No (Go → TypeScript) | Yes |
| **AI** | Workers AI (Llama 3) | Claude via Python scorer |
| **Cold starts** | None (Workers are always warm) | Possible on free VPS tiers |
| **Best for** | Portfolio demo, pure serverless | Keeping the full stack intact |
| **Latency** | ~50ms (edge) | ~100-200ms (VPS + tunnel) |

**Recommendation:** Build locally with all 4 services (Phases 1-4) for the portfolio demo.
Deploy with **Option A** for the live URL since it requires no VPS management.
The TypeScript Worker is short (the DNS logic is simple) and Workers AI is a
perfectly valid AI backend for a demo — you can note "Claude API used locally,
Workers AI used in production" as a deployment optimization.

---

## Deployment Checklist

### Option A
- [ ] `wrangler login`
- [ ] Create KV namespace, copy ID into `wrangler.toml`
- [ ] Deploy TypeScript DNS Worker (`wrangler deploy`)
- [ ] Build React (`npm run build`)
- [ ] Deploy to Pages (`wrangler pages deploy dist`)
- [ ] Add Pages Function to proxy `/api/*` to Worker
- [ ] (Optional) Deploy Rust WASM Worker
- [ ] (Optional) Add custom domain

### Option B
- [ ] Provision Oracle Cloud Always Free VM
- [ ] Install Docker on VPS
- [ ] Clone repo, set `.env`
- [ ] `docker compose up -d api parser scorer`
- [ ] Install cloudflared on VPS
- [ ] `cloudflared tunnel create mailguard-api`
- [ ] Configure `~/.cloudflared/config.yml`
- [ ] `cloudflared tunnel route dns ...`
- [ ] Install cloudflared as systemd service
- [ ] Update `VITE_API_BASE_URL` in React
- [ ] Deploy React to Pages
- [ ] (Optional) Add custom domain
