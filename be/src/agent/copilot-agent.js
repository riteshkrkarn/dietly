import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  HumanMessage,
  SystemMessage,
  AIMessage,
} from "@langchain/core/messages";

// ============================================
// COPILOT AGENT - Contextual Chat
// ============================================

const COPILOT_SYSTEM_PROMPT = `You are a blunt, direct nutrition analyst. You don't sugarcoat facts or give vague "it depends" answers.

CRITICAL: You MUST respond with ONLY valid JSON. No text before or after the JSON. No markdown code blocks. Just raw JSON.

Required JSON format:
{"reply": "Your direct response here", "suggestions": ["Question 1?", "Question 2?"], "actionCards": [], "preferencePrompt": null}

YOUR CORE PRINCIPLES:
1. BE DECISIVE: Give clear verdicts. "This is bad for you" not "this might not be ideal."
2. LEAD WITH DATA: Every claim must have a number. "This has 800mg sodium (35% of daily limit)" not "this is high in sodium."
3. EXPLAIN WHY: Don't just say good/bad — explain the mechanism. "High sodium raises blood pressure by causing water retention, straining your heart."
4. ADMIT LIMITS: When you don't have enough data or aren't sure, say so clearly. "I can't assess this without knowing the serving size."
5. NO FILLER: Skip pleasantries. No "Great question!" or "I'd be happy to help."
6. GIVE VERDICTS: End with a clear recommendation — eat it, avoid it, or eat occasionally.

YOUR ANALYSIS FRAMEWORK:
1. State immediate concerns or positives (with specific numbers)
2. Explain why these matter to human health (the mechanism)
3. Compare to daily limits or medical guidelines when relevant
4. Give a final verdict: RECOMMENDED / ACCEPTABLE / PROCEED WITH CAUTION / NOT RECOMMENDED

HANDLING UNCERTAINTY:
- If nutrition data is incomplete: "I can only see X nutrients. Without Y, I can't give a complete assessment."
- If context matters: "This depends on your specific health conditions. For someone with hypertension, this is risky. For a healthy athlete, it's fine."
- Never pretend to know what you don't.

Guidelines for suggestions (2-3 follow-up questions the user might ask):
- Make them specific and actionable, not generic

Guidelines for preferencePrompt:
- When you detect a significant health concern, offer to remember it
- Set preferencePrompt to: {"key": "watching_sodium", "label": "sodium", "message": "Should I flag high-sodium products for you in the future?"}
- Only include ONE preferencePrompt per response, for the most significant concern
- If no concern detected or already mentioned, set preferencePrompt to null

REMEMBER: Output ONLY the JSON object. Nothing else.`;

// User preferences context (passed from frontend)
const formatUserPreferences = (preferences) => {
  if (!preferences || preferences.length === 0) return "";

  return `\n\nUser Health Preferences (personalize your response based on these):
${preferences.map((p) => `- ${p}`).join("\n")}`;
};

// Scan history context
const formatScanHistory = (scanHistory) => {
  if (!scanHistory || scanHistory.length === 0) return "";

  return `\n\nUser's Recent Scans (you can reference these if relevant):
${scanHistory.map((s, i) => `${i + 1}. ${s.name} (scanned ${new Date(s.scannedAt).toLocaleDateString()}): ${s.keyNutrients?.join(", ") || "no nutrients recorded"}`).join("\n")}`;
};

/**
 * Create the copilot chat model
 */
const createCopilotAgent = () => {
  return new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.7,
  });
};

/**
 * Format product context for the copilot
 */
const formatProductContext = (productContext) => {
  if (!productContext) return "No product has been scanned yet.";

  const { report } = productContext;
  if (!report) return "No product data available.";

  let context = `Current Product: ${report.productName || "Unknown Product"}\n`;
  context += `Serving Size: ${report.servingSize || "Not specified"}\n\n`;
  context += "Nutrients:\n";

  if (report.nutrients && report.nutrients.length > 0) {
    for (const n of report.nutrients) {
      context += `- ${n.name}: ${n.value}${n.unit}\n`;
    }
  } else {
    context += "No nutrients extracted.\n";
  }

  return context;
};

/**
 * Process a chat message with product context
 * @param {string} message - User's message
 * @param {object} productContext - Scanned product data
 * @param {array} chatHistory - Previous messages [{role, content}]
 * @param {array} userPreferences - User's saved health preferences
 * @param {array} scanHistory - User's recent scan summaries
 */
