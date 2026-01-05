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
// NUTRITION ANALYSIS TOOL - Direct & Decisive
// ============================================

// Daily recommended limits (based on FDA 2000 calorie diet)
const DAILY_LIMITS = {
  calories: 2000,
  totalFat: 65, // g
  saturatedFat: 20, // g
  transFat: 0, // g - should be zero
  cholesterol: 300, // mg
  sodium: 2300, // mg
  carbohydrates: 300, // g
  fiber: 25, // g (minimum)
  sugar: 50, // g (max added sugars)
  protein: 50, // g (minimum)
};

// Thresholds for concern (per serving)
const CONCERN_THRESHOLDS = {
  calories: { high: 400, veryHigh: 600 },
  sodium: { high: 500, veryHigh: 800 },
  sugar: { high: 12, veryHigh: 20 },
  saturatedFat: { high: 5, veryHigh: 8 },
  transFat: { any: 0.5 },
  cholesterol: { high: 60, veryHigh: 100 },
};

export const getNutritionSuggestions = tool(
  async ({ nutrients }) => {
    const concerns = [];
    const positives = [];
    let overallScore = 0; // -10 to +10 scale

    for (const nutrient of nutrients) {
      const name = nutrient.name.toLowerCase();
      const value = nutrient.value;
      const unit = nutrient.unit;

      // === NEGATIVE FACTORS ===

      // Trans Fat - Zero tolerance
      if (name.includes("trans") && value > 0) {
        concerns.push({
          nutrient: "Trans Fat",
          value: `${value}${unit}`,
          severity: "CRITICAL",
          reason:
            "Trans fats have NO safe level. They directly increase heart disease risk by raising LDL (bad) cholesterol and lowering HDL (good) cholesterol.",
        });
        overallScore -= 4;
      }

      // Sodium
      if (name.includes("sodium")) {
        const pctDaily = Math.round((value / DAILY_LIMITS.sodium) * 100);
        if (value > CONCERN_THRESHOLDS.sodium.veryHigh) {
          concerns.push({
            nutrient: "Sodium",
            value: `${value}${unit} (${pctDaily}% daily limit)`,
            severity: "HIGH",
            reason:
              "This single serving contains over 1/3 of your daily sodium limit. Excess sodium raises blood pressure and strains your cardiovascular system.",
          });
          overallScore -= 3;
        } else if (value > CONCERN_THRESHOLDS.sodium.high) {
          concerns.push({
            nutrient: "Sodium",
            value: `${value}${unit} (${pctDaily}% daily limit)`,
            severity: "MODERATE",
            reason:
              "Elevated sodium. If you eat this regularly, you'll likely exceed daily limits.",
          });
          overallScore -= 1.5;
        }
      }

      // Sugar
      if (name.includes("sugar") && !name.includes("added")) {
        const pctDaily = Math.round((value / DAILY_LIMITS.sugar) * 100);
        if (value > CONCERN_THRESHOLDS.sugar.veryHigh) {
          concerns.push({
            nutrient: "Sugar",
            value: `${value}${unit} (${pctDaily}% daily limit)`,
            severity: "HIGH",
            reason:
              "This is nearly half your daily sugar allowance in one serving. High sugar intake is linked to obesity, type 2 diabetes, and tooth decay.",
          });
          overallScore -= 3;
        } else if (value > CONCERN_THRESHOLDS.sugar.high) {
          concerns.push({
            nutrient: "Sugar",
            value: `${value}${unit} (${pctDaily}% daily limit)`,
            severity: "MODERATE",
            reason:
              "Notable sugar content. Consider if this aligns with your health goals.",
          });
          overallScore -= 1.5;
        }
      }

      // Saturated Fat
      if (name.includes("saturated")) {
        const pctDaily = Math.round((value / DAILY_LIMITS.saturatedFat) * 100);
        if (value > CONCERN_THRESHOLDS.saturatedFat.veryHigh) {
          concerns.push({
            nutrient: "Saturated Fat",
            value: `${value}${unit} (${pctDaily}% daily limit)`,
            severity: "HIGH",
            reason:
              "High saturated fat raises LDL cholesterol. The American Heart Association recommends limiting to 5-6% of daily calories.",
          });
          overallScore -= 2.5;
        } else if (value > CONCERN_THRESHOLDS.saturatedFat.high) {
          concerns.push({
            nutrient: "Saturated Fat",
            value: `${value}${unit} (${pctDaily}% daily limit)`,
            severity: "MODERATE",
            reason:
              "Moderate saturated fat content. Watch your total daily intake.",
          });
          overallScore -= 1;
        }
      }

      // Cholesterol
      if (name.includes("cholesterol")) {
        const pctDaily = Math.round((value / DAILY_LIMITS.cholesterol) * 100);
        if (value > CONCERN_THRESHOLDS.cholesterol.veryHigh) {
          concerns.push({
            nutrient: "Cholesterol",
            value: `${value}${unit} (${pctDaily}% daily limit)`,
            severity: "HIGH",
            reason:
              "High dietary cholesterol. If you have heart disease risk factors, this is concerning.",
          });
          overallScore -= 2;
        } else if (value > CONCERN_THRESHOLDS.cholesterol.high) {
          concerns.push({
            nutrient: "Cholesterol",
            value: `${value}${unit} (${pctDaily}% daily limit)`,
            severity: "MODERATE",
            reason: "Elevated cholesterol per serving.",
          });
          overallScore -= 1;
        }
      }

      // Calories
      if (name.includes("calories")) {
        const pctDaily = Math.round((value / DAILY_LIMITS.calories) * 100);
        if (value > CONCERN_THRESHOLDS.calories.veryHigh) {
          concerns.push({
            nutrient: "Calories",
            value: `${value}kcal (${pctDaily}% daily intake)`,
            severity: "HIGH",
            reason:
              "This is nearly 1/3 of a typical daily calorie budget in one serving.",
          });
          overallScore -= 2;
        } else if (value > CONCERN_THRESHOLDS.calories.high) {
          concerns.push({
            nutrient: "Calories",
            value: `${value}kcal (${pctDaily}% daily intake)`,
            severity: "MODERATE",
            reason: "Calorie-dense. Be mindful of portion size.",
          });
          overallScore -= 1;
        }
      }

      // === POSITIVE FACTORS ===

      // Protein
      if (name.includes("protein") && value >= 10) {
        positives.push({
          nutrient: "Protein",
          value: `${value}${unit}`,
          reason:
            "Good protein content. Helps with satiety and muscle maintenance.",
        });
        overallScore += 1.5;
      }

      // Fiber
      if (name.includes("fiber")) {
        if (value >= 5) {
          positives.push({
            nutrient: "Fiber",
            value: `${value}${unit}`,
            reason:
              "Excellent fiber content. Supports digestive health and blood sugar control.",
          });
          overallScore += 2;
        } else if (value >= 3) {
          positives.push({
            nutrient: "Fiber",
            value: `${value}${unit}`,
            reason: "Decent fiber content.",
          });
          overallScore += 1;
        }
      }
    }

    // === DETERMINE VERDICT ===
    let verdict, verdictEmoji, verdictExplanation;

    if (overallScore <= -5 || concerns.some((c) => c.severity === "CRITICAL")) {
      verdict = "NOT RECOMMENDED";
      verdictEmoji = "🚫";
      verdictExplanation =
        "This product has significant nutritional red flags. Regular consumption could negatively impact your health.";
    } else if (overallScore <= -2) {
      verdict = "PROCEED WITH CAUTION";
      verdictEmoji = "⚠️";
      verdictExplanation =
        "This product has some concerning nutritional aspects. Occasional consumption is fine, but don't make it a habit.";
    } else if (overallScore < 2) {
      verdict = "ACCEPTABLE";
      verdictEmoji = "🤷";
      verdictExplanation =
        "Nothing particularly good or bad. It's fine if it fits your dietary goals.";
    } else {
      verdict = "RECOMMENDED";
      verdictEmoji = "✅";
      verdictExplanation =
        "This product has a reasonable nutritional profile with some positive attributes.";
    }

    // === BUILD SUMMARY ===
    let summary = `${verdictEmoji} **${verdict}**\n\n${verdictExplanation}\n\n`;

    if (concerns.length > 0) {
      summary += "**Issues Found:**\n";
      for (const c of concerns) {
        summary += `• ${c.nutrient}: ${c.value} — ${c.reason}\n`;
      }
      summary += "\n";
    }

    if (positives.length > 0) {
      summary += "**Positives:**\n";
      for (const p of positives) {
        summary += `• ${p.nutrient}: ${p.value} — ${p.reason}\n`;
      }
      summary += "\n";
    }

    if (concerns.length === 0 && positives.length === 0) {
      summary +=
        "*I couldn't identify any standout concerns or benefits from the available data. This may be due to incomplete nutrition information.*\n\n";
    }

    // === FOLLOW-UP QUESTIONS ===
    const followUpQuestions = [];

    if (concerns.some((c) => c.nutrient === "Sodium")) {
      followUpQuestions.push("What are the health risks of high sodium?");
    }
    if (concerns.some((c) => c.nutrient === "Sugar")) {
      followUpQuestions.push("How does sugar affect my body?");
    }
    if (
      concerns.some(
        (c) => c.nutrient === "Saturated Fat" || c.nutrient === "Trans Fat"
      )
    ) {
      followUpQuestions.push("Why is this bad for my heart?");
    }
    if (verdict === "NOT RECOMMENDED") {
      followUpQuestions.push("What's a healthier alternative?");
    }
    if (verdict === "PROCEED WITH CAUTION") {
      followUpQuestions.push("How often can I eat this safely?");
    }

    // Ensure we have 2-3 questions
    const defaultQuestions = [
      "What should I look for in a healthier option?",
      "How does this compare to similar products?",
      "Is this okay for someone with diabetes?",
    ];

    while (followUpQuestions.length < 2) {
      const q = defaultQuestions.shift();
      if (q && !followUpQuestions.includes(q)) {
        followUpQuestions.push(q);
      }
    }

    return JSON.stringify({
      success: true,
      summary: summary.trim(),
      verdict,
      verdictEmoji,
      concerns,
      positives,
      followUpQuestions: followUpQuestions.slice(0, 3),
    });
  },
  {
    name: "get_nutrition_suggestions",
    description:
      "Analyzes nutrients and provides a direct, evidence-based verdict with follow-up questions.",
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
