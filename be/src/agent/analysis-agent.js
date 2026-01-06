import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

// ============================================
// ANALYSIS AGENT
// Analyzes filtered nutrients and gives verdict
// ============================================

// Daily limits for reference
const DAILY_LIMITS = {
  calories: 2000,
  sodium: 2300,
  sugar: 50,
  saturatedFat: 20,
  cholesterol: 300,
  protein: 50,
  fiber: 25,
};

const ANALYSIS_SYSTEM_PROMPT = `You are a direct nutrition analyst. Analyze filtered nutrients and give a verdict based on the user's intent.

Your task:
1. Analyze the RELEVANT nutrients (already filtered for user's goal)
2. Give a clear verdict for their specific intent
3. List concerns and positives with specific numbers
4. Always state your assumption at the top

Return ONLY valid JSON:
{
  "assumption": "🎯 I'm assuming you want this for quick energy",
  "verdict": "GOOD FOR YOUR GOAL",
  "verdictEmoji": "✅",
  "analysis": "One paragraph analysis with specific numbers",
  "concerns": [
    {"nutrient": "Sugar", "value": "25g", "issue": "High sugar may cause energy crash"}
  ],
  "positives": [
    {"nutrient": "Protein", "value": "10g", "benefit": "Helps sustain energy"}
  ],
  "recommendation": "Eat this for quick energy, but pair with protein to avoid crash",
  "followUpQuestions": ["What's a lower-sugar alternative?", "How does sugar affect energy?"]
}

Verdict options based on intent match:
- GREAT FOR YOUR GOAL ✅
- GOOD FOR YOUR GOAL 👍
- ACCEPTABLE ⚡
- NOT IDEAL FOR YOUR GOAL ⚠️
- AVOID FOR YOUR GOAL 🚫

Rules:
- Be blunt, not polite
- Lead with data (specific numbers)
- Explain WHY things matter
- Always tie analysis back to user's intent`;

/**
 * Create the Analysis Agent
 */
const createAnalysisAgent = () => {
  return new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.3,
  });
};

/**
 * Analyze nutrients and provide verdict
 * @param {array} relevantNutrients - Filtered relevant nutrients
 * @param {array} filteredNutrients - Nutrients that were filtered out
 * @param {object} intentData - User intent data
 * @param {string} productName - Product name
 * @returns {object} Analysis with verdict
 */
export const analyzeNutrients = async (
  relevantNutrients,
  filteredNutrients,
  intentData,
  productName
) => {
  const agent = createAnalysisAgent();

  const relevantList = relevantNutrients
    .map((n) => `${n.name}: ${n.value}${n.unit}`)
    .join("\n");

  const filteredList = filteredNutrients
    .map((n) => `${n.name}: ${n.value}${n.unit} (${n.reason || "filtered"})`)
    .join("\n");

  const messages = [
    new SystemMessage(ANALYSIS_SYSTEM_PROMPT),
    new HumanMessage(
      `Product: ${productName}
Intent: ${intentData.intent}
Assumption: ${intentData.assumption}

RELEVANT NUTRIENTS (focus on these):
${relevantList || "None identified"}

FILTERED NUTRIENTS (hidden from user, for context only):
${filteredList || "None filtered"}`
    ),
  ];

  try {
    console.log("🔬 Analysis Agent: Generating verdict...");

    const response = await agent.invoke(messages);
    const content = response.content;

    let parsed;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
        content.match(/```\s*([\s\S]*?)\s*```/) || [null, content];
      parsed = JSON.parse(jsonMatch[1] || content);
    } catch {
      console.error("❌ Analysis Agent: Failed to parse JSON");
      return fallbackAnalysis(relevantNutrients, intentData);
    }

    console.log("✅ Analysis Agent:", parsed.verdict);

    return {
      success: true,
      assumption: parsed.assumption || intentData.assumption,
      verdict: parsed.verdict || "ACCEPTABLE",
      verdictEmoji: parsed.verdictEmoji || "⚡",
      analysis: parsed.analysis || "",
      concerns: parsed.concerns || [],
      positives: parsed.positives || [],
      recommendation: parsed.recommendation || "",
      followUpQuestions: parsed.followUpQuestions || [],
    };
  } catch (error) {
    console.error("❌ Analysis Agent Error:", error.message);
    return fallbackAnalysis(relevantNutrients, intentData);
  }
};

/**
 * Fallback analysis when LLM fails
 */
const fallbackAnalysis = (nutrients, intentData) => {
  console.log("⚠️ Analysis Agent: Using fallback analysis");

  const concerns = [];
  const positives = [];

  for (const n of nutrients) {
    const name = n.name.toLowerCase();
    const value = n.value;

    // Check for concerning levels
    if (name.includes("sugar") && value > 15) {
      concerns.push({
        nutrient: n.name,
        value: `${value}${n.unit}`,
        issue: "High sugar content",
      });
    }
    if (name.includes("sodium") && value > 500) {
      concerns.push({
        nutrient: n.name,
        value: `${value}${n.unit}`,
        issue: "Elevated sodium",
      });
    }
    if (name.includes("protein") && value >= 10) {
      positives.push({
        nutrient: n.name,
        value: `${value}${n.unit}`,
        benefit: "Good protein content",
      });
    }
  }

  const verdict =
    concerns.length > positives.length
      ? "NOT IDEAL FOR YOUR GOAL"
      : concerns.length > 0
        ? "ACCEPTABLE"
        : "GOOD FOR YOUR GOAL";

  return {
    success: true,
    assumption: intentData.assumption,
    verdict,
    verdictEmoji: concerns.length > positives.length ? "⚠️" : "👍",
    analysis: "Basic analysis based on nutrient thresholds.",
    concerns,
    positives,
    recommendation: "Review the nutrient details for more information.",
    followUpQuestions: [
      "What should I look for in a healthier option?",
      "How do these nutrients affect my goal?",
    ],
    usedFallback: true,
  };
};

export default analyzeNutrients;
