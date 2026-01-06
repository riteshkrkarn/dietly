import { parseNutritionData } from "./parser-agent.js";
import { inferUserIntent } from "./intent-agent.js";
import { filterNutrientsByIntent } from "./filter-agent.js";
import { analyzeNutrients } from "./analysis-agent.js";
import { agentLogger } from "./agent-logger.js";

// ============================================
// ORCHESTRATOR AGENT
// Coordinates the multi-agent pipeline
// ============================================

/**
 * Process nutrition label through agent pipeline
 * @param {string} rawText - OCR text from nutrition label
 * @param {function} onEvent - Callback for real-time events
 */
export const processWithOrchestrator = async (rawText, onEvent) => {
  const sessionId = agentLogger.startSession();
  onEvent({ type: "session_start", sessionId });

  try {
    // ========== STEP 1: PARSER AGENT ==========
    onEvent({
      type: "agent_start",
      agent: "Parser Agent",
      message: "📋 Parser Agent: Extracting nutrition data...",
    });

    const parsedData = await parseNutritionData(rawText);

    if (!parsedData.success) {
      throw new Error("Parser Agent failed to extract nutrition data");
    }

    onEvent({
      type: "agent_complete",
      agent: "Parser Agent",
      message: `✅ Extracted ${parsedData.nutrients?.length || 0} nutrients`,
    });

    agentLogger.logToolResult("parser_agent", parsedData);

    // ========== STEP 2: INTENT AGENT ==========
    onEvent({
      type: "agent_start",
      agent: "Intent Agent",
      message: "🎯 Intent Agent: Inferring your goal...",
    });

    const intentData = await inferUserIntent(
      parsedData.productName,
      parsedData.nutrients
    );

    onEvent({
      type: "agent_complete",
      agent: "Intent Agent",
      message: `✅ ${intentData.assumption}`,
    });

    agentLogger.logToolResult("intent_agent", intentData);

    // ========== STEP 3: FILTER AGENT ==========
    onEvent({
      type: "agent_start",
      agent: "Filter Agent",
      message: "📊 Filter Agent: Focusing on what matters...",
    });

    const filterData = await filterNutrientsByIntent(
      parsedData.nutrients,
      intentData.intent,
      intentData.assumption
    );

    onEvent({
      type: "agent_complete",
      agent: "Filter Agent",
      message: `✅ ${filterData.explanation}`,
    });

    agentLogger.logToolResult("filter_agent", filterData);

    // ========== STEP 4: ANALYSIS AGENT ==========
    onEvent({
      type: "agent_start",
      agent: "Analysis Agent",
      message: "🔬 Analysis Agent: Generating verdict...",
    });

    const analysisData = await analyzeNutrients(
      filterData.relevant,
      filterData.filtered,
      intentData,
      parsedData.productName
    );

    onEvent({
      type: "agent_complete",
      agent: "Analysis Agent",
      message: `✅ Verdict: ${analysisData.verdict}`,
    });

    agentLogger.logToolResult("analysis_agent", analysisData);

    // ========== BUILD RESULT ==========
    const report = {
      ...parsedData,
      intent: intentData,
      filter: filterData,
      analysis: analysisData,
      analyzedAt: new Date().toISOString(),
      summary: {
        totalNutrients: parsedData.nutrients?.length || 0,
        relevantNutrients: filterData.relevant?.length || 0,
        filteredNutrients: filterData.filtered?.length || 0,
      },
    };

    const resultData = {
      success: true,
      agentsUsed: [
        "Parser Agent",
        "Intent Agent",
        "Filter Agent",
        "Analysis Agent",
      ],
      report,
      logs: agentLogger.endSession({
        nutrientsFound: report.nutrients?.length || 0,
        intent: intentData.intent,
        verdict: analysisData.verdict,
      }),
    };

    onEvent({ type: "complete", data: resultData });
    return resultData;
  } catch (error) {
    console.error("❌ Orchestrator Error:", error.message);
    agentLogger.logError(error);
    const logs = agentLogger.endSession({ error: error.message });

    onEvent({ type: "error", message: error.message });

    return {
      success: false,
      error: error.message,
      agentsUsed: [],
      logs,
    };
  }
};

/**
 * Re-analyze with a specific intent (for intent override)
 * @param {object} parsedData - Already parsed nutrition data
 * @param {string} newIntent - The new intent to use
 * @returns {object} New analysis result
 */
export const reAnalyzeWithIntent = async (parsedData, newIntent) => {
  console.log("🔄 Re-analyzing with intent:", newIntent);

  // Create intent data with the overridden intent
  const intentData = {
    success: true,
    intent: newIntent,
    confidence: 1.0,
    assumption: `I'm now analyzing this for ${newIntent.replace("_", " ")}`,
    reasoning: "User selected this intent",
    alternatives: [],
    isOverride: true,
  };

  // Run filter with new intent
  const filterData = await filterNutrientsByIntent(
    parsedData.nutrients,
    newIntent,
    intentData.assumption
  );

  // Run analysis with new intent
  const analysisData = await analyzeNutrients(
    filterData.relevant,
    filterData.filtered,
    intentData,
    parsedData.productName
  );

  return {
    success: true,
    intent: intentData,
    filter: filterData,
    analysis: analysisData,
    summary: {
      totalNutrients: parsedData.nutrients?.length || 0,
      relevantNutrients: filterData.relevant?.length || 0,
      filteredNutrients: filterData.filtered?.length || 0,
    },
  };
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
