# MailGuard

https://mailguard-omega.vercel.app/

MailGuard is a comprehensive email security verification system that checks domain configurations (MX, SPF, DMARC records) and provides AI-powered security scoring. Built with Go, Rust, React, and Python across 4 integrated phases.


## Quick Start

### Docker (Recommended)
```bash
# Prerequisites: Docker, Docker Compose, OpenRouter API key (free)

# 1. Get API key from https://openrouter.ai
# 2. Set up environment
cp .env.local .env.production

# 3. Add your OpenRouter API key to .env.production
OPENROUTER_API_KEY=sk-or-YOUR_KEY_HERE

# 4. Start all services
docker-compose up --build

# 5. Open http://localhost:8082
```

### Local Development (All Phases)
**Prerequisites**: Go 1.21+, Rust 1.70+, Node.js 20+, Python 3.8+

```bash
# Build all components
./build.sh  # or build.bat on Windows

# Start services in 4 separate terminals:

# Terminal 1: Rust Parser (port 7070)
cd parser && cargo run --release

# Terminal 2: Python Scorer (port 7090)
cd scorer && python main.py

# Terminal 3: React Frontend (port 5173 with HMR)
cd web && npm run dev

# Terminal 4: Go API Server (port 8082)
cd api && ./api  # or api.exe on Windows
```

## Features

- **Single Domain Check**: Full DNS record analysis with AI scoring
- **Bulk Check**: Process up to 1000 domains in parallel
- **Security Grades**: A-F grading system based on record completeness and policy strength
- **AI Recommendations**: LLM-powered actionable security advice
- **Check History**: Persistent session-based check history
- **CSV Export**: Download results for reporting
- **Real-time Parsing**: RFC-compliant SPF, DMARC, MX parsing
- **Fallback Scoring**: Rule-based scoring when AI is unavailable

## System Architecture

```
React Frontend (Phase 2)
    ↓ /api/v1
Go API Server (Port 8082) - Static Files + API Gateway
    ├→ Rust Parser (Port 7070) - DNS/RFC parsing
    └→ Python Scorer (Port 7090) - AI security analysis
```

## Environment Configuration

### Docker (.env.production)
```bash
# Go API
PORT=8082
LOG_LEVEL=info
STATIC_DIR=/app/dist

# Services (auto-configured by Docker network)
RUST_PARSER_URL=http://parser:7070
SCORER_URL=http://scorer:7090

# AI Scoring
OPENROUTER_API_KEY=sk-or-YOUR_KEY_HERE
MODEL=meta-llama/llama-3.3-70b-instruct:free

# Limits
BULK_TIMEOUT_SEC=15
BULK_MAX_DOMAINS=1000
```

### Local Development (.env.local)
Same as above, but with localhost URLs:
```bash
RUST_PARSER_URL=http://localhost:7070
SCORER_URL=http://localhost:7090
STATIC_DIR=../web/dist
```

### Free AI Models Available
- `meta-llama/llama-3.3-70b-instruct:free` (recommended)
- `mistralai/mistral-7b-instruct:free`
- `nvidia/llama-3.1-nemotron-70b-instruct:free`

## API Endpoints

### `POST /api/v1/check`
Check a single domain.

**Request**:
```json
{
  "domain": "google.com"
}
```

**Example**:
```bash
curl -X POST http://localhost:8082/api/v1/check \
  -H "Content-Type: application/json" \
  -d '{"domain":"google.com"}'
```

### `POST /api/v1/bulk`
Check multiple domains (up to 1000).

**Request**:
```json
{
  "domains": ["google.com", "github.com", "cloudflare.com"]
}
```

**Example**:
```bash
curl -X POST http://localhost:8082/api/v1/bulk \
  -H "Content-Type: application/json" \
  -d '{"domains":["google.com","github.com","cloudflare.com"]}'
```

### `GET /api/v1/history`
Get recent domain checks (last 50 checks).

**Example**:
```bash
curl http://localhost:8082/api/v1/history
```

### `GET /api/v1/export`
Export check history as CSV.

**Example**:
```bash
curl http://localhost:8082/api/v1/export -o results.csv
```

## Response Format

A complete check response includes:

```json
{
  "domain": "google.com",
  "checkedAt": "2026-03-29T10:30:00Z",
  "mx": {
    "present": true,
    "records": [
      {
        "host": "smtp.google.com.",
        "priority": 10
      }
    ],
    "parsed": {
      "primaryMx": "smtp.google.com.",
      "hasMultiplePriorities": true,
      "priorityGroups": [...]
    }
  },
  "spf": {
    "present": true,
    "rawRecord": "v=spf1 include:_spf.google.com ~all",
    "parsed": {
      "version": "spf1",
      "mechanisms": [...],
      "allQualifier": "~",
      "lookupCount": 5,
      "isValid": true,
      "warnings": []
    }
  },
  "dmarc": {
    "present": true,
    "rawRecord": "v=DMARC1; p=reject; rua=mailto:...",
    "parsed": {
      "version": "DMARC1",
      "policy": "reject",
      "subdomainPolicy": "reject",
      "pct": 100,
      "rua": ["mailto:..."],
      "adkim": "s",
      "aspf": "s",
      "isValid": true,
      "warnings": []
    }
  },
  "score": {
    "score": 95,
    "grade": "A",
    "riskLevel": "low",
    "summary": "google.com has excellent email security...",
    "recommendations": [
      "Add DMARC RUA aggregate reports",
      "..."
    ],
    "breakdown": {
      "mxScore": 30,
      "spfScore": 35,
      "dmarcScore": 30,
      "maxPossible": 100
    },
    "aiGenerated": true
  }
}
```

