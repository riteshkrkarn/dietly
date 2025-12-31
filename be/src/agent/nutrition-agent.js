import { GoogleGenerativeAI } from "@google/generative-ai";
import { agentLogger } from "./agent-logger.js";

const SYSTEM_PROMPT = `You are a nutrition label parser. Extract ALL nutrition information from the given OCR text.

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "productName": "string or Unknown",
  "servingSize": "string",
  "nutrients": [
    {"name": "nutrient name", "value": number, "unit": "g/mg/kcal/%"}
  ]
}

Extract these nutrients if found: Calories, Total Fat, Saturated Fat, Trans Fat, Cholesterol, Sodium, Total Carbohydrates, Dietary Fiber, Sugars, Protein, Vitamins, Minerals.`;

/**
 * Process nutrition text with streaming
 * Uses native Google AI SDK - simple and reliable
 */
export const processNutritionTextWithStreaming = async (rawText, onEvent) => {
  const sessionId = agentLogger.startSession();
  onEvent({ type: "session_start", sessionId });

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  // Use gemini-1.5-flash - the correct model name
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  agentLogger.logLLMStart(rawText);
  onEvent({
    type: "tool_call",
    tool: "parse_nutrition_label",
    message: "🔧 Parsing nutrition data...",
  });

  const prompt = `${SYSTEM_PROMPT}\n\nParse this nutrition label OCR text:\n\n${rawText}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();

    agentLogger.logLLMEnd(content);
    agentLogger.logToolResult("parse_nutrition_label", content);

    onEvent({
      type: "tool_result",
      tool: "parse_nutrition_label",
      message: "✅ Parsing complete",
    });

    // Extract JSON from response
    let report = null;
    try {
      report = JSON.parse(content);
    } catch (e) {
      const jsonMatch =
        content.match(/```json\n?([\s\S]*?)\n?```/) ||
        content.match(/```\n?([\s\S]*?)\n?```/) ||
        content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          report = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } catch (e2) {
          console.error("Failed to parse JSON:", e2);
        }
      }
    }

    if (report) {
      report.analyzedAt = new Date().toISOString();
      report.summary = { totalNutrients: report.nutrients?.length || 0 };
    }

    const resultData = {
      success: true,
      toolsUsed: [
        { tool: "parse_nutrition_label", args: { textLength: rawText.length } },
      ],
      report,
      agentResponse: content,
      logs: agentLogger.endSession({
        nutrientsFound: report?.nutrients?.length || 0,
      }),
    };

    onEvent({ type: "complete", data: resultData });
    return resultData;
  } catch (error) {
    console.error("❌ Error:", error.message);
    agentLogger.logError(error);
    const logs = agentLogger.endSession({ error: error.message });

    onEvent({ type: "error", message: error.message });

    return {
      success: false,
      error: error.message,
      toolsUsed: [],
      logs,
    };
  }
};

/**
 * Process without streaming
 */
export const processNutritionText = async (rawText) => {
  let result = null;
  await processNutritionTextWithStreaming(rawText, (event) => {
    if (event.type === "complete") {
      result = event.data;
    }
  });
  return result;
};
