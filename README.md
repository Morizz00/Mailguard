# MailGuard

MailGuard is a multi-phase mail security checker for domains. The project is intended to validate common email security records such as MX, SPF, and DMARC, then grow into a richer system with Rust-based parsing, AI-assisted scoring, and a React frontend.

Right now, the Go API in `api/` is the working part of the repo. The `web/`, `parser/`, and `scorer/` folders are present as scaffolds for later phases but are mostly placeholders at the moment.

## Current Status

- Implemented: Go REST API for single-domain checks, bulk checks, in-memory history, and CSV export
- Implemented: DNS lookups for MX, SPF, and DMARC
- Stubbed: Rust parser integration
- Stubbed: Python scoring integration
- Scaffolded: React frontend

## Features

- Check a single domain with `POST /api/v1/check`
- Check multiple domains with `POST /api/v1/bulk`
- View recent checks from an in-memory ring buffer with `GET /api/v1/history`
- Export check history as CSV with `GET /api/v1/export`
- CORS enabled for browser clients

## Project Structure

```text
mailchecker/
├── api/                   # Working Go API
│   ├── handlers/          # HTTP route handlers
│   ├── middleware/        # CORS middleware
│   ├── models/            # Shared response models
│   ├── services/          # DNS lookup, history, parser/scorer stubs
│   ├── DockerFile
│   ├── go.mod
│   └── main.go
├── parser/                # Future Rust parser service (Phase 3 scaffold)
├── scorer/                # Future Python scoring service (Phase 4 scaffold)
├── web/                   # Future React frontend (Phase 2 scaffold)
├── PHASE_1_GO_API.md
├── PHASE_2_REACT.md
├── PHASE_3_RUST.md
├── PHASE_4_PYTHON_AI.md
└── PLAN.md
```

## Requirements

- Go 1.22+
- Optional: Docker

## Running the API Locally

From the project root:

```bash
cd api
go run .
```

The API listens on port `8082` by default.

You can override the port with:

```bash
PORT=8082 go run .
```

On PowerShell:

```powershell
$env:PORT="8082"
go run .
```

## Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `8082` | HTTP server port |
| `RUST_PARSER_URL` | unset | Future Rust parser service URL |
| `SCORER_URL` | unset | Future Python scorer service URL |

If `RUST_PARSER_URL` and `SCORER_URL` are not set, requests still work. The parser and score portions are simply left unfilled.

## API Endpoints

### `POST /api/v1/check`

Checks a single domain.

Request:

```json
{
  "domain": "google.com"
}
```

Example:

```bash
curl -X POST http://localhost:8082/api/v1/check \
  -H "Content-Type: application/json" \
  -d '{"domain":"google.com"}'
```

### `POST /api/v1/bulk`

Checks up to 20 domains in one request.

Request:

```json
{
  "domains": ["google.com", "github.com", "cloudflare.com"]
}
```

Example:

```bash
curl -X POST http://localhost:8082/api/v1/bulk \
  -H "Content-Type: application/json" \
  -d '{"domains":["google.com","github.com","cloudflare.com"]}'
```

### `GET /api/v1/history`

Returns recent check history stored in memory.

Example:

```bash
curl http://localhost:8082/api/v1/history
```

### `GET /api/v1/export`

Exports history as CSV.

Example:

```bash
curl http://localhost:8082/api/v1/export -o results.csv
```

## Response Shape

A single-domain response includes:

- `domain`
- `checkedAt`
- `mx`
- `spf`
- `dmarc`
- `score`

Today, `mx`, `spf`, and `dmarc` are populated from live DNS lookups. The `score` field is expected to be `null` or omitted until the scorer service is implemented.

Example response:

```json
{
  "domain": "google.com",
  "checkedAt": "2026-03-28T00:00:00Z",
  "mx": {
    "present": true,
    "records": [
      {
        "host": "smtp.google.com.",
        "priority": 10
      }
    ]
  },
  "spf": {
    "present": true,
    "rawRecord": "v=spf1 include:_spf.google.com ~all"
  },
  "dmarc": {
    "present": true,
    "rawRecord": "v=DMARC1; p=reject; rua=mailto:mailauth-reports@google.com"
  }
}
```

## Docker

Build the API image:

```bash
docker build -f api/DockerFile -t mailguard-api ./api
```

Run it:

```bash
docker run --rm -p 8082:8082 mailguard-api
```

## Development Notes

- History is stored in memory only and is limited to the latest 50 checks
- Bulk requests use goroutines with a 10-second request timeout
- The current implementation performs live DNS lookups using Go's standard library
- `web/`, `parser/`, and `scorer/` are not production-ready yet
- `docker-compose.yml` and `.env.example` exist but are still placeholders

## Roadmap

- Phase 1: Go API refactor and curl-testable REST API
- Phase 2: React frontend
- Phase 3: Rust parsing service for deeper record analysis
- Phase 4: Python AI scoring service

See the phase documents for the planned breakdown:

- `PHASE_1_GO_API.md`
- `PHASE_2_REACT.md`
- `PHASE_3_RUST.md`
- `PHASE_4_PYTHON_AI.md`

## Known Limitations

- Domain cleaning is intentionally simple and may reject some edge-case inputs
- Invalid items in bulk requests currently result in empty slots rather than per-item error objects
- History is lost when the server restarts
- Structured scoring is not active yet because the scorer service is still stubbed

## License

No license file is currently included in the repository.
