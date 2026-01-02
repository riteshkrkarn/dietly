// ============================================
// TEST: Suggestion Tool (No Headlines)
// ============================================

import { getNutritionSuggestions } from "./src/agent/tools/nutrition-tools.js";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const SAMPLE_NUTRIENTS = [
  { name: "Calories", value: 350, unit: "kcal" },
  { name: "Saturated Fat", value: 8, unit: "g" },
  { name: "Trans Fat", value: 0.5, unit: "g" },
  { name: "Cholesterol", value: 95, unit: "mg" },
  { name: "Sodium", value: 580, unit: "mg" },
  { name: "Sugars", value: 18, unit: "g" },
  { name: "Protein", value: 12, unit: "g" },
];

async function testSuggestions() {
  console.log("🧪 Testing Suggestion Tool\n");

  const result = await getNutritionSuggestions.invoke({
    nutrients: SAMPLE_NUTRIENTS,
  });
  const parsed = JSON.parse(result);

  console.log("💡 SUGGESTIONS:\n");

  parsed.suggestions.forEach((s, i) => {
    console.log(`${i + 1}. ${s.insight}`);
    console.log(`   ❓ ${s.question}\n`);
  });

  console.log("🎉 Done!");
}

testSuggestions();
