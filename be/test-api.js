// Full pipeline test with sample OCR data
import { processNutritionTextWithStreaming } from "./src/agent/nutrition-agent.js";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

// Sample OCR text from a typical nutrition label
const SAMPLE_OCR_TEXT = `
Nutrition Facts
Serving Size 1 cup (240ml)
Servings Per Container About 8

Amount Per Serving
Calories 150
  Calories from Fat 70

% Daily Value
Total Fat 8g 12%
  Saturated Fat 5g 25%
  Trans Fat 0g
Cholesterol 30mg 10%
Sodium 120mg 5%
Total Carbohydrate 13g 4%
  Dietary Fiber 0g 0%
  Sugars 12g
Protein 8g

Vitamin A 10%
Vitamin C 4%
Calcium 30%
Iron 0%
`;

async function testFullPipeline() {
  console.log("🧪 Testing Full Nutrition Parser Pipeline");
  console.log("=========================================\n");

  console.log("📝 Sample OCR Text:");
  console.log("-------------------");
  console.log(SAMPLE_OCR_TEXT.trim());
  console.log("-------------------\n");

  console.log("🚀 Starting Agent Processing...\n");

  const events = [];

  try {
    const result = await processNutritionTextWithStreaming(
      SAMPLE_OCR_TEXT,
      (event) => {
        events.push(event);

        // Log each event as it happens
        switch (event.type) {
          case "session_start":
            console.log(`🟢 Session Started: ${event.sessionId}`);
            break;
          case "tool_call":
            console.log(`� Tool Called: ${event.tool}`);
            console.log(`   Message: ${event.message}`);
            break;
          case "tool_result":
            console.log(`✅ Tool Result: ${event.tool}`);
            console.log(`   Message: ${event.message}`);
            break;
          case "complete":
            console.log(`🏁 Processing Complete!`);
            break;
          case "error":
            console.log(`❌ Error: ${event.message}`);
            break;
          default:
            console.log(`📌 Event: ${event.type}`);
        }
      }
    );

    console.log("\n=========================================");
    console.log("📊 FINAL RESULTS");
    console.log("=========================================\n");

    console.log("Success:", result.success);
    console.log("\n🔧 Tools Used:");
    result.toolsUsed?.forEach((t, i) => {
      console.log(
        `   ${i + 1}. ${t.tool}`,
        t.args ? `(${JSON.stringify(t.args)})` : ""
      );
    });

    console.log("\n📋 Extracted Report:");
    if (result.report) {
      console.log(JSON.stringify(result.report, null, 2));
    } else {
      console.log("   No structured report extracted");
      console.log("\n   Raw Agent Response:");
      console.log("   " + result.agentResponse?.substring(0, 500));
    }

    console.log("\n📝 Agent Logs:");
    result.logs?.forEach((log) => {
      console.log(
        `   [${log.type}] ${JSON.stringify(log.data).substring(0, 80)}`
      );
    });

    console.log("\n🎉 Test Complete!");
  } catch (error) {
    console.error("\n❌ Test Failed:", error.message);
    console.error(error.stack);
  }
}

testFullPipeline();
