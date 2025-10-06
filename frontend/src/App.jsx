// frontend/src/App.jsx
import React, { useState, useEffect } from "react";
import "./App.css";

// syntax highlighter
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

// zip + file saver
import JSZip from "jszip";
import { saveAs } from "file-saver";

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [uiCode, setUiCode] = useState("");
  const [loading, setLoading] = useState(false);

  // refine UI
  const [refinePrompt, setRefinePrompt] = useState("");

  // color palette result (array of hex strings)
  const [palette, setPalette] = useState([]);

  // copy toast
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState("");

  // history
  const [history, setHistory] = useState([]);

  // load history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ai_ui_history");
      if (saved) setHistory(JSON.parse(saved));
    } catch (e) {
      console.warn("Could not load history:", e);
    }
  }, []);

  // helper to save history (keep max 20)
  const pushHistory = (entry) => {
    try {
      const next = [entry, ...history].slice(0, 20);
      setHistory(next);
      localStorage.setItem("ai_ui_history", JSON.stringify(next));
    } catch (e) {
      console.warn("Could not save history:", e);
    }
  };

  // Generate UI (calls backend /generate-ui)
  const generateUI = async () => {
    if (!prompt.trim()) return alert("Please enter a prompt.");
    setLoading(true);
    setPalette([]);
    try {
      const res = await fetch("http://127.0.0.1:8000/generate-ui", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      const code = data.ui_code || "";
      setUiCode(code);
      pushHistory({ prompt, code, date: new Date().toLocaleString() });
      setToast("Generated!");
      setTimeout(() => setToast(""), 1400);
    } catch (err) {
      alert("Failed to generate UI. Make sure backend is running.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Save single HTML file
  const saveToFile = () => {
    if (!uiCode) return alert("No code to save.");
    const blob = new Blob([wrapHtml(uiCode)], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "generated_ui.html";
    a.click();
    URL.revokeObjectURL(url);
    setToast("Saved HTML");
    setTimeout(() => setToast(""), 1400);
  };

  // Download as ZIP (index.html + style.css)
  const downloadAsZip = async () => {
    if (!uiCode) return alert("No code to download.");
    const zip = new JSZip();
    zip.file("index.html", wrapHtml(uiCode));
    zip.file("style.css", defaultStyle());
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "generated_ui.zip");
    setToast("Downloaded ZIP");
    setTimeout(() => setToast(""), 1400);
  };

  // Copy code to clipboard
  const copyCode = async () => {
    if (!uiCode) return;
    try {
      await navigator.clipboard.writeText(uiCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      setToast("Copied code");
      setTimeout(() => setToast(""), 1400);
    } catch (err) {
      alert("Copy failed: " + err.message);
    }
  };

  // Refine existing UI (sends refinePrompt + existing code to backend)
  const refineUI = async () => {
    if (!uiCode) return alert("No UI to refine.");
    if (!refinePrompt.trim()) return alert("Enter refinement instructions.");
    setLoading(true);
    try {
      // combine instruction & existing code
      const combined = `${refinePrompt}\n\nHere is the existing UI code to modify:\n${uiCode}`;
      const res = await fetch("http://127.0.0.1:8000/generate-ui", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: combined }),
      });
      const data = await res.json();
      const code = data.ui_code || "";
      setUiCode(code);
      pushHistory({ prompt: refinePrompt, code, date: new Date().toLocaleString() });
      setToast("Refined!");
      setTimeout(() => setToast(""), 1400);
    } catch (err) {
      alert("Refine failed. Make sure backend supports AI generation.");
      console.error(err);
    } finally {
      setLoading(false);
      setRefinePrompt("");
    }
  };

  // Request color palette suggestions
  const getColorPalette = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/generate-ui", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "Give me 5 modern UI color palettes. Provide hex codes only, comma separated." }),
      });
      const data = await res.json();
      const text = (data.ui_code || "").replace(/\n/g, " ");
      // extract hex codes (simple regex)
      const matches = Array.from(text.matchAll(/#([0-9A-Fa-f]{6})/g)).map(m => `#${m[1]}`);
      // keep unique, first 5
      const unique = [...new Set(matches)].slice(0, 5);
      setPalette(unique);
      if (unique.length) {
        setToast("Palette ready");
        setTimeout(() => setToast(""), 1400);
      } else {
        alert("No palette found in response. Try again.");
      }
    } catch (err) {
      alert("Could not get palette. Make sure backend supports AI.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Helper: create a minimal full HTML file from fragment
  const wrapHtml = (inner) => {
    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Generated UI</title>
<link rel="stylesheet" href="style.css" />
</head>
<body>
${inner}
</body>
</html>`;
    return html;
  };

  // Default CSS included in zip
  const defaultStyle = () => {
    return `/* Basic style (generated) */
body { font-family: Inter, Arial, sans-serif; margin: 0; padding: 32px; background: #0b1020; color: #edf2f7; }
button { padding: 10px 16px; border-radius: 8px; border: none; cursor: pointer; background: linear-gradient(90deg,#6366f1,#a855f7); color: #fff; }`;
  };

  // Load an item from history into the editor/preview
  const loadHistoryItem = (i) => {
    const item = history[i];
    if (!item) return;
    setUiCode(item.code);
    setPrompt(item.prompt);
    setToast("Loaded from history");
    setTimeout(() => setToast(""), 1200);
  };

  // Clear history
  const clearHistory = () => {
    if (!confirm("Clear history?")) return;
    localStorage.removeItem("ai_ui_history");
    setHistory([]);
    setToast("History cleared");
    setTimeout(() => setToast(""), 1200);
  };

  return (
    <div className="app-container">
      {/* header */}
      <img src="/logo.png" alt="logo" className="app-logo" style={{ display: "none" }} />
      <h1>⚡ AI UI Generator</h1>
      <p className="subtitle">Prompt → Generate → Refine → Export</p>

      {/* prompt */}
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe the UI: e.g. 'Login page with gradient background and rounded inputs'"
      />

      <div className="button-group">
        <button className="generate" onClick={generateUI} disabled={loading}>
          {loading ? "Working..." : "✨ Generate UI"}
        </button>

        <button className="small-btn" onClick={getColorPalette} disabled={loading}>
          🎨 Palette
        </button>

        <button className="save" onClick={saveToFile} disabled={!uiCode}>
          💾 Save HTML
        </button>

        <button className="save" onClick={downloadAsZip} disabled={!uiCode}>
          📦 Download ZIP
        </button>
      </div>

      {/* show palette */}
      {palette && palette.length > 0 && (
        <div className="palette-row" style={{ marginTop: 12 }}>
          {palette.map((c, idx) => (
            <div key={idx} className="palette-swatch" title={c} style={{ background: c }} />
          ))}
        </div>
      )}

      {/* refine area (only when we have generated code) */}
      {uiCode && (
        <div className="refine-section">
          <textarea
            value={refinePrompt}
            onChange={(e) => setRefinePrompt(e.target.value)}
            placeholder="Refine the generated UI (e.g. 'Make buttons rounded and primary blue')"
            style={{ minHeight: 80 }}
          />
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 8 }}>
            <button className="generate" onClick={refineUI} disabled={loading}>
              🎨 Refine UI
            </button>
            <button className="small-btn" onClick={() => { setUiCode(""); setRefinePrompt(""); }}>
              ✖ Clear UI
            </button>
          </div>
        </div>
      )}

      {/* Toolbar + code + preview */}
      {uiCode && (
        <div className="output-wrapper">
          <div className="code-toolbar">
            <div className="toolbar-left">
              <button className="small-btn" onClick={copyCode}>📋 Copy Code</button>
              <span className={`copied-indicator ${copied ? "visible" : ""}`}>{copied ? "Copied!" : ""}</span>
            </div>
            <div className="toolbar-right">
              <button className="small-btn" onClick={() => { saveToFile(); }}>💾 Save HTML</button>
            </div>
          </div>

          <div className="output-box code-box">
            <h3>🧩 Generated Code</h3>
            <SyntaxHighlighter language="html" style={oneDark} wrapLongLines={true}>
              {uiCode}
            </SyntaxHighlighter>
          </div>

          <div className="divider"></div>

          <div className="output-box preview-box">
            <h3>👀 Live Preview</h3>
            <div className="preview-content" dangerouslySetInnerHTML={{ __html: uiCode }} />
          </div>
        </div>
      )}

      {/* History panel */}
      <div className="history-panel">
        <div className="history-header">
          <h4>History</h4>
          <div>
            <button className="small-btn" onClick={() => { navigator.clipboard.writeText(JSON.stringify(history)); setToast("History copied"); setTimeout(()=>setToast(""),1200); }}>Copy JSON</button>
            <button className="small-btn" onClick={clearHistory} style={{ marginLeft: 8 }}>Clear</button>
          </div>
        </div>
        {history.length === 0 ? (
          <p className="muted">No history yet.</p>
        ) : (
          history.map((h, i) => (
            <div key={i} className="history-item" onClick={() => loadHistoryItem(i)}>
              <div className="history-left">
                <b>{h.prompt.slice(0, 60)}</b>
                <div className="muted">{h.date}</div>
              </div>
              <div className="history-right">Load</div>
            </div>
          ))
        )}
      </div>

      <footer>© 2025 <b>AI UI Generator</b></footer>

      {/* Toast */}
      {toast && <div className="toast visible">{toast}</div>}
    </div>
  );
}
