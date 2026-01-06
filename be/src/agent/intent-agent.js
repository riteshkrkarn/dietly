import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

// ============================================
// INTENT AGENT
// Infers why the user scanned this product
// ============================================

const INTENT_SYSTEM_PROMPT = `You are an intent classifier for a nutrition app. Given a product name and its nutrients, infer WHY the user likely scanned this product.

Common intents:
- "quick_energy" - Energy bars, sports drinks, glucose tablets
- "protein_source" - Protein bars, shakes, meat, eggs
- "meal_replacement" - Meal replacement shakes, complete nutrition products
- "snack" - Chips, cookies, candy, casual snacks
- "health_check" - Checking if something is healthy
- "diet_compliance" - Checking macros for keto, low-carb, etc.
- "sugar_watch" - Concerned about sugar content
- "heart_health" - Watching sodium, cholesterol, saturated fat

Return ONLY valid JSON:
{
  "intent": "quick_energy",
  "confidence": 0.85,
  "assumption": "I'm assuming you want this for quick energy",
  "reasoning": "Energy bars are typically consumed for fast fuel",
  "alternatives": ["pre_workout", "meal_replacement"]
}

Rules:
- Pick the most likely intent based on product type
- Confidence should be 0.5-1.0 based on how certain you are
- Always provide 2-3 alternative intents
- Keep assumption text short (under 15 words)`;

/**
 * Create the Intent Agent
 */
const createIntentAgent = () => {
  return new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.3,
  });
};

/**
 * Infer user intent from product data
 * @param {string} productName - Name of the product
 * @param {array} nutrients - Array of nutrients [{name, value, unit}]
 * @returns {object} Intent classification
 */
export const inferUserIntent = async (productName, nutrients) => {
  const agent = createIntentAgent();

  // Build context for classification
  const nutrientSummary = nutrients
    .slice(0, 5)
    .map((n) => `${n.name}: ${n.value}${n.unit}`)
    .join(", ");

  const messages = [
    new SystemMessage(INTENT_SYSTEM_PROMPT),
    new HumanMessage(
      `Product: ${productName}\nKey nutrients: ${nutrientSummary || "Not available"}`
    ),
  ];

  try {
    console.log("🎯 Intent Agent: Classifying user intent...");

    const response = await agent.invoke(messages);
    const content = response.content;

    // Extract JSON from response
    let parsed;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
        content.match(/```\s*([\s\S]*?)\s*```/) || [null, content];
      parsed = JSON.parse(jsonMatch[1] || content);
    } catch {
      console.error("❌ Intent Agent: Failed to parse JSON response");
      return fallbackIntent(productName);
    }

    console.log(
      "✅ Intent Agent:",
      parsed.intent,
      `(${Math.round(parsed.confidence * 100)}% confident)`
    );

    return {
      success: true,
      intent: parsed.intent || "health_check",
      confidence: parsed.confidence || 0.5,
      assumption: parsed.assumption || "I'm analyzing this for general health",
      reasoning: parsed.reasoning || "",
      alternatives: parsed.alternatives || ["health_check", "snack"],
    };
  } catch (error) {
    console.error("❌ Intent Agent Error:", error.message);
    return fallbackIntent(productName);
  }
};

/**
 * Fallback intent classification based on keywords
 */
const fallbackIntent = (productName) => {
  console.log("⚠️ Intent Agent: Using fallback classification");

  const name = productName.toLowerCase();

  // Simple keyword matching
  if (
    name.includes("energy") ||
    name.includes("bar") ||
    name.includes("sport")
  ) {
    return {
      success: true,
      intent: "quick_energy",
      confidence: 0.6,
      assumption: "I'm assuming you want this for energy",
      reasoning: "Product name suggests energy purpose",
      alternatives: ["snack", "protein_source"],
      usedFallback: true,
    };
  }

  if (
    name.includes("protein") ||
    name.includes("whey") ||
    name.includes("muscle")
  ) {
    return {
      success: true,
      intent: "protein_source",
      confidence: 0.7,
      assumption: "I'm assuming you need this for protein",
      reasoning: "Product name suggests protein focus",
      alternatives: ["meal_replacement", "quick_energy"],
      usedFallback: true,
    };
  }

  // Default fallback
  return {
    success: true,
    intent: "health_check",
    confidence: 0.5,
    assumption: "I'm checking if this is healthy for you",
    reasoning: "General product scan",
    alternatives: ["snack", "diet_compliance"],
    usedFallback: true,
  };
};

export default inferUserIntent;
