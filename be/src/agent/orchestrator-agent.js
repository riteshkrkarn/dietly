import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";
import {
  allTools,
  parseNutritionLabel,
  getNutritionSuggestions,
} from "./tools/nutrition-tools.js";
import { agentLogger } from "./agent-logger.js";

// ============================================
// ORCHESTRATOR AGENT
// ============================================

const createOrchestratorAgent = () => {
  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0,
  });

  return model.bindTools(allTools);
};

/**
 * Tool executor - maps tool names to functions
 */
const toolRegistry = {
  parse_nutrition_label: parseNutritionLabel,
  get_nutrition_suggestions: getNutritionSuggestions,
};

/**
 * Execute a tool by name
 */
const executeToolByName = async (toolName, args) => {
  const tool = toolRegistry[toolName];
  if (!tool) {
    throw new Error(`Unknown tool: ${toolName}`);
  }
  return await tool.invoke(args);
};

// ============================================
// MAIN PROCESSING FUNCTION
// ============================================

/**
 * Process user request through the orchestrator
 * @param {string} rawText - OCR text from nutrition label
 * @param {function} onEvent - Callback for real-time events
 */
export const processWithOrchestrator = async (rawText, onEvent) => {
  const sessionId = agentLogger.startSession();
  onEvent({ type: "session_start", sessionId });

  const agent = createOrchestratorAgent();

  // Prompt for the orchestrator
  const userMessage = `You are a nutrition analysis assistant with access to tools.

Use the parse_nutrition_label tool to extract nutrition information from this OCR text:

${rawText}

Call the appropriate tool to process this.`;

  agentLogger.logThinking("Analyzing request to determine which tool to use");
  onEvent({
    type: "thinking",
    message: "🧠 Orchestrator analyzing request...",
  });

  try {
    // Step 1: Agent decides which tool to call
    const response = await agent.invoke([new HumanMessage(userMessage)]);

    // Step 2: Check if agent wants to call a tool
    if (response.tool_calls && response.tool_calls.length > 0) {
      const toolCall = response.tool_calls[0];

      agentLogger.logToolSelected(toolCall.name, "Selected based on request");
      onEvent({
        type: "tool_selected",
        tool: toolCall.name,
        message: `🔧 Selected: ${toolCall.name}`,
      });

      // Step 3: Execute the tool
      agentLogger.logToolExecuting(toolCall.name, toolCall.args);
      onEvent({
        type: "tool_executing",
        tool: toolCall.name,
        message: `⚙️ Executing ${toolCall.name}...`,
      });

      const toolResult = await executeToolByName(toolCall.name, toolCall.args);

      agentLogger.logToolResult(toolCall.name, toolResult);
      onEvent({
        type: "tool_result",
        tool: toolCall.name,
        message: "✅ Tool completed",
      });

      // Step 4: Parse and return result
      let report = null;
      try {
        report = JSON.parse(toolResult);
        report.analyzedAt = new Date().toISOString();
        report.summary = { totalNutrients: report.nutrients?.length || 0 };
      } catch (e) {
        console.error("Failed to parse tool result:", e);
      }

      const resultData = {
        success: true,
        toolsUsed: [{ tool: toolCall.name, args: toolCall.args }],
        report,
        logs: agentLogger.endSession({
          nutrientsFound: report?.nutrients?.length || 0,
        }),
      };

      onEvent({ type: "complete", data: resultData });
      return resultData;
    } else {
      // No tool call - direct response
      agentLogger.logThinking("No tool needed, responding directly");

      const resultData = {
        success: true,
        toolsUsed: [],
        agentResponse: response.content,
        logs: agentLogger.endSession({ directResponse: true }),
      };

      onEvent({ type: "complete", data: resultData });
      return resultData;
    }
  } catch (error) {
    console.error("❌ Orchestrator Error:", error.message);
    agentLogger.logError(error);
    const logs = agentLogger.endSession({ error: error.message });

    onEvent({ type: "error", message: error.message });

    return {
      success: false,
      error: error.message,
      toolsUsed: [],
      logs,
    };
  }
};

// ============================================
// EXPORTS
// ============================================

// For backwards compatibility with existing code
export const processNutritionTextWithStreaming = processWithOrchestrator;

export const processNutritionText = async (rawText) => {
  let result = null;
  await processWithOrchestrator(rawText, (event) => {
    if (event.type === "complete") {
      result = event.data;
    }
  });
  return result;
};
