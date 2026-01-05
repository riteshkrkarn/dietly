import { extractTextFromImage } from "../utils/image-parser.js";
import {
  processNutritionText,
  processNutritionTextWithStreaming,
} from "../agent/orchestrator-agent.js";
import { getNutritionSuggestions } from "../agent/tools/nutrition-tools.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import fs from "fs";

/**
 * Scan ingredients - Extract text only (raw OCR)
 */
export const scanIngredients = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Please upload an image");
  }

  const imagePath = req.file.path;

  try {
    const extractedText = await extractTextFromImage(imagePath);

    fs.unlink(imagePath, (err) => {
      if (err) console.error("Error deleting temp file:", err);
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { text: extractedText },
          "Text extracted successfully"
        )
      );
  } catch (error) {
    fs.unlink(imagePath, () => {});
    throw new ApiError(500, `Failed to extract text: ${error.message}`);
  }
});

/**
 * Scan and analyze nutrition - OCR + AI Agent (non-streaming)
 */
export const scanAndAnalyzeNutrition = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Please upload an image");
  }

  const imagePath = req.file.path;

  try {
    console.log("📸 Extracting text from image...");
    const extractedText = await extractTextFromImage(imagePath);
    console.log("✅ Text extracted");

    console.log("🤖 Processing with AI agent...");
    const nutritionData = await processNutritionText(extractedText);
    console.log("✅ Nutrition data extracted");

    fs.unlink(imagePath, (err) => {
      if (err) console.error("Error deleting temp file:", err);
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          rawText: extractedText,
          nutrition: nutritionData,
        },
        "Nutrition data extracted successfully"
      )
    );
  } catch (error) {
    console.error("❌ Error:", error);
    fs.unlink(imagePath, () => {});
    throw new ApiError(500, `Failed to analyze nutrition: ${error.message}`);
  }
});

/**
 * SSE Streaming endpoint - Real-time agent updates
 */
export const scanAndAnalyzeNutritionStream = async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "Please upload an image" });
    return;
  }

  const imagePath = req.file.path;

  // Set up SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();

  // Helper to send SSE events
  const sendEvent = (event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  try {
    // Step 1: OCR
    sendEvent({ type: "status", message: "📸 Extracting text from image..." });
    const extractedText = await extractTextFromImage(imagePath);
    sendEvent({
      type: "ocr_complete",
      text: extractedText.substring(0, 200) + "...",
    });

    // Step 2: Agent processing with streaming
    sendEvent({
      type: "status",
      message: "🤖 AI Agent analyzing nutrition data...",
    });

    await processNutritionTextWithStreaming(extractedText, (event) => {
      sendEvent(event);
    });

    // Clean up
    fs.unlink(imagePath, () => {});

    // Send raw text in final event
    sendEvent({ type: "raw_text", text: extractedText });
    sendEvent({ type: "done" });
    res.end();
  } catch (error) {
    console.error("❌ SSE Error:", error);
    fs.unlink(imagePath, () => {});
    sendEvent({ type: "error", message: error.message });
    res.end();
  }
};

/**
 * Get suggestions based on confirmed nutrients
 */
export const getSuggestions = asyncHandler(async (req, res) => {
  const { nutrients } = req.body;

  if (!nutrients || !Array.isArray(nutrients)) {
    throw new ApiError(400, "Please provide nutrients array");
  }

  console.log("💡 Getting suggestions for", nutrients.length, "nutrients");

  const result = await getNutritionSuggestions.invoke({ nutrients });
  const suggestions = JSON.parse(result);

  console.log("✅ Analysis complete:", suggestions.verdict);

  return res
    .status(200)
    .json(
      new ApiResponse(200, suggestions, "Suggestions generated successfully")
    );
});
