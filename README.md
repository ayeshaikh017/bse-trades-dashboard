# BSE Trades Dashboard

A full-stack technical assessment project that simulates pulling trade data from the BSE Exchange API where a complete pull can take up to 15 minutes while network connections are limited to 30 seconds.

The application solves this by running the long-running pull asynchronously in the backend and notifying the dashboard through Socket.IO when new trades are available.

---

## Features

- Mock BSE API
- Configurable BSE response delay
- 3,000 seeded trade records
- MongoDB persistence
- Existing trades displayed immediately
- Background trade pull
- Pull status tracking
- Real-time updates using Socket.IO
- No page refresh required
- No polling loop
- No cronjob or scheduler
- Responsive dashboard

---

## Tech Stack

### Frontend

- React
- Vite
- Axios
- Socket.IO Client

### Backend

- Node.js
- Express.js
- Socket.IO
- Axios
- Mongoose

### Database

- MongoDB Atlas

---

## Project Structure

```text
bse-trades-dashboard/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── mock-bse/
│   │   ├── routes/
│   │   ├── services/
│   │   └── server.js
│   │
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── docs/
│   └── ARCHITECTURE.md
│
├── README.md
└── .gitignore
```

---

## Prerequisites

Install:

- Node.js 18+
- npm
- MongoDB Atlas account

---

## Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
CLIENT_URL=http://localhost:5173
BSE_DELAY_MS=10000
```

For the full 15-minute simulation:

```env
BSE_DELAY_MS=900000
```

Start the backend:

```bash
npm run dev
```

Backend:

```text
http://localhost:5000
```

---

## Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

## API Endpoints

### Mock BSE API

```http
GET /getTrades
```

Returns approximately 3,000 generated trade records after the configured delay.

---

### Get Stored Trades

```http
GET /api/trades
```

Returns trades already stored in MongoDB.

---

### Start Trade Pull

```http
POST /api/pull/start
```

Starts the trade pull asynchronously.

The endpoint immediately returns a `202 Accepted` response rather than keeping the HTTP connection open.

---

### Pull Status

```http
GET /api/pull/status
```

Returns the current pull status.

Possible states include:

```text
idle
running
completed
failed
```

---

## Real-Time Events

The backend uses Socket.IO.

### Pull Completed

```text
pullCompleted
```

Sent after new trades have been successfully stored in MongoDB.

The React dashboard receives the event and loads the latest trade data without requiring a page refresh.

### Pull Failed

```text
pullFailed
```

Sent if the background pull fails.

---

## How the System Solves the 30-Second Timeout

A traditional implementation could keep the browser's HTTP connection open while waiting for the BSE API:

```text
Browser
   │
   └──────────── 15 minute HTTP request ────────────┐
                                                     │
                                                Network timeout
                                                     │
                                                     ▼
                                                   FAIL
```

This project instead uses:

```text
Browser
   │
   ├── POST /api/pull/start
   │
   └── receives 202 immediately


Backend
   │
   └── background pull
          │
          ▼
      Mock BSE API
          │
          ▼
       MongoDB
          │
          ▼
      Socket.IO
          │
          ▼
      Dashboard
```

Therefore the browser does not maintain a long-running HTTP connection.

---

## Testing the Workflow

1. Start MongoDB Atlas.
2. Start the backend.
3. Start the frontend.
4. Open the dashboard.
5. Existing trades should be displayed.
6. Click **Start New Pull**.
7. The pull status changes to `running`.
8. Existing trades remain visible.
9. Wait for the configured delay.
10. The backend stores the new trades.
11. Socket.IO emits `pullCompleted`.
12. The dashboard automatically displays the latest trades.

No page refresh is required.

---

## Development vs Assessment Delay

For development and demonstration:

```env
BSE_DELAY_MS=10000
```

This simulates a 10-second BSE response.

To simulate the assignment's maximum delay:

```env
BSE_DELAY_MS=900000
```

which represents 15 minutes.

---

## Architecture

Detailed architecture information is available in:

```text
docs/ARCHITECTURE.md
```

---

## Security

Environment variables containing credentials are not committed to GitHub.

The `.env` file is included in `.gitignore`.

A `.env.example` file is provided with placeholder values.

---

## Assessment Requirements Covered

| Requirement | Implementation |
|---|---|
| Mock BSE API | `GET /getTrades` |
| Thousands of trades | 3,000 generated records |
| Configurable delay | `BSE_DELAY_MS` |
| Up to 15-minute pull | `900000 ms` |
| Dashboard opens immediately | Existing MongoDB data loaded on startup |
| Pull continues in background | Backend pull service |
| No long browser connection | `202 Accepted` |
| Automatic updates | Socket.IO |
| No page refresh | React state update |
| No polling | Socket.IO event |
| No cronjob | Event-driven architecture |
| Persistent data | MongoDB Atlas |

---

## Author

B.E. Information Technology

Technical Assessment Project — BSE Trades Dashboard