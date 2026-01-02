import { tool } from "@langchain/core/tools";
import { z } from "zod";

// ============================================
// NUTRITION LABEL PARSER TOOL
// ============================================

export const parseNutritionLabel = tool(
  async ({ ocrText }) => {
    const cleanedText = ocrText
      .replace(/[|\\]/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();

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

    return JSON.stringify({
      success: true,
      productName: "Unknown",
      servingSize,
      nutrients,
      totalFound: nutrients.length,
    });
  },
  {
    name: "parse_nutrition_label",
    description:
      "Parses OCR text from a nutrition label and extracts structured nutrition data.",
    schema: z.object({
      ocrText: z
        .string()
        .describe("Raw OCR text from the nutrition label image"),
    }),
  }
);

// ============================================
// NUTRITION SUGGESTION TOOL
// ============================================

export const getNutritionSuggestions = tool(
  async ({ nutrients }) => {
    const suggestions = [];

    for (const nutrient of nutrients) {
      const name = nutrient.name.toLowerCase();
      const value = nutrient.value;

      // High Cholesterol
      if (name.includes("cholesterol") && value > 60) {
        suggestions.push({
          insight: `This has ${value}mg cholesterol per serving. High intake may affect heart health over time.`,
          question:
            "Do you have cholesterol concerns? Consider limiting intake if so.",
        });
      }

      // High Sodium
      if (name.includes("sodium") && value > 400) {
        suggestions.push({
          insight: `There's ${value}mg of sodium here. Too much salt can raise blood pressure.`,
          question:
            "Are you watching your salt intake? Maybe balance this out with something lighter.",
        });
      }

      // High Sugar
      if (name.includes("sugar") && value > 10) {
        suggestions.push({
          insight: `You're looking at ${value}g of sugar per serving. That can add up quickly.`,
          question:
            "Trying to cut back on sugar? There might be a better option out there.",
        });
      }

      // High Saturated Fat
      if (name.includes("saturated") && value > 5) {
        suggestions.push({
          insight: `This has ${value}g of saturated fat. Too much can raise your bad cholesterol.`,
          question:
            "Keeping an eye on heart health? Try to stay under 13g per day.",
        });
      }

      // Trans Fat
      if (name.includes("trans") && value > 0) {
        suggestions.push({
          insight: `There's ${value}g of trans fat here. Even small amounts aren't great for your heart.`,
          question:
            "Worth looking for an alternative? Trans fats are best avoided when possible.",
        });
      }

      // Low Fiber
      if (name.includes("fiber") && value < 2) {
        suggestions.push({
          insight: `Just ${value}g of fiber. Fiber helps with digestion and keeps you full longer.`,
          question:
            "Want more fiber? Try pairing this with some whole grains or veggies.",
        });
      }

      // High Calories
      if (name.includes("calories") && value > 300) {
        suggestions.push({
          insight: `This packs ${value} calories in one serving. That's a decent chunk of your daily intake.`,
          question: "Counting calories? You might want a smaller portion.",
        });
      }

      // Good Protein
      if (name.includes("protein") && value >= 10) {
        suggestions.push({
          insight: `Nice! ${value}g of protein here. Great for staying full and supporting your muscles.`,
          question:
            "Working out or want to feel satisfied longer? This one's got you covered.",
        });
      }
    }

    // Default if nothing found
    if (suggestions.length === 0) {
      suggestions.push({
        insight:
          "Nothing major stands out here. This seems like a reasonably balanced choice.",
        question: "Everything in moderation, right? Enjoy!",
      });
    }

    return JSON.stringify({
      success: true,
      totalSuggestions: suggestions.length,
      suggestions: suggestions.slice(0, 3),
    });
  },
  {
    name: "get_nutrition_suggestions",
    description:
      "Analyzes nutrients and provides brief health insights. Use after user confirms nutrition data.",
    schema: z.object({
      nutrients: z
        .array(
          z.object({
            name: z.string(),
            value: z.number(),
            unit: z.string(),
          })
        )
        .describe("Array of nutrients with name, value, and unit"),
    }),
  }
);

// ============================================
// TOOL REGISTRY
// ============================================
export const allTools = [parseNutritionLabel, getNutritionSuggestions];
