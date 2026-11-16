import { useState, useRef, useEffect } from "react";
import { useModel, AVAILABLE_MODELS } from "../hooks/useModel";

const PROVIDER_COLORS = {
  gemini: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    dot: "bg-blue-500",
    label: "Gemini",
    icon: "✦",
  },
  groq: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
    dot: "bg-orange-500",
    label: "Groq",
    icon: "⚡",
  },
};

const GEMINI_MODELS = AVAILABLE_MODELS.filter((m) => m.provider === "gemini");
const GROQ_MODELS = AVAILABLE_MODELS.filter((m) => m.provider === "groq");

const ModelSelector = ({ compact = false }) => {
  const { selectedModel, selectModel, currentModelInfo } = useModel();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const provider = PROVIDER_COLORS[currentModelInfo?.provider] || PROVIDER_COLORS.gemini;

  return (
    <div className="relative" ref={ref}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all
          ${provider.bg} ${provider.border} ${provider.text}
          hover:shadow-sm active:scale-95`}
        title="Select AI model"
      >
        <span>{provider.icon}</span>
        {!compact && (
          <span className="hidden sm:inline">{currentModelInfo?.label || "Model"}</span>
        )}
        <svg
          className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 pt-3 pb-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              AI Model
            </p>
          </div>

          {/* Gemini group */}
          <ModelGroup
            title="Gemini"
            icon="✦"
            color="blue"
            models={GEMINI_MODELS}
            selectedModel={selectedModel}
            onSelect={(id) => { selectModel(id); setOpen(false); }}
          />

          {/* Groq group */}
          <ModelGroup
            title="Groq"
            icon="⚡"
            color="orange"
            models={GROQ_MODELS}
            selectedModel={selectedModel}
            onSelect={(id) => { selectModel(id); setOpen(false); }}
            note="Requires GROQ_API_KEY"
          />

          <div className="px-4 py-2 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              All models are on free tiers. Set keys in <code className="bg-gray-100 px-1 rounded">.env</code>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const ModelGroup = ({ title, icon, color, models, selectedModel, onSelect, note }) => {
  const colorMap = {
    blue: {
      header: "text-blue-600",
      selected: "bg-blue-50 border-blue-300",
      dot: "bg-blue-500",
      badge: "bg-blue-100 text-blue-700",
    },
    orange: {
      header: "text-orange-600",
      selected: "bg-orange-50 border-orange-300",
      dot: "bg-orange-500",
      badge: "bg-orange-100 text-orange-700",
    },
  };
  const c = colorMap[color];

  return (
    <div className="px-2 py-1">
      <div className={`flex items-center gap-1 px-2 pb-1 text-xs font-semibold ${c.header}`}>
        <span>{icon}</span>
        <span>{title}</span>
        {note && <span className="ml-auto text-gray-400 font-normal">{note}</span>}
      </div>
      {models.map((model) => {
        const isSelected = model.id === selectedModel;
        return (
          <button
            key={model.id}
            onClick={() => onSelect(model.id)}
            className={`w-full flex items-start gap-2 px-3 py-2 rounded-xl mb-0.5 text-left transition-all
              border ${isSelected ? c.selected : "border-transparent hover:bg-gray-50"}`}
          >
            <span
              className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${isSelected ? c.dot : "bg-gray-200"}`}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-medium text-gray-800">{model.label}</span>
                {model.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${c.badge}`}>
                    {model.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 leading-snug">{model.description}</p>
            </div>
            {isSelected && (
              <svg className={`w-4 h-4 flex-shrink-0 mt-0.5 text-${color}-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ModelSelector;
