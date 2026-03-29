@echo off
REM MailGuard Full Build and Run Script for Windows
REM This script builds and starts all services locally

echo.
echo Building MailGuard System...
echo.

REM Check prerequisites
echo Checking prerequisites...
where go >nul 2>&1 || (echo Error: Go not found. Please install Go. && exit /b 1)
where cargo >nul 2>&1 || (echo Error: Rust not found. Please install Rust. && exit /b 1)
where npm >nul 2>&1 || (echo Error: Node.js not found. Please install Node.js. && exit /b 1)
where python >nul 2>&1 || (echo Error: Python not found. Please install Python 3.8+. && exit /b 1)

echo.
echo [1/4] Building Rust Parser (Phase 3)...
cd parser
cargo build --release
cd ..
echo.

echo [2/4] Building React Frontend (Phase 2)...
cd web
call npm install
call npm run build
cd ..
echo.

echo [3/4] Building Go API (Phase 1)...
cd api
go build -o api.exe main.go
cd ..
echo.

echo [4/4] Setting up Python Scorer (Phase 4)...
cd scorer
pip install -r requirements.txt
cd ..
echo.

echo.
echo Build complete!
echo.
echo To start all services, run:
echo   docker-compose up
echo.
echo Or for local development (in separate terminals):
echo   Terminal 1: cd parser && cargo run --release
echo   Terminal 2: cd scorer && python main.py
echo   Terminal 3: cd web && npm run dev
echo   Terminal 4: cd api && api.exe
echo.
echo Frontend will be available at:
echo   http://localhost:5173 (dev with HMR)
echo   http://localhost:8082 (production via Go API)
echo.
pause
