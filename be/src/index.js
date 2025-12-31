import dotenv from "dotenv";
import { app } from "./app.js";
import { initializeWorker } from "./utils/image-parser.js";

// Load environment variables
dotenv.config({
  path: "./.env",
});

const PORT = process.env.PORT || 8000;

// Start server
app.listen(PORT, async () => {
  console.log(`⚙️  Server is running on port: ${PORT}`);

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
