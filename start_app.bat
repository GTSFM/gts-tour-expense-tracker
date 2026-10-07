@echo off
title GTS Tour Expense Management & Claim Tracker
echo ===================================================================
echo     GTS FACILITY MANAGEMENT SERVICES PVT LTD
echo     Tour Expense Management, Claim Submission, Approvals & Audit
echo ===================================================================
echo.

node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js 18+ from https://nodejs.org/ and run this script again.
    pause
    exit /b 1
)

echo [1/3] Checking dependencies...
if not exist node_modules (
    echo Installing required packages...
    call npm install
)

echo [2/3] Starting GTS Tour Expense Tracker Server on port 5050...
start "" "http://localhost:5050"
call npx tsx server/index.ts
pause
