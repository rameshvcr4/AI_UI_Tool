import React, { useState } from "react";

export default function Generator() {
  const [prompt, setPrompt] = useState("");
  const [uiCode, setUiCode] = useState("");
  const [loading, setLoading] = useState(false);

  const generateUI = async () => {
    if (!prompt.trim()) {
      alert("Please enter a prompt!");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/generate-ui", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      setUiCode(data.ui_code);
    } catch (err) {
      alert("Failed to connect to backend!");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveToFile = () => {
    const blob = new Blob([uiCode], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "generated_ui.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        🧠 AI UI Generator (Offline Demo)
      </h1>

      <textarea
        className="w-full max-w-2xl border rounded-lg p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        rows="3"
        placeholder="Describe the UI you want to generate..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      ></textarea>

      <div className="flex gap-4">
        <button
          onClick={generateUI}
          disabled={loading}
          className="bg-indigo-500 text-white px-6 py-2 rounded-lg shadow hover:bg-indigo-600 disabled:bg-gray-400"
        >
          {loading ? "Generating..." : "Generate UI"}
        </button>

        {uiCode && (
          <button
            onClick={saveToFile}
            className="bg-green-500 text-white px-6 py-2 rounded-lg shadow hover:bg-green-600"
          >
            💾 Save as HTML
          </button>
        )}
      </div>

      <div className="mt-8 w-full max-w-4xl bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Generated Code:</h2>
        <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
          {uiCode || "Your generated HTML will appear here..."}
        </pre>
      </div>

      <div className="mt-8 w-full max-w-4xl bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Live Preview:</h2>
        <div
          className="border rounded-lg p-4 bg-white"
          dangerouslySetInnerHTML={{ __html: uiCode }}
        ></div>
      </div>
    </div>
  );
}
