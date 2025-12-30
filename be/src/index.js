import dotenv from "dotenv";
import { app } from "./app.js";

// Load environment variables
dotenv.config({
  path: "./.env",
});

const PORT = process.env.PORT || 8000;

// Start server
app.listen(PORT, () => {
  console.log(`⚙️  Server is running on port: ${PORT}`);
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
