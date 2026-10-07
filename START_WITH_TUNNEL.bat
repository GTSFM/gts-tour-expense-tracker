@echo off
title GTS Tour Expense Tracker Launcher
cd /d "%~dp0"

echo ======================================================================
echo GTS Facility Management Services Pvt Ltd
echo Tour Expense Management & Claim Tracker - Server + Public Tunnel
echo ======================================================================
echo.

echo 1. Starting Express Server on http://localhost:5050...
start /b cmd /c "node_modules\.bin\tsx.cmd server\index.ts"

timeout /t 3 >nul

echo 2. Starting Cloudflare Public Tunnel...
echo.
echo **********************************************************************
echo Look for the public HTTPS link below (e.g. https://...trycloudflare.com)
echo Share that link with Directors, Approvers, and Employees!
echo **********************************************************************
echo.

"..\cloudflared.exe" tunnel --url http://127.0.0.1:5050 --no-autoupdate
pause
