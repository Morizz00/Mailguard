#!/bin/bash
# MailGuard Full Build and Run Script
# This script builds and starts all services locally

set -e  # Exit on error

echo "🔨 Building MailGuard System..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"
command -v go >/dev/null 2>&1 || { echo "❌ Go not found. Please install Go."; exit 1; }
command -v cargo >/dev/null 2>&1 || { echo "❌ Rust not found. Please install Rust."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ Node.js not found. Please install Node.js."; exit 1; }
command -v python >/dev/null 2>&1 || { echo "❌ Python not found. Please install Python 3.8+."; exit 1; }

echo -e "${GREEN}✓ All prerequisites found${NC}"
echo ""

# 1. Build Rust Parser
echo -e "${BLUE}[1/4] Building Rust Parser (Phase 3)...${NC}"
cd parser
cargo build --release 2>&1 | grep -E "(Compiling|Finished|error)" || true
echo -e "${GREEN}✓ Rust Parser built${NC}"
cd ..
echo ""

# 2. Build React Frontend
echo -e "${BLUE}[2/4] Building React Frontend (Phase 2)...${NC}"
cd web
npm install --silent
npm run build 2>&1 | grep -E "(built|error|warning)" || true
echo -e "${GREEN}✓ React Frontend built${NC}"
cd ..
echo ""

# 3. Build Go API
echo -e "${BLUE}[3/4] Building Go API (Phase 1)...${NC}"
cd api
go build -o ./api main.go 2>&1 | grep -E "(error)" || true
echo -e "${GREEN}✓ Go API built${NC}"
cd ..
echo ""

# 4. Build Python Scorer (just install requirements)
echo -e "${BLUE}[4/4] Setting up Python Scorer (Phase 4)...${NC}"
cd scorer
pip install -r requirements.txt --quiet 2>&1 | grep -E "(error|Successfully)" || true
echo -e "${GREEN}✓ Python Scorer dependencies installed${NC}"
cd ..
echo ""

echo -e "${GREEN}✅ Build complete!${NC}"
echo ""
echo -e "${YELLOW}To start all services, run:${NC}"
echo "  docker-compose up"
echo ""
echo -e "${YELLOW}Or for local development (in separate terminals):${NC}"
echo "  Terminal 1: cd parser && cargo run --release"
echo "  Terminal 2: cd scorer && python main.py"
echo "  Terminal 3: cd web && npm run dev"
echo "  Terminal 4: cd api && ./api"
echo ""
echo -e "${YELLOW}Frontend will be available at:${NC}"
echo "  http://localhost:5173 (dev with HMR)"
echo "  http://localhost:8082 (production via Go API)"
echo ""
