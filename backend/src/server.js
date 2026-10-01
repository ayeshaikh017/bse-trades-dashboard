require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const connectDB = require("./config/db");

const tradesRoutes = require("./routes/trades.routes");
const pullRoutes = require("./routes/pull.routes");
const bseRoutes = require("./mock-bse/bse.routes");

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);

app.use(express.json());

connectDB();

app.get("/", (req, res) => {
  res.send("BSE Trades Dashboard Backend is running");
});

app.use("/", bseRoutes);

app.use("/api/trades", tradesRoutes);
app.use("/api/pull", pullRoutes);

io.on("connection", (socket) => {
  console.log("Dashboard connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Dashboard disconnected:", socket.id);
  });
});

app.set("io", io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});