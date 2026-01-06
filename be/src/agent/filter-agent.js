import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

// ============================================
// FILTER AGENT
// Filters nutrients based on user intent
// ============================================

// Intent to relevant nutrients mapping
const INTENT_NUTRIENT_MAP = {
  quick_energy: ["Calories", "Total Carbohydrates", "Sugars", "Protein"],
  protein_source: ["Protein", "Calories", "Total Fat", "Saturated Fat"],
  meal_replacement: [
    "Calories",
    "Protein",
    "Total Carbohydrates",
    "Total Fat",
    "Dietary Fiber",
  ],
  snack: ["Calories", "Sugars", "Sodium", "Total Fat"],
  health_check: [
    "Calories",
    "Sodium",
    "Sugars",
    "Saturated Fat",
    "Trans Fat",
    "Cholesterol",
  ],
  diet_compliance: [
    "Calories",
    "Total Carbohydrates",
    "Total Fat",
    "Protein",
    "Sugars",
  ],
  sugar_watch: ["Sugars", "Total Carbohydrates", "Calories"],
  heart_health: ["Sodium", "Cholesterol", "Saturated Fat", "Trans Fat"],
};

const FILTER_SYSTEM_PROMPT = `You are a nutrient filter. Given a user's intent and a list of nutrients, determine which are relevant.

Return ONLY valid JSON:
{
  "relevant": [
    {"name": "Calories", "value": 250, "unit": "kcal", "relevance": "Primary energy measure"}
  ],
  "filtered": [
    {"name": "Sodium", "value": 150, "unit": "mg", "reason": "Not directly related to energy"}
  ],
  "explanation": "Focusing on 3 of 8 nutrients that matter for quick energy"
}

Rules:
- relevant: Nutrients that matter for the user's intent
- filtered: Nutrients being hidden (with reason why)
- explanation: One sentence summary of what you're focusing on`;

/**
 * Create the Filter Agent
 */
const createFilterAgent = () => {
  return new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0,
  });
};

/**
 * Filter nutrients based on intent
 * @param {array} nutrients - All nutrients
 * @param {string} intent - User's inferred intent
 * @param {string} assumption - Intent assumption text
 * @returns {object} Filtered and relevant nutrients
 */
export const filterNutrientsByIntent = async (
  nutrients,
  intent,
  assumption
) => {
  // Quick path: if few nutrients, don't filter
  if (nutrients.length <= 4) {
    console.log("📊 Filter Agent: Few nutrients, skipping filter");
    return {
      success: true,
      relevant: nutrients.map((n) => ({
        ...n,
        relevance: "Included for analysis",
      })),
      filtered: [],
      explanation: "All nutrients included due to limited data",
      skippedFilter: true,
    };
  }

  // Try rule-based filtering first (faster, no API call)
  const ruleBasedResult = ruleBasedFilter(nutrients, intent);
  if (ruleBasedResult.relevant.length >= 2) {
    console.log("📊 Filter Agent: Using rule-based filtering");
    return ruleBasedResult;
  }

  // Fall back to LLM for complex cases
  const agent = createFilterAgent();

  const nutrientList = nutrients
    .map((n) => `${n.name}: ${n.value}${n.unit}`)
    .join("\n");

  const messages = [
    new SystemMessage(FILTER_SYSTEM_PROMPT),
    new HumanMessage(
      `Intent: ${intent}\nAssumption: ${assumption}\n\nNutrients:\n${nutrientList}`
    ),
  ];

  try {
    console.log("📊 Filter Agent: Filtering for", intent);

    const response = await agent.invoke(messages);
    const content = response.content;

    let parsed;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
        content.match(/```\s*([\s\S]*?)\s*```/) || [null, content];
      parsed = JSON.parse(jsonMatch[1] || content);
    } catch {
      console.error("❌ Filter Agent: Failed to parse JSON");
      return ruleBasedResult;
    }

    console.log(
      "✅ Filter Agent:",
      parsed.relevant?.length || 0,
      "relevant,",
      parsed.filtered?.length || 0,
      "filtered"
    );

    return {
      success: true,
      relevant: parsed.relevant || [],
      filtered: parsed.filtered || [],
      explanation: parsed.explanation || "Filtered based on your goal",
    };
  } catch (error) {
    console.error("❌ Filter Agent Error:", error.message);
    return ruleBasedResult;
  }
};

/**
 * Rule-based filtering (no API call)
 */
const ruleBasedFilter = (nutrients, intent) => {
  const relevantNames =
    INTENT_NUTRIENT_MAP[intent] || INTENT_NUTRIENT_MAP.health_check;

  const relevant = [];
  const filtered = [];

  for (const nutrient of nutrients) {
    const isRelevant = relevantNames.some((name) =>
      nutrient.name.toLowerCase().includes(name.toLowerCase())
    );

    if (isRelevant) {
      relevant.push({
        ...nutrient,
        relevance: `Key for ${intent.replace("_", " ")}`,
      });
    } else {
      filtered.push({
        ...nutrient,
        reason: `Not directly related to ${intent.replace("_", " ")}`,
      });
    }
  }

  return {
    success: true,
    relevant,
    filtered,
    explanation: `Focusing on ${relevant.length} of ${nutrients.length} nutrients for ${intent.replace("_", " ")}`,
    usedRules: true,
  };
};

export default filterNutrientsByIntent;
