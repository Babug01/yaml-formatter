import { useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { EditorView } from "@codemirror/view";
import { yaml as yamlLang } from "@codemirror/lang-yaml";
import { oneDark } from "@codemirror/theme-one-dark";
import * as YAML from "yaml";
import TreeView from "./components/TreeView";
import Header from "./components/Header";

const REPO_URL = "https://github.com/Babug01/yaml-formatter";

// The `yaml` package gives structured line/column positions directly on the
// error (e.pos = [startOffset, endOffset], e.linePos = [{line,col}, ...]) —
// unlike JSON.parse's inconsistent message-shape situation, no
// message-parsing needed here at all.
function locateYamlError(err) {
  if (err.linePos && err.linePos[0]) return { line: err.linePos[0].line, col: err.linePos[0].col };
  return null;
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/yaml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const cmExtensions = [yamlLang(), EditorView.lineWrapping];

const styles = {
  root: { height: "100dvh", boxSizing: "border-box", display: "flex", flexDirection: "column" },
  content: { fontFamily: "system-ui, sans-serif", padding: "20px 24px", flex: 1, minHeight: 0, boxSizing: "border-box", display: "flex", flexDirection: "column", background: "var(--bg-subtle, #f0efed)" },
  header: { marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 700, margin: 0, color: "var(--text, #1a1a1a)" },
  subtitle: { fontSize: 13, opacity: 0.55, margin: "4px 0 0", color: "var(--text, #1a1a1a)" },
  body: { display: "flex", gap: 16, flex: 1, minHeight: 0, minWidth: 0 },
  pane: { flex: "1 1 0", minWidth: 0, display: "flex", flexDirection: "column", minHeight: 0 },
  paneHeader: { fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", opacity: 0.6, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between", color: "var(--text, #1a1a1a)" },
  paneHeaderActions: { display: "flex", gap: 6, alignItems: "center" },
  iconBtn: {
    padding: "2px 10px", borderRadius: 6, border: "1px solid var(--border, #e5e7eb)", background: "transparent",
    color: "var(--text, #1a1a1a)", cursor: "pointer", fontSize: 11, textTransform: "none", fontWeight: 400,
  },
  editorWrap: { flex: 1, minHeight: 0, borderRadius: 8, overflow: "hidden", border: "1px solid var(--border, #e5e7eb)" },
  statusBar: { fontSize: 11, opacity: 0.5, marginTop: 6, color: "var(--text, #1a1a1a)" },
  empty: {
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.4, fontSize: 13,
    border: "1px dashed var(--border, #e5e7eb)", borderRadius: 8, color: "var(--text, #1a1a1a)",
  },
  errorBox: {
    flex: 1, padding: 16, borderRadius: 8, border: "1px solid #e05c5c", background: "rgba(224,92,92,0.08)",
    color: "#e05c5c", fontSize: 13, fontFamily: "'SFMono-Regular', Consolas, monospace", whiteSpace: "pre-wrap", overflow: "auto",
  },
  validBox: {
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 14, fontWeight: 600,
    color: "#3fb950", border: "1px solid #3fb950", borderRadius: 8, background: "rgba(63,185,80,0.08)",
  },
  rail: { display: "flex", flexDirection: "column", gap: 10, width: 168, flexShrink: 0 },
  btn: (kind) => ({
    padding: "10px 14px", borderRadius: 6, border: kind === "primary" ? "none" : "1px solid var(--border, #e5e7eb)",
    background: kind === "primary" ? "var(--accent, #4f46e5)" : "transparent",
    color: kind === "primary" ? "#fff" : "var(--text, #1a1a1a)",
    cursor: "pointer", fontSize: 13, fontWeight: 600, width: "100%",
  }),
  select: {
    padding: "8px 10px", borderRadius: 6, border: "1px solid var(--border, #e5e7eb)", background: "var(--input-bg, #f9fafb)",
    color: "var(--text, #1a1a1a)", fontSize: 13, width: "100%",
  },
  railDivider: { height: 1, background: "var(--border, #e5e7eb)", margin: "2px 0" },
  viewToggle: { display: "flex", border: "1px solid var(--border, #e5e7eb)", borderRadius: 6, overflow: "hidden" },
  viewToggleBtn: (active) => ({
    padding: "2px 10px", border: "none", background: active ? "var(--accent, #4f46e5)" : "transparent",
    color: active ? "#fff" : "var(--text, #1a1a1a)", cursor: "pointer", fontSize: 11,
  }),
};

export default function App() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [parsedValue, setParsedValue] = useState(undefined);
  const [viewMode, setViewMode] = useState("code");
  const [error, setError] = useState(null);
  const [valid, setValid] = useState(false);
  const [copied, setCopied] = useState(false);
  const [indentOption, setIndentOption] = useState("2");
  const [cursor, setCursor] = useState({ line: 1, col: 1 });
  const fileInputRef = useRef(null);

  function resetResult() {
    setError(null);
    setValid(false);
    setOutput("");
    setParsedValue(undefined);
  }

  function format() {
    if (!input.trim()) {
      resetResult();
      return;
    }
    try {
      // strict: true surfaces duplicate keys, bad indentation, etc. as real
      // errors instead of silently accepting them — that's the "linter"
      // half of this page, not just a parser.
      const parsed = YAML.parse(input, { strict: true });
      setOutput(YAML.stringify(parsed, { indent: Number(indentOption) }));
      setParsedValue(parsed);
      setViewMode("code");
      setError(null);
      setValid(false);
    } catch (e) {
      setOutput("");
      setParsedValue(undefined);
      setValid(false);
      setError({ message: e.message, loc: locateYamlError(e) });
    }
  }

  // A direct rail action, not just a toggle that only appears once Format
  // has already been clicked (see App.jsx in json-formatter for the same fix).
  function showTree() {
    if (!input.trim()) {
      resetResult();
      return;
    }
    try {
      const parsed = YAML.parse(input, { strict: true });
      setOutput(YAML.stringify(parsed, { indent: Number(indentOption) }));
      setParsedValue(parsed);
      setViewMode("tree");
      setError(null);
      setValid(false);
    } catch (e) {
      setOutput("");
      setParsedValue(undefined);
      setValid(false);
      setError({ message: e.message, loc: locateYamlError(e) });
    }
  }

  function validate() {
    if (!input.trim()) {
      resetResult();
      return;
    }
    try {
      YAML.parse(input, { strict: true });
      setOutput("");
      setError(null);
      setValid(true);
    } catch (e) {
      setOutput("");
      setValid(false);
      setError({ message: e.message, loc: locateYamlError(e) });
    }
  }

  function clearAll() {
    setInput("");
    resetResult();
  }

  function copyOutput() {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  function handleFileChosen(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setInput(String(reader.result || ""));
      resetResult();
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function handleCursorUpdate(viewUpdate) {
    if (!viewUpdate.selectionSet && !viewUpdate.docChanged) return;
    const head = viewUpdate.state.selection.main.head;
    const line = viewUpdate.state.doc.lineAt(head);
    setCursor({ line: line.number, col: head - line.from + 1 });
  }

  return (
    <div style={styles.root}>
      <Header title="YAML Linter, Formatter & Validator" repoUrl={REPO_URL} />
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>YAML Linter, Formatter &amp; Validator</h1>
          <p style={styles.subtitle}>Paste or upload YAML, format it, or catch syntax/indentation errors with an exact line and column. Nothing leaves your browser.</p>
        </div>

        <div style={styles.body}>
          <div style={styles.pane}>
            <div style={styles.paneHeader}>
              <span>Input</span>
            </div>
            <div style={styles.editorWrap}>
              <CodeMirror
                value={input}
                height="100%"
                theme={oneDark}
                extensions={cmExtensions}
                onChange={(value) => setInput(value)}
                onUpdate={handleCursorUpdate}
                placeholder="Paste YAML here..."
                style={{ height: "100%", fontSize: 13 }}
              />
            </div>
            <div style={styles.statusBar}>Ln {cursor.line}, Col {cursor.col}</div>
            <input ref={fileInputRef} type="file" accept=".yaml,.yml,.txt,text/yaml" style={{ display: "none" }} onChange={handleFileChosen} />
          </div>

          <div style={styles.rail}>
            <button style={styles.btn("secondary")} onClick={handleUploadClick}>Upload Data</button>
            <button style={styles.btn("secondary")} onClick={validate}>Validate / Lint</button>
            <div style={styles.railDivider} />
            <select style={styles.select} value={indentOption} onChange={(e) => setIndentOption(e.target.value)}>
              <option value="2">2 space indent</option>
              <option value="4">4 space indent</option>
            </select>
            <button style={styles.btn("primary")} onClick={format}>Format</button>
            <button style={styles.btn("secondary")} onClick={showTree}>Tree View</button>
            <div style={styles.railDivider} />
            <button style={styles.btn("secondary")} onClick={() => downloadText("formatted.yaml", output || input)}>Download</button>
            <button style={styles.btn("secondary")} onClick={clearAll}>Clear</button>
          </div>

          <div style={styles.pane}>
            <div style={styles.paneHeader}>
              <span>Output</span>
              <div style={styles.paneHeaderActions}>
                {output && (
                  <div style={styles.viewToggle}>
                    <button style={styles.viewToggleBtn(viewMode === "code")} onClick={() => setViewMode("code")}>Code</button>
                    <button style={styles.viewToggleBtn(viewMode === "tree")} onClick={() => setViewMode("tree")}>Tree</button>
                  </div>
                )}
                {output && viewMode === "code" && (
                  <button style={styles.iconBtn} onClick={copyOutput}>{copied ? "Copied" : "Copy"}</button>
                )}
              </div>
            </div>
            {error ? (
              <div style={styles.errorBox}>
                Invalid YAML{error.loc ? ` — line ${error.loc.line}, column ${error.loc.col}` : ""}
                {"\n\n"}
                {error.message}
              </div>
            ) : valid ? (
              <div style={styles.validBox}>Valid YAML</div>
            ) : output && viewMode === "tree" ? (
              <div style={styles.editorWrap}>
                <TreeView data={parsedValue} />
              </div>
            ) : output ? (
              <div style={styles.editorWrap}>
                <CodeMirror value={output} height="100%" theme={oneDark} extensions={cmExtensions} editable={false} readOnly style={{ height: "100%", fontSize: 13 }} />
              </div>
            ) : (
              <div style={styles.empty}>Formatted output will appear here.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
