import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

// Middleware
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});

// Routes
import scanRouter from "./routes/scan-routes.js";
import chatRouter from "./routes/chat-routes.js";

app.use("/api/v1/scan", scanRouter);
app.use("/api/v1/chat", chatRouter);

// import userRouter from "./routes/user.routes.js";
// app.use("/api/v1/users", userRouter);

export { app };
