import { useEffect, useState } from "react";
import { io } from "socket.io-client";

import TradeTable from "./components/TradeTable";
import {
  getTrades,
  startPull,
  getPullStatus,
} from "./api";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

function App() {
  const [trades, setTrades] = useState([]);
  const [status, setStatus] = useState("loading");
  const [tradeCount, setTradeCount] = useState(0);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const loadTrades = async () => {
    try {
      const response = await getTrades();

      if (response.success) {
        setTrades(response.data);
        setTradeCount(response.data.length);
      }
    } catch (error) {
      console.error("Failed to load trades:", error);
      setMessage("Failed to load trades");
    }
  };

  const loadStatus = async () => {
    try {
      const response = await getPullStatus();

      if (response.success) {
        setStatus(response.data.status);
      }
    } catch (error) {
      console.error("Failed to load status:", error);
    }
  };

  const handleStartPull = async () => {
    try {
      setLoading(true);
      setMessage("");

      const response = await startPull();

      if (response.success) {
        setStatus("running");
        setMessage("Trade pull started in background.");
      }
    } catch (error) {
      if (error.response?.status === 409) {
        setMessage("A trade pull is already running.");
      } else {
        setMessage("Failed to start trade pull.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrades();
    loadStatus();

    const socket = io(SOCKET_URL);

    socket.on("connect", () => {
      console.log("Connected to real-time server");
    });

    socket.on("pullCompleted", (data) => {
      console.log("Pull completed:", data);

      setStatus("completed");
      setMessage(data.message);

      // Fetch the newly stored trades.
      loadTrades();
    });

    socket.on("pullFailed", (data) => {
      setStatus("failed");
      setMessage(data.message);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>BSE Trades Dashboard</h1>
          <p>Real-time trade monitoring system</p>
        </div>

        <div className={`status status-${status}`}>
          <span className="status-dot"></span>
          {status}
        </div>
      </header>

      <main>
        <section className="dashboard-card">
          <div className="card-header">
            <div>
              <h2>Trade Data</h2>
              <p>
                {tradeCount.toLocaleString()} trades currently stored
              </p>
            </div>

            <button
              onClick={handleStartPull}
              disabled={loading || status === "running"}
            >
              {status === "running"
                ? "Pull in Progress..."
                : "Start New Pull"}
            </button>
          </div>

          {message && (
            <div className="message">
              {message}
            </div>
          )}

          <TradeTable trades={trades} />
        </section>
      </main>
    </div>
  );
}

export default App;