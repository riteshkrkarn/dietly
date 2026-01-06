import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

// ============================================
// PARSER AGENT
// Extracts structured nutrition data from OCR text
// ============================================

const PARSER_SYSTEM_PROMPT = `You are a nutrition label parser. Extract structured data from OCR text.

Your task:
1. Identify the product name from context clues in the text
2. Extract serving size
3. Extract all nutrients with their values and units

Return ONLY valid JSON in this exact format:
{
  "productName": "Product Name Here",
  "servingSize": "1 cup (240ml)",
  "nutrients": [
    {"name": "Calories", "value": 150, "unit": "kcal"},
    {"name": "Total Fat", "value": 8, "unit": "g"}
  ]
}

Rules:
- If product name is unclear, use "Unknown Product"
- If serving size is not found, use "Not specified"  
- Only include nutrients you can clearly identify
- Values must be numbers, not strings
- Common nutrients: Calories, Total Fat, Saturated Fat, Trans Fat, Cholesterol, Sodium, Total Carbohydrates, Dietary Fiber, Sugars, Protein`;

/**
 * Create the Parser Agent
 */
const createParserAgent = () => {
  return new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0,
  });
};

/**
 * Process OCR text and extract nutrition data
 * @param {string} ocrText - Raw OCR text from image
 * @returns {object} Parsed nutrition data
 */
export const parseNutritionData = async (ocrText) => {
  const agent = createParserAgent();

  const messages = [
    new SystemMessage(PARSER_SYSTEM_PROMPT),
    new HumanMessage(`Parse this nutrition label OCR text:\n\n${ocrText}`),
  ];

  try {
    console.log("📋 Parser Agent: Processing OCR text...");

    const response = await agent.invoke(messages);
    const content = response.content;

    // Extract JSON from response
    let parsed;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
        content.match(/```\s*([\s\S]*?)\s*```/) || [null, content];
      parsed = JSON.parse(jsonMatch[1] || content);
    } catch {
      console.error("❌ Parser Agent: Failed to parse JSON response");
      // Fallback to regex parsing
      return fallbackParse(ocrText);
    }

    console.log(
      "✅ Parser Agent: Extracted",
      parsed.nutrients?.length || 0,
      "nutrients"
    );

    return {
      success: true,
      productName: parsed.productName || "Unknown Product",
      servingSize: parsed.servingSize || "Not specified",
      nutrients: parsed.nutrients || [],
      rawText: ocrText,
    };
  } catch (error) {
    console.error("❌ Parser Agent Error:", error.message);
    // Fallback to regex parsing on error
    return fallbackParse(ocrText);
  }
};

/**
 * Fallback regex-based parsing (from original tool)
 */
const fallbackParse = (ocrText) => {
  console.log("⚠️ Parser Agent: Using fallback regex parsing");

  const nutrients = [];
  const patterns = [
    { name: "Calories", regex: /calories?[:\s]+(\d+)/i, unit: "kcal" },
    {
      name: "Total Fat",
      regex: /total\s*fat[:\s]+(\d+\.?\d*)\s*g/i,
      unit: "g",
    },
    {
      name: "Saturated Fat",
      regex: /saturated\s*fat[:\s]+(\d+\.?\d*)\s*g/i,
      unit: "g",
    },
    {
      name: "Trans Fat",
      regex: /trans\s*fat[:\s]+(\d+\.?\d*)\s*g/i,
      unit: "g",
    },
    {
      name: "Cholesterol",
      regex: /cholesterol[:\s]+(\d+\.?\d*)\s*mg/i,
      unit: "mg",
    },
    { name: "Sodium", regex: /sodium[:\s]+(\d+\.?\d*)\s*mg/i, unit: "mg" },
    {
      name: "Total Carbohydrates",
      regex: /total\s*carbohydrate?s?[:\s]+(\d+\.?\d*)\s*g/i,
      unit: "g",
    },
    {
      name: "Dietary Fiber",
      regex: /dietary\s*fiber[:\s]+(\d+\.?\d*)\s*g/i,
      unit: "g",
    },
    { name: "Sugars", regex: /sugars?[:\s]+(\d+\.?\d*)\s*g/i, unit: "g" },
    { name: "Protein", regex: /protein[:\s]+(\d+\.?\d*)\s*g/i, unit: "g" },
  ];

  for (const { name, regex, unit } of patterns) {
    const match = ocrText.match(regex);
    if (match) {
      nutrients.push({ name, value: parseFloat(match[1]), unit });
    }
  }

  const servingMatch = ocrText.match(/serving\s*size[:\s]+([^\n]+)/i);
  const servingSize = servingMatch ? servingMatch[1].trim() : "Not specified";

  return {
    success: true,
    productName: "Unknown Product",
    servingSize,
    nutrients,
    rawText: ocrText,
    usedFallback: true,
  };
};

export default parseNutritionData;
