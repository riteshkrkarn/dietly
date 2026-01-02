import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  HumanMessage,
  SystemMessage,
  AIMessage,
} from "@langchain/core/messages";

// ============================================
// COPILOT AGENT - Contextual Chat
// ============================================

const COPILOT_SYSTEM_PROMPT = `You are a nutrition copilot helping users understand food products they've scanned. 

Your role:
- Interpret ingredient and nutrition information on behalf of the user
- Translate complex scientific or regulatory terms into clear, human-level insight  
- Communicate uncertainty honestly (say "likely" or "typically" when not 100% sure)
- Minimize cognitive load - give a clear verdict first, then explain
- Be conversational and helpful, not clinical

Response format:
Always respond with valid JSON in this exact structure:
{
  "reply": "Your helpful response here",
  "suggestions": ["Question user might ask?", "Another question?"],
  "actionCards": [{"id": "...", "label": "...", "icon": "..."}],
  "preferencePrompt": null
}

Guidelines for suggestions:
- These are questions the USER might want to ask YOU next
- NOT questions you ask the user - the user clicks these to ask you
- Examples: "Is this high in sodium?", "What are the main ingredients?"

Guidelines for actionCards:
- Generate 2-4 contextual actions
- Common: compare, explain ingredients, check concerns

Guidelines for preferencePrompt:
- When you detect a health concern (high sodium, sugar, saturated fat, cholesterol, allergens), offer to remember it
- Set preferencePrompt to: {"key": "watching_sodium", "label": "sodium", "message": "Want me to remember you're watching sodium?"}
- Keys: watching_sodium, watching_sugar, watching_fat, watching_cholesterol, avoiding_gluten, avoiding_dairy, etc.
- Only include ONE preferencePrompt per response, for the most significant concern
- If no concern detected or already mentioned, set preferencePrompt to null`;

// User preferences context (passed from frontend)
const formatUserPreferences = (preferences) => {
  if (!preferences || preferences.length === 0) return "";

  return `\n\nUser Health Preferences (personalize your response based on these):
${preferences.map((p) => `- ${p}`).join("\n")}`;
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
 */
export const processCopilotChat = async (
  message,
  productContext,
  chatHistory = [],
  userPreferences = []
) => {
  const agent = createCopilotAgent();

  // Build context with user preferences
  const productInfo = formatProductContext(productContext);
  const preferencesInfo = formatUserPreferences(userPreferences);

  // Build messages array - system message first, then context as human message
  const messages = [
    new SystemMessage(COPILOT_SYSTEM_PROMPT),
    new HumanMessage(`Product Context:\n${productInfo}${preferencesInfo}`),
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
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
        content.match(/```\s*([\s\S]*?)\s*```/) || [null, content];
      parsed = JSON.parse(jsonMatch[1] || content);
    } catch {
      // If parsing fails, create a structured response
      parsed = {
        reply: content,
        suggestions: [
          "What ingredients should I watch out for?",
          "Is this product healthy overall?",
          "How does this compare to similar products?",
        ],
        actionCards: [
          { id: "explain", label: "Explain ingredients", icon: "📋" },
          { id: "concerns", label: "Any health concerns?", icon: "⚠️" },
        ],
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
