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

  const { savePreference, getPreferenceLabels, hasPreference } =
    usePreferences();

  const productContext = location.state?.productContext || null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

    // Capture current history before updating state (fixes React closure issue)
    const currentHistory = [...messages];

    const userMessage = { role: "user", content: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setSuggestions([]);
    setPreferencePrompt(null);

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:8000"
        }/api/v1/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: messageText,
            productContext,
            chatHistory: currentHistory.slice(-10),
            userPreferences: getPreferenceLabels(),
          }),
        }
      );

      const result = await response.json();

      if (result.data) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: result.data.reply },
        ]);
        setSuggestions(result.data.suggestions || []);
        setActionCards(result.data.actionCards || []);

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
    <div className="h-[calc(100vh-5rem)] bg-gradient-to-br from-gray-50 via-white to-gray-100 flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500">
            <span className="text-5xl block mb-4">🤖</span>
            <p className="mb-2 font-medium">I'm your nutrition copilot!</p>
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
                  ? "bg-green-600 text-white rounded-br-md"
                  : "bg-white border border-gray-200 text-gray-800 rounded-bl-md"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-md">
              <span className="inline-flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
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
                className="px-3 py-2 text-sm bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Preference Prompt Card */}
        {!loading && preferencePrompt && (
          <div className="mt-3 p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl">
            <p className="text-sm text-gray-700 mb-3">
              💡 {preferencePrompt.message}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleSavePreference}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Yes, remember this
              </button>
              <button
                onClick={handleDismissPreference}
                className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
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
                className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-green-300 transition-colors text-left"
              >
                <span className="text-xl">{card.icon}</span>
                <span className="text-sm text-gray-700">{card.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-3xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this product..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="px-6 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
