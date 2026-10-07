# GTS Tour Expense Management & Claim Tracker
## Permanent Production Deployment & 24/7 Hosting Guide

### Why Did the Previous Link Go Offline?
The previous URL (`*.trycloudflare.com`) was an **ephemeral quick tunnel** running directly from the local laptop terminal. When the laptop went to sleep, closed its lid, or was restarted, the temporary connection was severed, and Cloudflare displayed an Argo 1033 / 502 error to anyone attempting to access it. Furthermore, quick tunnels change their address every single time they are restarted.

To ensure senior management (President, Directors, Regional Heads) always have reliable, uninterrupted access, here are the permanent deployment strategies:

---

### Option 1: Free 24/7 Cloud Hosting on Render.com (Recommended)
This approach runs on enterprise cloud infrastructure independently of any office computer or laptop. It never sleeps, never shuts down, and offers a permanent custom URL.

1. **Create an account** on [Render.com](https://render.com) (100% free tier for Web Services).
2. **Create New Web Service**:
   - Choose **Node.js**.
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
3. **Set Environment Variable**:
   - `NODE_ENV=production`
   - `PORT=5050`
4. **Deploy**:
   - Render gives a permanent URL: `https://gts-tour-expense.onrender.com` (or you can map your corporate domain like `https://expenses.gtsfm.com`).
   - The link is live 24/7/365 across all mobile networks and broadband connections globally.

---

### Option 2: Cloudflare Zero Trust Named Tunnel (Permanent Corporate Domain on Office Server)
If you have a computer or desktop in the GTS office that stays powered on:

1. Log into your free [Cloudflare Dashboard](https://dash.cloudflare.com) -> **Zero Trust** -> **Networks** -> **Tunnels**.
2. Click **Add a Tunnel**, name it `gts-tour-expense`.
3. Choose **Windows**, and copy the token command provided:
   ```cmd
   cloudflared.exe service install <YOUR_TUNNEL_TOKEN>
   ```
4. Point the Public Hostname to:
   - Service: `HTTP`
   - URL: `127.0.0.1:5050`
   - Domain: e.g. `claims.gtsfm.com`
5. **Result**: Cloudflare runs as a persistent **Windows Service** that starts automatically whenever Windows turns on. It will NEVER change its address, and it stays active 24/7.

---

### Option 3: High-Speed Office Wi-Fi Access (Instant & Local)
For any employee, manager, or director currently connected to the office Wi-Fi network:
* **Direct Office URL**: `http://192.168.29.179:5050`
* Accessible directly from phone browsers, iPads, and office laptops with zero internet tunnel lag.

---

### Option 4: Standalone Portable Package (.ZIP)
A fully packaged self-contained bundle with its own runtime and database:
* Located at: `gts-tour-expense-tracker-portable.zip`
* Can be copied to any office server or PC, unzipped, and run with a double-click on `START.bat`.
