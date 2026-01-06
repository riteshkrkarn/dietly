import { Router } from "express";
import { upload } from "../middlewares/multer-middleware.js";
import {
  scanIngredients,
  scanAndAnalyzeNutrition,
  scanAndAnalyzeNutritionStream,
  getSuggestions,
  reanalyze,
} from "../controllers/scan-controller.js";

const router = Router();

// Raw OCR extraction only
router.route("/ingredients").post(upload.single("image"), scanIngredients);

// Full analysis: OCR + AI Agent (non-streaming)
router.route("/analyze").post(upload.single("image"), scanAndAnalyzeNutrition);

// Full analysis with SSE streaming (real-time updates)
router
  .route("/analyze/stream")
  .post(upload.single("image"), scanAndAnalyzeNutritionStream);

// Get suggestions based on confirmed nutrients
router.route("/suggestions").post(getSuggestions);

// Re-analyze with a different intent
router.route("/reanalyze").post(reanalyze);

export default router;