## Troubleshooting

### Python Scorer won't start
```bash
# Check Python version
python --version  # Should be 3.8+

# Install dependencies
pip install -r scorer/requirements.txt

# Check API key is set (should output your key, not empty)
echo $OPENROUTER_API_KEY
```

### Frontend not loading at http://localhost:8082
```bash
# Rebuild frontend
cd web && npm run build

# Check Go API is running
curl http://localhost:8082/api/v1/history

# Check static files are in dist/
ls web/dist/
```

### Services can't connect to each other
```bash
# Check all services are running on expected ports
# Windows: netstat -ano | findstr :7070
# Linux: netstat -tuln | grep :7070

# If using Docker, check container network
docker ps  # All containers should be running
docker logs mailguard-api  # Check API logs for connection errors
```

### Logs and debugging
- **Go API**: Logs to stdout with slog (structured logging)
- **Rust Parser**: Set `RUST_LOG=debug cargo run`
- **Python Scorer**: Output printed to terminal
- **React Frontend**: Check browser console (F12)

## Testing

### Run Go API tests
```bash
cd api
go test ./tests/... -v
```

### Manual API test
```bash
# Windows PowerShell
Invoke-RestMethod -Uri "http://localhost:8082/api/v1/check" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"domain":"google.com"}' | ConvertTo-Json

# macOS/Linux with curl
curl -X POST http://localhost:8082/api/v1/check \
  -H "Content-Type: application/json" \
  -d '{"domain":"google.com"}'
```

### Common Test Domains
- `google.com` - Excellent security (grade A)
- `microsoft.com` - Good security (grade B)  
- `github.com` - Good security (grade B)
- `example.com` - No security records (grade F)

## Project Structure

```
mailchecker/
├── api/                           # Go API Gateway (Phase 1)
│   ├── handlers/                  # HTTP endpoint handlers
│   ├── middleware/                # CORS middleware
│   ├── models/                    # Shared data models
│   ├── services/                  # Business logic (DNS, history, scoring, parsing)
│   ├── tests/                     # 40+ unit tests
│   ├── main.go                    # API server + static file serving
│   ├── DockerFile                 # Go container image
│   └── go.mod / go.sum
├── parser/                        # Rust DNS/RFC Parser (Phase 3)
│   ├── src/
│   │   ├── main.rs               # Axum HTTP server
│   │   ├── spf.rs                # SPF record parsing (RFC 7208)
│   │   ├── dmarc.rs              # DMARC parsing (RFC 7489)
│   │   ├── mx.rs                 # MX record parsing
│   │   └── models.rs             # Data structures
│   ├── Cargo.toml
│   └── Dockerfile
├── scorer/                        # Python AI Scorer (Phase 4)
│   ├── main.py                    # FastAPI app with health endpoint
│   ├── services/
│   │   └── openrouter_client.py  # LLM API integration
│   ├── requirements.txt           # Python dependencies
│   ├── DockerFile                 # Python container image
│   ├── .env.example              # API key template
│   └── .env                       # Runtime configuration
├── web/                           # React Frontend (Phase 2)
│   ├── src/
│   │   ├── api/client.ts         # API communication
│   │   ├── components/            # React components
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── types/                 # TypeScript interfaces
│   │   ├── views/                 # Page components
│   │   └── App.tsx               # Main app
│   ├── dist/                      # Built static files
│   ├── package.json              # NPM dependencies
│   ├── vite.config.ts            # Vite build config
│   ├── tsconfig.json             # TypeScript config
│   ├── Dockerfile                # Node.js builder image
│   └── tailwind.config.ts        # Tailwind configuration
├── docker-compose.yml             # Multi-service orchestration
├── build.sh / build.bat           # Build scripts
├── README.md                      # This file
```

## Development Notes

- **History**: Stored in-memory, limited to last 50 checks, lost on server restart
- **Bulk Processing**: Uses goroutines with configurable timeout
- **Testing**: 40+ Go tests covering handlers, middleware, models, and services
- **DNS Lookups**: Live RFC-compliant DNS queries using system resolver
- **Scoring**: AI-powered via OpenRouter API with rule-based fallback
- **Parsing**: Rust-based for performance (SPF CIDR, DMARC policy, MX mechanisms)
- **Frontend**: React 19 with Vite + Tailwind, reactive state management
- **CORS**: Enabled for all origins, configurable per environment

## Performance

- **Single check**: 500ms–2s (depends on DNS + AI service)
- **Bulk check** (100 domains): 5–10 seconds (parallel processing)
- **Frontend build**: 2.6 seconds (Vite optimized)
- **Go test suite**: 5 seconds (40+ tests)
- **Frontend bundle**: 299 KB total (~82 KB gzipped)


## License

MIT License

Copyright (c) 2026 Morizz00

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
aUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
