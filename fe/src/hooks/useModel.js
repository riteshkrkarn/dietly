import { useState, useEffect } from "react";

const STORAGE_KEY = "dietly_selected_model";
const DEFAULT_MODEL = "gemini-2.5-flash";

// Mirrors the backend model-config.js list
export const AVAILABLE_MODELS = [
  // --- Gemini (Google AI Studio free tier) ---
  {
    id: "gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    provider: "gemini",
    description: "Fastest, latest Gemini free-tier model",
    badge: "Recommended",
  },
  {
    id: "gemini-2.0-flash",
    label: "Gemini 2.0 Flash",
    provider: "gemini",
    description: "Stable, multimodal Gemini model",
  },
  {
    id: "gemini-1.5-flash",
    label: "Gemini 1.5 Flash",
    provider: "gemini",
    description: "Lightweight & fast — legacy free tier",
  },
  {
    id: "gemini-1.5-flash-8b",
    label: "Gemini 1.5 Flash-8B",
    provider: "gemini",
    description: "Smallest Gemini model, highest throughput",
  },
  // --- Groq (free tier) ---
  {
    id: "llama-3.3-70b-versatile",
    label: "Llama 3.3 70B",
    provider: "groq",
    description: "Best quality Groq model — powerful & versatile",
    badge: "Best on Groq",
  },
  {
    id: "llama-3.1-8b-instant",
    label: "Llama 3.1 8B Instant",
    provider: "groq",
    description: "Fastest Groq model — ultra-low latency",
  },
  {
    id: "gemma2-9b-it",
    label: "Gemma 2 9B",
    provider: "groq",
    description: "Google Gemma 2 9B — instruction-tuned",
  },
  {
    id: "deepseek-r1-distill-llama-70b",
    label: "DeepSeek R1 (70B)",
    provider: "groq",
    description: "DeepSeek R1 reasoning distilled on Llama 70B",
  },
];

export const useModel = () => {
  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_MODEL;
  });

  const selectModel = (modelId) => {
    setSelectedModel(modelId);
    localStorage.setItem(STORAGE_KEY, modelId);
  };

  const currentModelInfo = AVAILABLE_MODELS.find((m) => m.id === selectedModel) ||
    AVAILABLE_MODELS[0];

  return { selectedModel, selectModel, currentModelInfo, AVAILABLE_MODELS };
};
