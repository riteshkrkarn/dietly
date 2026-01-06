import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import { app } from "./app.js";
import { initializeWorker } from "./utils/image-parser.js";

// Load environment variables
dotenv.config({
  path: "./.env",
});

const PORT = process.env.PORT || 8000;

// Create HTTP server
const httpServer = createServer(app);

// Create Socket.io server
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  },
});

// Store io instance on app for use in routes
app.set("io", io);

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("🔌 Client disconnected:", socket.id);
  });
});

// Start server
httpServer.listen(PORT, async () => {
  console.log(`⚙️  Server is running on port: ${PORT}`);
  console.log(`🔌 WebSocket ready`);

  // Preload Tesseract worker for faster first scan
  await initializeWorker();
});

// Database connection will be added here
// import connectDB from "./db/index.js";
// connectDB()
//   .then(() => {
//     app.listen(PORT, () => {
//       console.log(`⚙️  Server is running on port: ${PORT}`);
//     });
//   })
//   .catch((err) => {
//     console.log("MongoDB connection failed!", err);
//   });
