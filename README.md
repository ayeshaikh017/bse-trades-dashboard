<div align="center">

# 📈 BSE Trades Dashboard

### Real-time trade monitoring that never holds a connection hostage

A full-stack dashboard that pulls thousands of trade records from a BSE Exchange API taking up to **15 minutes**, while staying safely under the network's **30-second HTTP timeout**.

<br/>

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Open%20Dashboard-success?style=for-the-badge&logo=render&logoColor=white)](https://bse-trades-dashboard-1-wwdc.onrender.com)
[![Backend API](https://img.shields.io/badge/Backend%20API-Online-blue?style=for-the-badge&logo=express&logoColor=white)](https://bse-trades-dashboard-818z.onrender.com/)
[![Demo Video](https://img.shields.io/badge/Demo-Video-red?style=for-the-badge&logo=youtube&logoColor=white)](#-demo-video)

![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB%20Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=flat-square&logo=socketdotio&logoColor=white)
![Render](https://img.shields.io/badge/Deployed%20on-Render-46E3B7?style=flat-square&logo=render&logoColor=black)

</div>

---

## 📑 Table of Contents

- [Demo Video](#-demo-video)
- [Live Demo](#-live-demo)
- [Project Overview](#-project-overview)
- [Key Features](#-key-features)
- [Architecture](#%EF%B8%8F-architecture)
- [Why This Architecture?](#-why-this-architecture)
- [Complete Request Flow](#-complete-request-flow)
- [Tech Stack](#%EF%B8%8F-tech-stack)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Socket.IO Events](#-socketio-events)
- [Database](#%EF%B8%8F-database)
- [Local Setup](#%EF%B8%8F-local-setup)
- [Testing the System](#-testing-the-system)
- [Handling the 30-Second Timeout](#%EF%B8%8F-handling-the-30-second-timeout)
- [Production Considerations](#-production-considerations)
- [Environment Variables](#-environment-variables)
- [Author](#-author)

---

## 🎥 Demo Video

<!-- Paste your demo video link/embed below -->

**Demo Video:** 


https://github.com/user-attachments/assets/7d45b7a8-9c3d-4f1e-aed4-a851fcdcdd38





**The walkthrough covers:**

- ✅ Existing trades displayed immediately
- ✅ Starting a new trade pull
- ✅ Immediate response from the backend
- ✅ Background trade processing
- ✅ Automatic trade updates without page refresh
- ✅ Real-time Socket.IO completion event
- ✅ Increasing trade count after a successful pull

---

## 🌐 Live Demo

| Service | Link |
|---|---|
| 🖥️ **Frontend** (Dashboard) | https://bse-trades-dashboard-1-wwdc.onrender.com |
| ⚙️ **Backend** (API) | https://bse-trades-dashboard-818z.onrender.com |
| ❤️ **Health Check** | https://bse-trades-dashboard-818z.onrender.com/ |

>💡 Hosted on Render's free tier, so the first request may take a few seconds while the service wakes up.

⏱️ Note on the demo delay: The deployed demo and the video use BSE_DELAY_MS=3000 (3 seconds) so the full flow can be seen quickly. The delay is configurable. Set BSE_DELAY_MS=900000 to simulate the real 15-minute BSE pull. The architecture is the same either way, because the browser only waits for the instant 202 Accepted response.

## 📌 Project Overview

This application simulates a system that pulls trade data from a BSE Exchange API.

**The challenge:** a complete pull can take up to **15 minutes**, but the network kills any HTTP connection held open longer than **30 seconds**.

**The approach:** instead of making the browser wait, the backend accepts the request, responds immediately, and finishes the work in the background. When the pull completes, the dashboard is notified over WebSockets and refreshes itself.

---

## ✨ Key Features

| | Feature |
|---|---|
| 🧪 | Mock BSE API with configurable delay |
| 🌱 | Thousands of seeded/generated trade records |
| ⚡ | Immediate `202 Accepted` response |
| 🔄 | Background trade pulling |
| 💾 | MongoDB persistence |
| 🛡️ | Duplicate-safe inserts using `bulkWrite` + `upsert` |
| 📡 | Real-time Socket.IO updates |
| 🚫 | No page refresh, no polling loop, no cron/scheduler |
| 📊 | Pull status tracking and error handling |
| 📱 | Responsive React dashboard |
| 🧩 | Separate frontend and backend services |

---

## 🏗️ Architecture

```mermaid
flowchart TD
    A[React Dashboard] -->|POST /api/pull/start| B[Express Backend]
    B -->|HTTP 202 immediately| A
    B --> C[Pull Service<br/>Background Process]
    C -->|GET /getTrades| D[Mock BSE API]
    D -->|Trade records| C
    C -->|bulkWrite + upsert| E[(MongoDB Atlas<br/>trades collection)]
    C -->|pullCompleted| F{{Socket.IO}}
    F -->|Real-time event| A
    A -->|GET /api/trades| B
```

### Sequence

```mermaid
sequenceDiagram
    participant U as React Dashboard
    participant S as Express Backend
    participant B as Mock BSE API
    participant M as MongoDB Atlas

    U->>S: GET /api/trades
    S-->>U: Existing trades (instant)
    U->>S: POST /api/pull/start
    S-->>U: 202 Accepted
    Note over S: Connection closed.<br/>Pull continues in background.
    S->>B: GET /getTrades (long delay)
    B-->>S: Trade records
    S->>M: bulkWrite (upsert by tradeId)
    S-->>U: Socket.IO "pullCompleted"
    U->>S: GET /api/trades
    S-->>U: Updated trades
```

---

## 💡 Why This Architecture?

### The Problem

```text
BSE pull duration:        up to 15 minutes (900 seconds)
Network connection limit: 30 seconds
```

Keeping a browser request open for the entire pull would be unreliable.

### The Solution

Separate **starting** the pull from **finishing** the pull.

1. The dashboard calls `POST /api/pull/start`.
2. The backend replies `202 Accepted` immediately.
3. The pull continues in the background.
4. Trades are stored in MongoDB.
5. The backend emits a Socket.IO event.
6. Connected dashboards receive it and reload trades automatically.

**This avoids:** long-running HTTP requests, client-side polling, cron-based refreshes, and manual page refreshes.

---

## 🔄 Complete Request Flow

### Step 1 — Dashboard loads

```http
GET /api/trades
```

Already stored trades are displayed immediately.

### Step 2 — User starts a pull

```http
POST /api/pull/start
```

Response (HTTP `202 Accepted`):

```json
{
  "success": true,
  "message": "Trade pull started in background"
}
```

### Step 3 — Background processing

The backend starts the pull without keeping the browser request open. The mock BSE service waits for the configured delay, then generates trade records.

| Mode | Setting | Duration |
|---|---|---|
| Demo | `BSE_DELAY_MS=3000` | ~3 seconds |
| Full simulation | `BSE_DELAY_MS=900000` | 15 minutes |

### Step 4 — Save trades

Trades are stored with `bulkWrite()` and `upsert`, preventing duplicates when a `tradeId` already exists.

### Step 5 — Real-time notification

```js
io.emit("pullCompleted", {
  success: true,
  message: "New trades have been pulled successfully",
  tradeCount: trades.length,
});
```

### Step 6 — Dashboard updates

```js
socket.on("pullCompleted", () => {
  loadTrades();
});
```

**No page refresh required.**

<details>
<summary><b>💻 Key implementation snippets</b></summary>

<br/>

**Immediate API response**

```js
return res.status(202).json({
  success: true,
  message: result.message,
});
```

**Background processing**

```js
setImmediate(async () => {
  try {
    const trades = await fetchTradesFromBSE();

    await Trade.bulkWrite(
      trades.map((trade) => ({
        updateOne: {
          filter: { tradeId: trade.tradeId },
          update: { $set: trade },
          upsert: true,
        },
      }))
    );

    // Pull completed
  } catch (error) {
    // Handle failure
  }
});
```

**Frontend real-time listener**

```js
socket.on("pullCompleted", (data) => {
  setStatus("completed");
  setMessage(data.message);

  loadTrades();
});
```

</details>

---

## 🛠️ Tech Stack

### Frontend

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white)
![Socket.IO Client](https://img.shields.io/badge/Socket.IO%20Client-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)

### Backend

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white)
![Mongoose](https://img.shields.io/badge/Mongoose-880000?style=for-the-badge&logo=mongoose&logoColor=white)
![dotenv](https://img.shields.io/badge/dotenv-ECD53F?style=for-the-badge&logo=dotenv&logoColor=black)
![CORS](https://img.shields.io/badge/CORS-Enabled-blue?style=for-the-badge)

### Database

![MongoDB Atlas](https://img.shields.io/badge/MongoDB%20Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)

### Deployment & Tools

![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=black)
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)

---

## 📁 Project Structure

```text
bse-trades-dashboard/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── controllers/
│   │   │   ├── pull.controller.js
│   │   │   └── trades.controller.js
│   │   ├── mock-bse/
│   │   │   └── bse.routes.js
│   │   ├── models/
│   │   │   └── Trade.js
│   │   ├── routes/
│   │   │   ├── pull.routes.js
│   │   │   └── trades.routes.js
│   │   ├── services/
│   │   │   └── pull.service.js
│   │   └── server.js
│   ├── .env.example
│   ├── .gitignore
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── TradeTable.jsx
│   │   ├── api.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env
│   └── package.json
│
├── docs/
│   └── ARCHITECTURE.md
│
├── README.md
└── .gitignore
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|:---:|---|---|
| `GET` | `/` | Backend status |
| `GET` | `/getTrades` | Mock BSE API |
| `GET` | `/api/trades` | Get stored trades |
| `POST` | `/api/pull/start` | Start background trade pull |
| `GET` | `/api/pull/status` | Get current pull status |

---

## 📡 Socket.IO Events

**Client → Server:** the socket connection is established when the dashboard loads.

**Server → Client:**

| Event | When | Payload |
|---|---|---|
| `pullCompleted` | After a successful trade pull | `{ success, message, tradeCount }` |
| `pullFailed` | If the background pull fails | Error details |

```json
{
  "success": true,
  "message": "New trades have been pulled successfully",
  "tradeCount": 3000
}
```

---

## 🗄️ Database

**Database:** `bse_trades` · **Collection:** `trades`

```json
{
  "tradeId": "BSE-123456789-1",
  "client": "Client001",
  "symbol": "RELIANCE",
  "quantity": 250,
  "price": 2450.50,
  "timestamp": "2026-10-01T12:00:00.000Z"
}
```

---

## ⚙️ Local Setup

### Prerequisites

- Node.js 18+
- A MongoDB Atlas connection string

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd bse-trades-dashboard
```

### 2. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
MONGO_URI=YOUR_MONGODB_CONNECTION_STRING
CLIENT_URL=http://localhost:5173
BSE_DELAY_MS=3000
```

```bash
npm run dev
```

Backend runs at `http://localhost:5000`

### 3. Frontend

In a new terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

```bash
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## 🧪 Testing the System

| # | Test | Expected result |
|:---:|---|---|
| 1 | Open the dashboard | Previously stored trades appear instantly |
| 2 | Click **Start New Pull** | Status shows `Pull in Progress...` |
| 3 | Inspect the network call | `POST /api/pull/start` returns `202 Accepted` immediately |
| 4 | Wait for the configured delay | Status shows `Pull completed`; new trades appear automatically |
| 5 | Keep the tab open throughout | No manual refresh needed |
| 6 | Run multiple pulls | Each pull adds trades with unique IDs, so the count increases |

---

## ⏱️ Handling the 30-Second Timeout

The assignment states the BSE API can take up to 15 minutes while the network terminates HTTP connections after 30 seconds.

The solution separates **requesting the pull** from **performing the pull**:

```text
Browser
   │
   │ POST /pull/start
   ▼
Backend
   │
   ├── 202 immediately  ──► Browser is free
   │
   └── Background pull
           │
           ▼
       BSE API ──► MongoDB ──► Socket.IO ──► Dashboard
```

The browser only waits for the short `POST /api/pull/start` request. The long-running work happens server-side, and Socket.IO notifies the dashboard on completion.

---

## 🚀 Production Considerations

The current implementation uses an in-process background operation, which is ideal for demonstrating the required architecture. For many concurrent pulls, the job could move to a durable queue:

- Redis + BullMQ
- RabbitMQ
- AWS SQS
- Another managed job-processing system

**Benefits:** job persistence, retry handling, failure recovery, horizontal scalability, and worker management.

---

## 🔐 Environment Variables

> ⚠️ Never commit real credentials or secrets to GitHub. `.env` files are excluded via `.gitignore`.

| Scope | Variable | Purpose |
|---|---|---|
| Backend | `PORT` | Server port |
| Backend | `MONGO_URI` | MongoDB connection string |
| Backend | `CLIENT_URL` | Allowed frontend origin (CORS) |
| Backend | `BSE_DELAY_MS` | Simulated BSE pull delay in ms |
| Frontend | `VITE_API_URL` | Backend API base URL |
| Frontend | `VITE_SOCKET_URL` | Socket.IO server URL |

📄 Detailed design notes: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

---

## 👩‍💻 Author

**Ayesha Mohammed Ishaque Shaikh**
B.E. Information Technology · Shree L.R. Tiwari College of Engineering

<!-- Optional: add your links
[![GitHub](https://img.shields.io/badge/GitHub-yourusername-181717?style=flat-square&logo=github)](https://github.com/yourusername)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-yourname-0A66C2?style=flat-square&logo=linkedin)](https://linkedin.com/in/yourname)
-->

---

<div align="center">

📌 Developed as part of the **Software Engineer technical assessment for Arham Fintech**

⭐ If you found this project interesting, consider giving it a star!

</div>
