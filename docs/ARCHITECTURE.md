# BSE Trades Dashboard — Architecture Note

## 1. Overview

The system simulates pulling trade data from the BSE Exchange API, where a complete pull can take up to 15 minutes while the network allows HTTP connections to remain open for only 30 seconds.

The application therefore uses an asynchronous background pull architecture.

The browser does not maintain an HTTP connection for the entire duration of the BSE pull.

---

## 2. Architecture

```text
                         ┌─────────────────────────┐
                         │     React Dashboard      │
                         │                         │
                         │  Existing Trades        │
                         │  Pull Status            │
                         │  Start Pull Button      │
                         └────────────┬────────────┘
                                      │
                         HTTP + Socket.IO
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │     Node.js / Express   │
                         │                         │
                         │  REST API               │
                         │  Pull Controller        │
                         │  Socket.IO Server       │
                         └────────────┬────────────┘
                                      │
                         202 Accepted │
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │    Background Pull      │
                         │       Service           │
                         └────────────┬────────────┘
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │       Mock BSE API      │
                         │                         │
                         │ GET /getTrades          │
                         │ Configurable delay      │
                         │ 3000 seeded trades      │
                         └────────────┬────────────┘
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │        MongoDB          │
                         │                         │
                         │       trades            │
                         └────────────┬────────────┘
                                      │
                                      │
                         Socket.IO event
                         "pullCompleted"
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │     React Dashboard     │
                         │                         │
                         │ Reloads latest trades   │
                         │ without page refresh   │
                         └─────────────────────────┘
```

## 3. Request Flow

### Initial Dashboard Load

```text
React
  │
  └── GET /api/trades
          │
          ▼
      Express
          │
          ▼
       MongoDB
          │
          ▼
   Existing trades
          │
          ▼
      Dashboard
```

The dashboard can therefore display previously pulled trades immediately.

---

## 4. Starting a Pull

The dashboard sends:

```http
POST /api/pull/start
```

The backend does not wait for the BSE operation to finish.

It immediately returns:

```http
202 Accepted
```

with:

```json
{
  "success": true,
  "message": "Trade pull started in background"
}
```

The long-running operation continues in the background.

---

## 5. Background Pull

The background service calls the mock BSE service.

The mock BSE API applies a configurable delay:

```text
BSE_DELAY_MS=10000
```

during development, or:

```text
BSE_DELAY_MS=900000
```

to simulate the required 15-minute delay.

After the delay, approximately 3,000 trade records are generated.

---

## 6. Persistence

The returned trades are stored in MongoDB.

The application uses `tradeId` as the unique identifier.

The background service uses an upsert operation so that existing trades are updated rather than duplicated.

---

## 7. Real-Time Dashboard Updates

After successfully storing the new trades, the backend emits:

```javascript
io.emit("pullCompleted", {
  success: true,
  message: "New trades have been pulled successfully",
  tradeCount: trades.length
});
```

The React dashboard listens for this Socket.IO event.

When the event is received, the dashboard requests the latest trades from:

```http
GET /api/trades
```

The table is then updated without:

- Page refresh
- Polling
- Cron jobs
- Scheduled jobs

---

## 8. Why This Design?

### Avoids the 30-second network timeout

The browser only waits for the short `/api/pull/start` request.

It does not wait for the 15-minute BSE request.

### Dashboard remains usable

Previously stored trades remain visible while a new pull is running.

### Real-time updates

Socket.IO allows the backend to notify connected dashboards when the pull completes.

### Persistent storage

MongoDB allows trades from previous pulls to remain available after restarting the dashboard.

### Configurable simulation

The BSE delay is controlled through an environment variable, making it possible to test with a short delay while still demonstrating the required 15-minute scenario.

---

## 9. Technology Stack

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

### Database

- MongoDB
- Mongoose

### Development

- Nodemon
- dotenv

---

## 10. Important Design Constraint

The system intentionally avoids making the frontend directly wait for the long-running BSE API request.

The frontend communicates only with the application's backend.

This keeps the BSE integration isolated and allows the backend to control persistence, background execution, and real-time notifications.