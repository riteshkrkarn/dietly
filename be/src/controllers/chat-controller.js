import { processCopilotChat } from "../agent/copilot-agent.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";

/**
 * Chat with the copilot
 * POST /api/v1/chat
 * Body: { message, productContext, chatHistory, userPreferences, scanHistory }
 */
export const chat = asyncHandler(async (req, res) => {
  const { message, productContext, chatHistory, userPreferences, scanHistory } =
    req.body;

  if (!message || typeof message !== "string") {
    throw new ApiError(400, "Message is required");
  }

  console.log("💬 Chat request:", message.substring(0, 50));

  const result = await processCopilotChat(
    message,
    productContext,
    chatHistory || [],
    userPreferences || [],
    scanHistory || []
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
      },
      "Chat response generated"
    )
  );
});
