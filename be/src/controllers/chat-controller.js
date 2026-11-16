import { processCopilotChat } from "../agent/copilot-agent.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { ALL_MODELS, DEFAULT_MODEL } from "../agent/model-config.js";

/**
 * Chat with the copilot
 * POST /api/v1/chat
 * Body: { message, productContext, chatHistory, userPreferences, scanHistory, model }
 */
export const chat = asyncHandler(async (req, res) => {
  const { message, productContext, chatHistory, userPreferences, scanHistory, model } =
    req.body;

  if (!message || typeof message !== "string") {
    throw new ApiError(400, "Message is required");
  }

  const modelId = (model && ALL_MODELS[model]) ? model : DEFAULT_MODEL;
  console.log("💬 Chat request:", message.substring(0, 50), "| Model:", modelId);

  const result = await processCopilotChat(
    message,
    productContext,
    chatHistory || [],
    userPreferences || [],
    scanHistory || [],
    modelId
  );

  if (!result.success) {
    throw new ApiError(500, result.error);
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        reply: result.reply,
        suggestions: result.suggestions,
        actionCards: result.actionCards,
        preferencePrompt: result.preferencePrompt,
        modelUsed: modelId,
      },
      "Chat response generated"
    )
  );
});

/**
 * Get available models list
 * GET /api/v1/chat/models
 */
export const getModels = asyncHandler(async (req, res) => {
  const models = Object.entries(ALL_MODELS).map(([id, config]) => ({
    id,
    label: config.label,
    provider: config.provider,
    description: config.description,
  }));

  return res.status(200).json(
    new ApiResponse(200, { models, default: DEFAULT_MODEL }, "Available models")
  );
});
