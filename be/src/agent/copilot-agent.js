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
  "suggestions": ["Follow-up question 1?", "Follow-up question 2?", "Follow-up question 3?"],
  "actionCards": [
    {"id": "compare", "label": "Compare with another product", "icon": "🔄"},
    {"id": "explain", "label": "Explain the ingredients", "icon": "📋"}
  ]
}

Guidelines for suggestions:
- These are questions the USER might want to ask YOU next
- NOT questions you ask the user - the user clicks these to ask you
- Examples: "Is this high in sodium?", "What are the main ingredients?", "Is this good for weight loss?"
- Bad examples: "Are you looking for...", "What are your goals?" - these are questions TO the user, not FROM the user

Guidelines for actionCards:
- Generate 2-4 contextual actions based on what would be helpful
- Common actions: compare, explain ingredients, check for concerns, daily intake fit
- Only include relevant actions for the current context`;

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
 */
export const processCopilotChat = async (
  message,
  productContext,
  chatHistory = []
) => {
  const agent = createCopilotAgent();

  // Build context
  const productInfo = formatProductContext(productContext);

  // Build messages array - system message first, then context as human message
  const messages = [
    new SystemMessage(COPILOT_SYSTEM_PROMPT),
    new HumanMessage(`Product Context:\n${productInfo}`),
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
