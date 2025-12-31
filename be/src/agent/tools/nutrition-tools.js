import { tool } from "@langchain/core/tools";
import { z } from "zod";

/**
 * Single tool: Parse nutrition text and return structured output
 * One call, one response - no multi-step agent needed
 */
export const parseNutritionLabel = tool(
  async ({ rawText }) => {
    // This tool just validates and passes through
    // The actual extraction is done by the LLM's understanding
    return JSON.stringify({
      received: true,
      textLength: rawText.length,
      message: "Text received. Parse and extract all nutrients.",
    });
  },
  {
    name: "parse_nutrition_label",
    description: `Parses raw OCR text from a nutrition label and extracts structured data.

INPUT: Raw OCR text from nutrition label
OUTPUT: Structured nutrition data

EXAMPLE INPUT:
{
  "rawText": "Nutrition Facts Serving Size 1 cup (240ml) Calories 150 Total Fat 8g Sodium 120mg Protein 3g"
}

EXAMPLE OUTPUT (you must return this JSON structure):
{
  "productName": "Unknown",
  "servingSize": "1 cup (240ml)",
  "nutrients": [
    {"name": "calories", "value": 150, "unit": "kcal"},
    {"name": "total fat", "value": 8, "unit": "g"},
    {"name": "sodium", "value": 120, "unit": "mg"},
    {"name": "protein", "value": 3, "unit": "g"}
  ]
}`,
    schema: z.object({
      rawText: z.string().describe("Raw OCR text from nutrition label"),
    }),
  }
);

export const nutritionTools = [parseNutritionLabel];
