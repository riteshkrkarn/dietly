import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import NutritionForm from "../components/NutritionForm";

const IngredientScanner = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const [statusMessages, setStatusMessages] = useState([]);
  const [typingText, setTypingText] = useState("");
  const [currentAgent, setCurrentAgent] = useState(null);
  const socketRef = useRef(null);

  // Connect to WebSocket on mount
  useEffect(() => {
    socketRef.current = io("http://localhost:8000");

    socketRef.current.on("connect", () => {
      console.log("🔌 Connected to WebSocket:", socketRef.current.id);
    });

    // Handle scan events from WebSocket (deduplicate messages)
    const handleEvent = (event) => {
      if (event.message) {
        setStatusMessages((prev) => {
          // Avoid duplicate consecutive messages
          if (prev.length > 0 && prev[prev.length - 1] === event.message) {
            return prev;
          }
          return [...prev, event.message];
        });
      }
      if (event.type === "agent_start") {
        setCurrentAgent(event.agent);
      }
    };

    socketRef.current.on("scan_event", handleEvent);

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Typing effect for analysis text
  const typingIndexRef = useRef(0);
  const typingIntervalRef = useRef(null);

  const typeText = (text) => {
    // Clear any existing interval
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }

    typingIndexRef.current = 0;
    setTypingText("");

    typingIntervalRef.current = setInterval(() => {
      if (typingIndexRef.current < text.length) {
        setTypingText(text.substring(0, typingIndexRef.current + 1));
        typingIndexRef.current++;
      } else {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
    }, 20);
  };

  const handleFileSelect = (selectedFile) => {
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setError("");
      setResult(null);
      setStatusMessages([]);
      setTypingText("");
      setCurrentAgent(null);
    } else {
      setError("Please select a valid image file");
    }
  };

  const handleInputChange = (e) => {
    handleFileSelect(e.target.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please select an image first");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setStatusMessages([]);
    setTypingText("");
    setCurrentAgent(null);

    const formData = new FormData();
    formData.append("image", file);

    // Get socket ID for WebSocket events
    const socketId = socketRef.current?.id || "";

    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/scan/analyze/stream?socketId=${socketId}`,
        { method: "POST", body: formData }
      );

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let rawText = "";
      let finalData = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.slice(6));

              // Don't addStatus here - WebSocket handles status display
              // SSE is only for data completion

              if (event.type === "complete") {
                finalData = event.data;
                setResult(event.data);
                setLoading(false);

                // Trigger typing effect for analysis
                if (event.data?.report?.analysis?.analysis) {
                  typeText(event.data.report.analysis.analysis);
                }
              } else if (event.type === "raw_text") {
                rawText = event.text;
              } else if (event.type === "error") {
                setError(event.message);
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }

      if (rawText && finalData) {
        setResult({ ...finalData, rawText });
      }
    } catch (err) {
      setError(err.message || "Failed to analyze");
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError("");
    setStatusMessages([]);
    setTypingText("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // State for intent override loading
  const [reanalyzeLoading, setReanalyzeLoading] = useState(false);

  // Handle clicking an alternative intent button
  const handleIntentOverride = async (newIntent) => {
    if (!result?.report?.nutrients) return;

    setReanalyzeLoading(true);
    setTypingText("");

    try {
      const response = await fetch(
        "http://localhost:8000/api/v1/scan/reanalyze",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nutrients: result.report.nutrients,
            productName: result.report.productName,
            newIntent: newIntent,
          }),
        }
      );

      const data = await response.json();

      if (data.data) {
        // Update result with new analysis while keeping original nutrients
        setResult((prev) => ({
          ...prev,
          report: {
            ...prev.report,
            intent: data.data.intent,
            filter: data.data.filter,
            analysis: data.data.analysis,
            summary: data.data.summary,
          },
        }));

        // Trigger typing effect for new analysis
        if (data.data.analysis?.analysis) {
          typeText(data.data.analysis.analysis);
        }
      }
    } catch (err) {
      console.error("Re-analysis failed:", err);
      setError("Failed to re-analyze with new intent");
    } finally {
      setReanalyzeLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            📸 Scan Nutrition Label
          </h1>
          <p className="text-gray-600">
            Upload a nutrition label to extract and analyze the information
          </p>
        </div>

        {/* Main Content - Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Upload */}
          <div className="space-y-4">
            {/* Drop Zone */}
            <div
              className={`
                border-2 border-dashed rounded-2xl text-center cursor-pointer
                transition-all duration-300 flex flex-col items-center justify-center
                min-h-[300px] md:min-h-[400px]
                ${
                  isDragging
                    ? "border-green-500 bg-green-50 scale-[1.02]"
                    : "border-gray-300 bg-white hover:border-green-400 hover:bg-green-50/30"
                }
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {preview ? (
                <div className="p-4 w-full h-full flex flex-col items-center justify-center">
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-h-[250px] md:max-h-[300px] rounded-xl object-contain shadow-lg"
                  />
                  <p className="mt-3 text-sm text-gray-600 truncate max-w-full px-4">
                    {file?.name}
                  </p>
                </div>
              ) : (
                <div className="text-gray-600 p-8">
                  <span className="text-6xl md:text-7xl block mb-4">📸</span>
                  <p className="text-lg font-medium mb-2">
                    Drop your nutrition label here
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    or click anywhere to browse
                  </p>
                  <button className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors">
                    Choose File
                  </button>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleInputChange}
                accept="image/*"
                hidden
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                className={`flex-1 py-3 font-semibold rounded-xl flex items-center justify-center gap-2
                  bg-green-600 text-white transition-all
                  ${
                    !file || loading
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-green-700 hover:shadow-lg hover:shadow-green-600/20"
                  }`}
                onClick={handleAnalyze}
                disabled={!file || loading}
              >
                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>🔍 Analyze Label</>
                )}
              </button>
              {file && (
                <button
                  className="px-6 py-3 font-semibold rounded-xl bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                  onClick={handleClear}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-center border border-red-100">
                {error}
              </div>
            )}
          </div>

          {/* Right Column - Status & Results */}
          <div className="space-y-4">
            {/* Show status messages during loading */}
            {loading && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="animate-spin">⚡</span> Analyzing...
                </h2>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {statusMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded-lg text-sm ${
                        msg.includes("✅")
                          ? "bg-green-50 text-green-700"
                          : msg.includes("🎯") || msg.includes("📊")
                          ? "bg-blue-50 text-blue-700"
                          : msg.includes("🔬")
                          ? "bg-purple-50 text-purple-700"
                          : "bg-gray-50 text-gray-600"
                      }`}
                    >
                      {msg}
                    </div>
                  ))}
                </div>
                {currentAgent && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Current:{" "}
                      <span className="font-medium">{currentAgent}</span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Show results when done */}
            {result?.report && !loading && (
              <>
                {/* Intent Assumption Banner */}
                {result.report.intent && (
                  <div
                    className={`bg-blue-50 border border-blue-200 rounded-xl p-4 ${
                      reanalyzeLoading ? "opacity-70" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-800">
                          🎯 {result.report.intent.assumption}
                        </p>
                        {result.report.filter?.explanation && (
                          <p className="text-xs text-blue-600 mt-1">
                            📊 {result.report.filter.explanation}
                          </p>
                        )}
                      </div>

                      {/* Alternative intents - clickable to re-analyze */}
                      {result.report.intent.alternatives?.length > 0 &&
                        !result.report.intent.isOverride && (
                          <div className="flex flex-col items-end gap-2">
                            <p className="text-xs text-blue-600 font-medium">
                              Not your goal?
                            </p>
                            <div className="flex flex-wrap justify-end gap-1">
                              {result.report.intent.alternatives
                                .slice(0, 3)
                                .map((alt, i) => (
                                  <button
                                    key={i}
                                    disabled={reanalyzeLoading}
                                    className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                                      reanalyzeLoading
                                        ? "bg-gray-100 text-gray-400 cursor-wait"
                                        : "bg-white text-blue-700 border border-blue-300 hover:bg-blue-100 hover:border-blue-400"
                                    }`}
                                    onClick={() => handleIntentOverride(alt)}
                                  >
                                    {alt.replace(/_/g, " ")}
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}
                    </div>

                    {/* Re-analyze loading indicator */}
                    {reanalyzeLoading && (
                      <div className="mt-3 pt-3 border-t border-blue-200 flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                        <p className="text-xs text-blue-600">
                          Re-analyzing with new goal...
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Analysis Verdict */}
                {result.report.analysis && (
                  <div
                    className={`p-4 rounded-xl border-2 ${
                      result.report.analysis.verdict?.includes("AVOID") ||
                      result.report.analysis.verdict?.includes("NOT")
                        ? "bg-red-50 border-red-200"
                        : result.report.analysis.verdict?.includes("CAUTION") ||
                          result.report.analysis.verdict?.includes("NOT IDEAL")
                        ? "bg-amber-50 border-amber-200"
                        : result.report.analysis.verdict?.includes("GREAT") ||
                          result.report.analysis.verdict?.includes("GOOD")
                        ? "bg-green-50 border-green-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">
                        {result.report.analysis.verdictEmoji || "⚡"}
                      </span>
                      <h3 className="font-bold text-gray-900">
                        {result.report.analysis.verdict}
                      </h3>
                    </div>

                    {(typingText || result.report.analysis.analysis) && (
                      <p className="text-sm text-gray-700 mb-3">
                        {typingText || result.report.analysis.analysis}
                        {typingText &&
                          typingText.length <
                            (result.report.analysis.analysis?.length || 0) && (
                            <span className="animate-pulse">▋</span>
                          )}
                      </p>
                    )}

                    {/* Concerns */}
                    {result.report.analysis.concerns?.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                          Issues Found
                        </p>
                        {result.report.analysis.concerns.map((c, i) => (
                          <div
                            key={i}
                            className="mb-2 pl-3 border-l-2 border-red-300"
                          >
                            <p className="text-sm font-medium text-gray-800">
                              {c.nutrient}:{" "}
                              <span className="text-red-600">{c.value}</span>
                            </p>
                            <p className="text-xs text-gray-600">{c.issue}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Positives */}
                    {result.report.analysis.positives?.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                          Positives
                        </p>
                        {result.report.analysis.positives.map((p, i) => (
                          <div
                            key={i}
                            className="mb-2 pl-3 border-l-2 border-green-300"
                          >
                            <p className="text-sm font-medium text-gray-800">
                              {p.nutrient}:{" "}
                              <span className="text-green-600">{p.value}</span>
                            </p>
                            <p className="text-xs text-gray-600">{p.benefit}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Recommendation */}
                    {result.report.analysis.recommendation && (
                      <p className="mt-3 text-sm font-medium text-gray-800 bg-white/50 p-2 rounded">
                        💡 {result.report.analysis.recommendation}
                      </p>
                    )}
                  </div>
                )}

                {/* Follow-up Questions */}
                {result.report.analysis?.followUpQuestions?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Ask the Copilot
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {result.report.analysis.followUpQuestions.map((q, i) => (
                        <button
                          key={i}
                          onClick={() =>
                            navigate(`/chat?q=${encodeURIComponent(q)}`, {
                              state: { productContext: result },
                            })
                          }
                          className="px-3 py-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors border border-green-200"
                        >
                          💬 {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nutrition Details (Collapsible) */}
                <details className="bg-white rounded-2xl shadow-sm border border-gray-100">
                  <summary className="p-4 cursor-pointer font-medium text-gray-700 hover:bg-gray-50">
                    📋 View Nutrition Details ({result.report.nutrients?.length}{" "}
                    nutrients)
                  </summary>
                  <div className="p-4 pt-0">
                    <NutritionForm
                      nutrients={result.report.nutrients}
                      servingSize={result.report.servingSize}
                      productName={result.report.productName}
                    />
                  </div>
                </details>
              </>
            )}

            {/* Empty state - only show when no result and not loading */}
            {!result?.report && !loading && (
              <div className="bg-white/50 rounded-2xl p-8 border-2 border-dashed border-gray-200 min-h-[300px] flex flex-col items-center justify-center text-center">
                <span className="text-5xl mb-4 opacity-50">📊</span>
                <p className="text-gray-500 font-medium">
                  Extracted nutrition data will appear here
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Upload an image to get started
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IngredientScanner;
