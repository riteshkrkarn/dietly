import { useState, useRef } from "react";
import NutritionForm from "../components/NutritionForm";

const IngredientScanner = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState("");
  const [step, setStep] = useState(0);
  const fileInputRef = useRef(null);

  const steps = [
    {
      text: "📸 Reading your image...",
      subtext: "Extracting text from the label",
    },
    {
      text: "🤖 Finding nutrition info...",
      subtext: "AI is analyzing the content",
    },
    { text: "📋 Almost done...", subtext: "Building your nutrition report" },
    { text: "✅ Ready!", subtext: "Review the results below" },
  ];

  const handleFileSelect = (selectedFile) => {
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setError("");
      setResult(null);
      setStep(0);
      setStatus("");
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
    setStep(0);

    const formData = new FormData();
    formData.append("image", file);

    try {
      setStep(1); // Reading image

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

              switch (event.type) {
                case "ocr_complete":
                  setStep(2); // Finding nutrition
                  break;
                case "tool_call":
                  setStep(2);
                  break;
                case "tool_result":
                  setStep(3); // Almost done
                  break;
                case "complete":
                  setStep(4); // Ready
                  finalData = event.data;
                  setResult(event.data);
                  break;
                case "raw_text":
                  rawText = event.text;
                  break;
                case "error":
                  setError(event.message);
                  break;
              }
            } catch (e) {
              console.log(e.message);
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
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError("");
    setStep(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFormSubmit = (data) => {
    console.log("Form submitted:", data);
    // TODO: Send to next agent
    alert("Data ready for next step!\n\n" + JSON.stringify(data, null, 2));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
            🤖 Nutrition Copilot
          </h1>
          <p className="text-slate-500">
            Upload a nutrition label to extract and edit the information
          </p>
        </div>

        {/* Main Content - Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Upload */}
          <div className="space-y-4">
            {/* Drop Zone - Larger */}
            <div
              className={`
                border-2 border-dashed rounded-2xl text-center cursor-pointer
                transition-all duration-300 flex flex-col items-center justify-center
                min-h-[300px] md:min-h-[400px]
                ${
                  isDragging
                    ? "border-indigo-500 bg-indigo-50 scale-[1.02]"
                    : "border-slate-300 bg-white hover:border-indigo-400 hover:bg-indigo-50/30"
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
                  <p className="mt-3 text-sm text-slate-500 truncate max-w-full px-4">
                    {file?.name}
                  </p>
                </div>
              ) : (
                <div className="text-slate-500 p-8">
                  <span className="text-6xl md:text-7xl block mb-4">📸</span>
                  <p className="text-lg font-medium mb-2">
                    Drop your nutrition label here
                  </p>
                  <p className="text-sm text-slate-400 mb-4">
                    or click anywhere to browse
                  </p>
                  <button className="px-4 py-2 bg-indigo-100 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-200 transition-colors">
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
                  bg-gradient-to-r from-indigo-500 to-purple-600 text-white transition-all
                  ${
                    !file || loading
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:shadow-lg hover:shadow-indigo-500/30"
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
                  className="px-6 py-3 font-semibold rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300"
                  onClick={handleClear}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Processing Status */}
            {loading && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <div className="space-y-3">
                  {steps.map((s, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 transition-all ${
                        i + 1 <= step ? "opacity-100" : "opacity-30"
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-sm
                          ${
                            i + 1 < step
                              ? "bg-green-500 text-white"
                              : i + 1 === step
                              ? "bg-indigo-500 text-white animate-pulse"
                              : "bg-slate-200 text-slate-400"
                          }`}
                      >
                        {i + 1 < step ? "✓" : i + 1}
                      </div>
                      <div>
                        <p className="font-medium text-slate-700 text-sm">
                          {s.text}
                        </p>
                        <p className="text-xs text-slate-400">{s.subtext}</p>
                      </div>
                    </div>
                  ))}
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
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-800">
                    📋 Nutrition Data
                  </h2>
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    {result.report.nutrients?.length} nutrients found
                  </span>
                </div>
                <p className="text-sm text-slate-500 mb-4">
                  Review and edit if there are any errors, then confirm to
                  continue.
                </p>
                <NutritionForm
                  nutrients={result.report.nutrients}
                  servingSize={result.report.servingSize}
                  productName={result.report.productName}
                  onSubmit={handleFormSubmit}
                />
              </div>
            ) : (
              <div className="bg-white/50 rounded-2xl p-8 border-2 border-dashed border-slate-200 min-h-[300px] flex flex-col items-center justify-center text-center">
                <span className="text-5xl mb-4 opacity-50">📊</span>
                <p className="text-slate-400 font-medium">
                  Extracted nutrition data will appear here
                </p>
                <p className="text-sm text-slate-300 mt-1">
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
