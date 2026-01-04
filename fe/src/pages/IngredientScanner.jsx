import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import NutritionForm from "../components/NutritionForm";

const IngredientScanner = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const [statusMessages, setStatusMessages] = useState([]);

  const handleFileSelect = (selectedFile) => {
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setError("");
      setResult(null);
      setStatusMessages([]);
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

  const addStatus = (msg) => {
    setStatusMessages((prev) => [...prev, msg]);
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

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch(
        "http://localhost:8000/api/v1/scan/analyze/stream",
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

              if (event.message) {
                addStatus(event.message);
              }

              if (event.type === "complete") {
                finalData = event.data;
                setResult(event.data);
                setLoading(false);
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
    setSuggestions(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFormSubmit = async (data) => {
    setSuggestionsLoading(true);
    setSuggestions(null);
    try {
      const response = await fetch(
        "http://localhost:8000/api/v1/scan/suggestions",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nutrients: data.nutrients }),
        }
      );
      const result = await response.json();
      if (result.data) {
        setSuggestions(result.data);
      }
    } catch (err) {
      console.error("Failed to get suggestions:", err);
    } finally {
      setSuggestionsLoading(false);
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
                ${isDragging
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
                  ${!file || loading
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

            {/* Processing Status */}
            {loading && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="space-y-2">
                  {statusMessages.map((msg, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${i === statusMessages.length - 1
                            ? "bg-green-600 text-white animate-pulse"
                            : "bg-green-500 text-white"
                          }`}
                      >
                        {i === statusMessages.length - 1 ? "" : "✓"}
                      </div>
                      <p className="text-sm text-gray-700">{msg}</p>
                    </div>
                  ))}
                  {statusMessages.length === 0 && (
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 border-2 border-green-300 border-t-green-600 rounded-full animate-spin" />
                      <p className="text-sm text-gray-600">Starting...</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-center border border-red-100">
                {error}
              </div>
            )}
          </div>

          {/* Right Column - Results */}
          <div className="space-y-4">
            {result?.report ? (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">
                    📋 Nutrition Data
                  </h2>
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    {result.report.nutrients?.length} nutrients found
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Review and edit if there are any errors, then confirm to
                  continue.
                </p>
                <NutritionForm
                  nutrients={result.report.nutrients}
                  servingSize={result.report.servingSize}
                  productName={result.report.productName}
                  onSubmit={handleFormSubmit}
                  loading={suggestionsLoading}
                />

                {suggestions && suggestions.suggestions && (
                  <div className="mt-4 space-y-3">
                    <h3 className="text-sm font-semibold text-gray-800">
                      💡 AI Suggestions
                    </h3>
                    {suggestions.suggestions.map((s, i) => (
                      <div
                        key={i}
                        className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100"
                      >
                        <p className="text-sm text-gray-700">{s.insight}</p>
                        <button
                          onClick={() =>
                            navigate(
                              `/chat?q=${encodeURIComponent(s.question)}`,
                              {
                                state: { productContext: result },
                              }
                            )
                          }
                          className="text-xs text-green-700 mt-2 hover:text-green-800 hover:underline font-medium"
                        >
                          💬 {s.question}
                        </button>
                      </div>
                    ))}

                    {/* Ask custom question button */}
                    <button
                      onClick={() =>
                        navigate("/chat", { state: { productContext: result } })
                      }
                      className="w-full mt-2 py-2.5 px-4 bg-green-100 text-green-700 font-medium rounded-xl hover:bg-green-200 transition-colors flex items-center justify-center gap-2"
                    >
                      💬 Ask a different question
                    </button>
                  </div>
                )}
              </div>
            ) : (
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