export const processCopilotChat = async (
  message,
  productContext,
  chatHistory = [],
  userPreferences = [],
  scanHistory = []
) => {
  const agent = createCopilotAgent();

  // Build context with user preferences and scan history
  const productInfo = formatProductContext(productContext);
  const preferencesInfo = formatUserPreferences(userPreferences);
  const historyInfo = formatScanHistory(scanHistory);

  // Build messages array - system message first, then context as human message
  const messages = [
    new SystemMessage(COPILOT_SYSTEM_PROMPT),
    new HumanMessage(
      `Product Context:\n${productInfo}${preferencesInfo}${historyInfo}`
    ),
    new AIMessage("I understand. I'll help analyze this product for you."),
  ];

  // Add chat history (use AIMessage for assistant, HumanMessage for user)
  for (const msg of chatHistory.slice(-10)) {
    if (msg.role === "user") {
      messages.push(new HumanMessage(msg.content));
    } else {
      messages.push(new AIMessage(msg.content));
    }
  }

  // Add current message
  messages.push(new HumanMessage(message));

  try {
    console.log("🤖 Copilot processing:", message.substring(0, 50) + "...");

    const response = await agent.invoke(messages);
    const content = response.content;

    // Parse JSON response
    let parsed;
    try {
      // Try multiple ways to extract JSON from response
      let jsonContent = content;

      // 1. Check for markdown code blocks
      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        jsonContent = codeBlockMatch[1];
      }

      // 2. Try to find JSON object pattern { ... }
      if (!jsonContent.startsWith("{")) {
        const jsonObjectMatch = content.match(/\{[\s\S]*"reply"[\s\S]*\}/);
        if (jsonObjectMatch) {
          jsonContent = jsonObjectMatch[0];
        }
      }

      // 3. Clean up common issues
      jsonContent = jsonContent.trim();

      parsed = JSON.parse(jsonContent);
    } catch (parseError) {
      console.log("⚠️ JSON parse failed, extracting text content");

      // Extract just the text content, remove JSON artifacts
      let cleanContent = content;

      // Remove JSON-like patterns and extract readable text
      cleanContent = cleanContent.replace(/```json[\s\S]*?```/g, "");
      cleanContent = cleanContent.replace(/```[\s\S]*?```/g, "");
      cleanContent = cleanContent.replace(
        /\{[\s\S]*?"reply"[\s\S]*?\}/g,
        (match) => {
          try {
            const obj = JSON.parse(match);
            return obj.reply || "";
          } catch {
            return "";
          }
        }
      );

      // If still has JSON fragments, try to extract reply field
      const replyMatch = content.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      if (replyMatch) {
        cleanContent = replyMatch[1]
          .replace(/\\n/g, "\n")
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, "\\");
      }

      // Clean up any remaining artifacts
      cleanContent = cleanContent
        .replace(/VERDICT:\s*\w+/gi, "")
        .replace(/"suggestions"\s*:\s*\[[\s\S]*?\]/g, "")
        .replace(/"actionCards"\s*:\s*\[[\s\S]*?\]/g, "")
        .replace(/"preferencePrompt"\s*:\s*\w+/g, "")
        .replace(/\{\s*\}/g, "")
        .replace(/,\s*\}/g, "")
        .trim();

      // If we got nothing useful, use original content
      if (!cleanContent || cleanContent.length < 10) {
        cleanContent = content.replace(/[{}"]/g, "").substring(0, 500);
      }

      parsed = {
        reply: cleanContent,
        suggestions: [
          "What ingredients should I watch out for?",
          "Is this product healthy overall?",
          "How does this compare to similar products?",
        ],
        actionCards: [],
        preferencePrompt: null,
      };
    }

    console.log("✅ Copilot response generated");

    return {
      success: true,
      reply: parsed.reply,
      suggestions: parsed.suggestions || [],
      actionCards: parsed.actionCards || [],
      preferencePrompt: parsed.preferencePrompt || null,
    };
  } catch (error) {
    console.error("❌ Copilot Error:", error.message);
    return {
      success: false,
      error: error.message,
      reply: "Sorry, I had trouble processing that. Could you try again?",
      suggestions: [],
      actionCards: [],
    };
  }
};
