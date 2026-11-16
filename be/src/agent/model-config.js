import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatGroq } from "@langchain/groq";

// ============================================
// MODEL CONFIGURATION
// Centralized model selection for all agents
// ============================================

/**
 * Available Gemini free-tier models (Google AI Studio)
 */
export const GEMINI_MODELS = {
  "gemini-2.5-flash": {
    label: "Gemini 2.5 Flash",
    provider: "gemini",
    description: "Fastest, latest Gemini free-tier model",
  },
  "gemini-2.0-flash": {
    label: "Gemini 2.0 Flash",
    provider: "gemini",
    description: "Stable, multimodal Gemini model",
  },
  "gemini-1.5-flash": {
    label: "Gemini 1.5 Flash",
    provider: "gemini",
    description: "Lightweight & fast — legacy free tier",
  },
  "gemini-1.5-flash-8b": {
    label: "Gemini 1.5 Flash-8B",
    provider: "gemini",
    description: "Smallest Gemini model, highest throughput",
  },
};

/**
 * Available Groq free-tier models
 */
export const GROQ_MODELS = {
  "llama-3.3-70b-versatile": {
    label: "Llama 3.3 70B",
    provider: "groq",
    description: "Best quality Groq model — powerful & versatile",
  },
  "llama-3.1-8b-instant": {
    label: "Llama 3.1 8B Instant",
    provider: "groq",
    description: "Fastest Groq model — ultra-low latency",
  },
  "gemma2-9b-it": {
    label: "Gemma 2 9B",
    provider: "groq",
    description: "Google Gemma 2 9B — instruction-tuned",
  },
  "deepseek-r1-distill-llama-70b": {
    label: "DeepSeek R1 (Llama 70B)",
    provider: "groq",
    description: "DeepSeek R1 reasoning distilled on Llama 70B",
  },
};

export const ALL_MODELS = { ...GEMINI_MODELS, ...GROQ_MODELS };

export const DEFAULT_MODEL = "gemini-2.5-flash";

/**
 * Create a LangChain chat model instance for a given model ID.
 * @param {string} modelId - e.g. "gemini-2.5-flash" or "llama-3.3-70b-versatile"
 * @param {number} temperature - 0–1
 * @returns {BaseChatModel} LangChain chat model
 */
export const createModel = (modelId = DEFAULT_MODEL, temperature = 0.3) => {
  const config = ALL_MODELS[modelId];

  if (!config) {
    console.warn(`⚠️ Unknown model "${modelId}", falling back to ${DEFAULT_MODEL}`);
    return createModel(DEFAULT_MODEL, temperature);
  }

  if (config.provider === "groq") {
    if (!process.env.GROQ_API_KEY) {
      console.warn("⚠️ GROQ_API_KEY not set, falling back to Gemini");
      return createModel(DEFAULT_MODEL, temperature);
    }
    return new ChatGroq({
      model: modelId,
      apiKey: process.env.GROQ_API_KEY,
      temperature,
    });
  }

  // Default: Gemini
  return new ChatGoogleGenerativeAI({
    model: modelId,
    apiKey: process.env.GEMINI_API_KEY,
    temperature,
  });
};
