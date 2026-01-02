import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { usePreferences } from "../hooks/usePreferences";

const Chat = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [actionCards, setActionCards] = useState([]);
  const [preferencePrompt, setPreferencePrompt] = useState(null);
  const messagesEndRef = useRef(null);
  const hasProcessedInitial = useRef(false);

  // User preferences hook
  const { savePreference, getPreferenceLabels, hasPreference } =
    usePreferences();

  // Get product context from navigation state
  const productContext = location.state?.productContext || null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Generate initial action cards based on product context
  useEffect(() => {
    if (productContext && actionCards.length === 0) {
      setActionCards([
        { id: "concerns", label: "What should I watch out for?", icon: "⚠️" },
        { id: "explain", label: "Explain the ingredients", icon: "📋" },
        { id: "healthy", label: "Is this healthy overall?", icon: "🤔" },
        { id: "compare", label: "Compare with another product", icon: "🔄" },
      ]);
    }
  }, [productContext, actionCards.length]);

  const sendMessage = async (messageText) => {
    if (!messageText.trim()) return;

    const userMessage = { role: "user", content: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setSuggestions([]);
    setPreferencePrompt(null);

    try {
      const response = await fetch("http://localhost:8000/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          productContext,
          chatHistory: messages.slice(-10),
          userPreferences: getPreferenceLabels(),
        }),
      });

      const result = await response.json();

      if (result.data) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: result.data.reply },
        ]);
        setSuggestions(result.data.suggestions || []);
        setActionCards(result.data.actionCards || []);

        // Show preference prompt if returned and not already saved
        if (
          result.data.preferencePrompt &&
          !hasPreference(result.data.preferencePrompt.key)
        ) {
          setPreferencePrompt(result.data.preferencePrompt);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Sorry, something went wrong." },
        ]);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Failed to connect to the copilot." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreference = () => {
    if (preferencePrompt) {
      savePreference(preferencePrompt.key, preferencePrompt.label);
      setPreferencePrompt(null);
    }
  };

  const handleDismissPreference = () => {
    setPreferencePrompt(null);
  };

  // Handle initial question from URL on mount
  useEffect(() => {
    const question = searchParams.get("q");
    if (question && !hasProcessedInitial.current) {
      hasProcessedInitial.current = true;
      setTimeout(() => sendMessage(question), 0);
    }
  }, [searchParams]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleActionCard = (card) => {
    if (card.id === "compare") {
      navigate("/");
      return;
    }
    sendMessage(card.label);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate("/")}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          ← Back
        </button>
        <h1 className="text-lg font-semibold text-slate-800">
          🤖 Nutrition Copilot
        </h1>
        {productContext?.report?.productName && (
          <span className="ml-auto text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {productContext.report.productName}
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 mt-10">
            <span className="text-5xl block mb-4">🤖</span>
            <p className="mb-2">I'm your nutrition copilot!</p>
            {productContext ? (
              <p className="text-sm">
                Ask me anything about this product, or use the quick actions
                below.
              </p>
            ) : (
              <p className="text-sm">
                Scan a product first to get personalized insights.
              </p>
            )}
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                msg.role === "user"
                  ? "bg-indigo-500 text-white rounded-br-md"
                  : "bg-white border border-slate-200 text-slate-700 rounded-bl-md"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-md">
              <span className="inline-flex gap-1">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              </span>
            </div>
          </div>
        )}

        {/* Follow-up Suggestions */}
        {!loading && suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s)}
                className="px-3 py-2 text-sm bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Preference Prompt Card */}
        {!loading && preferencePrompt && (
          <div className="mt-3 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
            <p className="text-sm text-slate-700 mb-3">
              💡 {preferencePrompt.message}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleSavePreference}
                className="px-4 py-2 text-sm bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
              >
                Yes, remember this
              </button>
              <button
                onClick={handleDismissPreference}
                className="px-4 py-2 text-sm bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Action Cards */}
      {!loading && actionCards.length > 0 && messages.length === 0 && (
        <div className="px-4 pb-2">
          <div className="max-w-3xl mx-auto grid grid-cols-2 gap-2">
            {actionCards.map((card, i) => (
              <button
                key={i}
                onClick={() => handleActionCard(card)}
                className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-indigo-300 transition-colors text-left"
              >
                <span className="text-xl">{card.icon}</span>
                <span className="text-sm text-slate-700">{card.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-slate-200 p-4">
        <div className="max-w-3xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this product..."
            className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="px-6 py-3 bg-indigo-500 text-white font-medium rounded-xl hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
