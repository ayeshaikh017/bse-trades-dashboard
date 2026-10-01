# BSE Trades Dashboard

A real-time trade monitoring dashboard that simulates pulling trade data from the BSE Exchange API, even when the external API can take up to 15 minutes while the network allows HTTP connections for only 30 seconds.

## Live Demo

**Frontend:**  
https://bse-trades-dashboard-1-wwdc.onrender.com/

**Backend:**  
https://bse-trades-dashboard-818z.onrender.com/

## Features

- Mock BSE API with configurable response delay
- Generates 3000 trade records per pull
- Background trade processing
- MongoDB persistence using Mongoose
- Dashboard displays previously stored trades immediately
- Real-time dashboard updates using Socket.IO
- No page refresh required
- No polling loop
- No cron/scheduler
- Handles long-running BSE pulls without keeping the browser HTTP request open
- Responsive React dashboard

## Tech Stack

### Backend

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- Socket.IO
- Axios
- dotenv
- CORS

### Frontend

- React
- Vite
- Axios
- Socket.IO Client
- CSS

## Architecture

```text
                    ┌──────────────────────────┐
                    │     React Dashboard      │
                    │                          │
                    │  Existing Trades        │
                    │  Pull Status             │
                    └────────────┬─────────────┘
                                 │
                       POST /api/pull/start
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │      Express API         │
                    │                          │
                    │  Returns 202 Accepted    │
                    │  immediately             │
                    └────────────┬─────────────┘
                                 │
                         Background Job
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │     Mock BSE Service     │
                    │                          │
                    │  Configurable delay      │
                    │  3000 trade records      │
                    └────────────┬─────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │       MongoDB Atlas      │
                    │                          │
                    │         trades           │
                    └────────────┬─────────────┘
                                 │
                                 │
                    ┌────────────▼─────────────┐
                    │        Socket.IO         │
                    │                          │
                    │     pullCompleted        │
                    └────────────┬─────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │     React Dashboard      │
                    │                          │
                    │ Fetches latest trades    │
                    │ automatically            │
                    └──────────────────────────┘
```

## Why This Architecture?

The BSE API may take up to 15 minutes to return data, while the network terminates HTTP connections after 30 seconds.

Keeping the browser HTTP request open for the entire BSE operation would therefore be unreliable.

Instead, the application separates the request that starts the pull from the long-running operation.

The client sends:

```text
POST /api/pull/start
```

The backend immediately returns:

```text
202 Accepted
```

The actual BSE pull then continues in the background.

When the pull finishes:

1. Trades are stored in MongoDB.
2. The backend emits a `pullCompleted` Socket.IO event.
3. The React dashboard receives the event.
4. React fetches the latest trades.
5. The dashboard updates without a page refresh.

This avoids both long-lived browser HTTP connections and polling.

## Project Structure

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
│   │   ├── models/
│   │   │   └── Trade.js
│   │   ├── routes/
│   │   │   ├── pull.routes.js
│   │   │   └── trades.routes.js
│   │   ├── services/
│   │   │   └── pull.service.js
│   │   ├── mock-bse/
│   │   │   └── bse.routes.js
│   │   └── server.js
│   ├── .env.example
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
│   └── package.json
│
├── docs/
│   └── ARCHITECTURE.md
│
├── README.md
└── .gitignore
```

## Local Setup

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd bse-trades-dashboard
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create `.env`:

```env
PORT=5000
MONGO_URI=YOUR_MONGODB_CONNECTION_STRING
CLIENT_URL=http://localhost:5173
BSE_DELAY_MS=10000
```

Start backend:

```bash
npm run dev
```

Backend runs on:

```text
http://localhost:5000
```

### 3. Frontend setup

Open another terminal:

```bash
cd frontend
npm install
```

Create `.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Start frontend:

```bash
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

## Environment Variables

### Backend

| Variable | Description |
|---|---|
| `PORT` | Backend server port |
| `MONGO_URI` | MongoDB Atlas connection string |
| `CLIENT_URL` | Frontend URL used for CORS and Socket.IO |
| `BSE_DELAY_MS` | Mock BSE response delay in milliseconds |

### Frontend

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL |
| `VITE_SOCKET_URL` | Backend Socket.IO URL |

The mock delay is configurable.

For demonstration:

```env
BSE_DELAY_MS=3000
```

For simulating the full 15-minute BSE pull:

```env
BSE_DELAY_MS=900000
```

`900000 ms = 15 minutes`.

## API Endpoints

### Health

```http
GET /
```

### Get Trades

```http
GET /api/trades
```

Returns currently stored trades.

### Start Pull

```http
POST /api/pull/start
```

Starts the background trade pull and immediately returns:

```json
{
  "success": true,
  "message": "Trade pull started in background"
}
```

### Pull Status

```http
GET /api/pull/status
```

Returns the current pull status.

Possible statuses:

```text
idle
running
completed
failed
```

### Mock BSE API

```http
GET /getTrades
```

Simulates the BSE Exchange API and returns generated trade data after the configured delay.

## Real-Time Events

The backend uses Socket.IO to notify connected dashboards.

### Pull Completed

Event:

```text
pullCompleted
```

Payload:

```json
{
  "success": true,
  "message": "New trades have been pulled successfully",
  "tradeCount": 3000
}
```

### Pull Failed

Event:

```text
pullFailed
```

## Testing the Complete Flow

1. Open the dashboard.
2. Previously stored trades are loaded immediately.
3. Click **Start New Pull**.
4. The backend responds immediately.
5. The pull runs in the background.
6. The mock BSE API waits for the configured delay.
7. 3000 trades are generated.
8. Trades are stored in MongoDB.
9. Socket.IO emits `pullCompleted`.
10. React automatically fetches the latest trades.
11. The dashboard updates without refreshing the page.

## Handling the 30-Second Network Timeout

The application does not keep the browser's HTTP request open while waiting for the BSE operation.

Instead:

```text
Client
  │
  │ POST /api/pull/start
  ▼
Backend
  │
  │ 202 Accepted
  ▼
Client continues normally

Backend
  │
  │ Background pull
  ▼
Mock BSE
  │
  │ Up to 15 minutes
  ▼
MongoDB
  │
  ▼
Socket.IO
  │
  ▼
Client updates automatically
```

Therefore, the long-running operation does not depend on a 15-minute browser HTTP connection.

## Production Consideration

For the scope of this assessment, the background pull is handled inside the Node.js application process.

For a production-scale system, a durable job queue such as Redis/BullMQ or a dedicated worker service could be introduced so that long-running jobs survive application restarts and can be retried independently.

## Security

- MongoDB credentials are stored in environment variables.
- `.env` files are excluded from Git.
- Frontend does not connect directly to MongoDB.
- Backend controls database access.
- CORS restricts frontend access to the configured client URL.