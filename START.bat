@echo off
title GTS Tour Expense Management & Claim Tracker
echo ======================================================================
echo GTS Facility Management Services Pvt Ltd
echo Tour Expense Management & Claim Tracker
echo ======================================================================
echo.
echo Checking Node.js installation...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found on your system!
    echo Please install Node.js v18 or newer from https://nodejs.org
    pause
    exit /b 1
)

echo Starting GTS Tour Expense Tracker Server on port 5050...
if not exist node_modules (
    echo First-time run detected. Installing dependencies...
    call npm install
)

start http://localhost:5050
call npm start
pause
