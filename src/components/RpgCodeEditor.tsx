import React, { useState } from "react";
import { SimpleRpgFile, CodeDiffBlock } from "../types";
import { FileCode, Check, Copy, Save, FileText, Code2, RotateCcw } from "lucide-react";

interface Props {
  files: SimpleRpgFile[];
  lastDiffs: CodeDiffBlock[];
  onUpdateFileContent: (path: string, newContent: string) => void;
  onResetFile: (path: string) => void;
}

export const RpgCodeEditor: React.FC<Props> = ({
  files,
  lastDiffs,
  onUpdateFileContent,
  onResetFile,
}) => {
  const [selectedPath, setSelectedPath] = useState<string>(files[0]?.path || "enemy-data.js");
  const [activeTab, setActiveTab] = useState<"code" | "diff">("code");
  const [copied, setCopied] = useState(false);

  const currentFile = files.find((f) => f.path === selectedPath) || files[0];
  const [editableCode, setEditableCode] = useState<string>(currentFile ? currentFile.content : "");

  // Update editor text when selected file changes
  React.useEffect(() => {
    if (currentFile) {
      setEditableCode(currentFile.content);
    }
  }, [selectedPath, currentFile?.content]);

  const handleCopy = () => {
    navigator.clipboard.writeText(editableCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (currentFile) {
      onUpdateFileContent(currentFile.path, editableCode);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md font-mono">
      {/* File Selector & Action Bar */}
      <div className="p-2.5 border-b border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        {/* Mobile dropdown selector + Desktop pills */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Mobile Select */}
          <div className="sm:hidden w-full flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1">
            <FileCode className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <select
              value={selectedPath}
              onChange={(e) => setSelectedPath(e.target.value)}
              className="bg-transparent text-xs text-slate-200 outline-none w-full font-mono cursor-pointer"
            >
              {files.map((file) => (
                <option key={file.path} value={file.path} className="bg-slate-900 text-slate-200">
                  {file.path} {file.modified ? " (改)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Desktop scrollable pills */}
          <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-xs">
            {files.map((file) => (
              <button
                key={file.path}
                onClick={() => setSelectedPath(file.path)}
                className={`px-2.5 py-1 rounded-lg text-xs transition-colors flex items-center gap-1 shrink-0 ${
                  selectedPath === file.path
                    ? "bg-sky-500 text-slate-950 font-bold"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <FileCode className="w-3 h-3" />
                <span>{file.path}</span>
                {file.modified && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-1.5 shrink-0 text-xs">
          {/* View mode toggle */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
            <button
              onClick={() => setActiveTab("code")}
              className={`px-2 py-0.5 rounded ${activeTab === "code" ? "bg-slate-800 text-sky-400 font-bold" : "text-slate-400"}`}
            >
              コード
            </button>
            <button
              onClick={() => setActiveTab("diff")}
              className={`px-2 py-0.5 rounded ${activeTab === "diff" ? "bg-slate-800 text-sky-400 font-bold" : "text-slate-400"}`}
            >
              最新差分 ({lastDiffs.length})
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="コードをコピー"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {activeTab === "code" && (
            <button
              onClick={handleSave}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Save className="w-3 h-3" />
              保存
            </button>
          )}

          <button
            onClick={() => currentFile && onResetFile(currentFile.path)}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-rose-400 transition-colors"
            title="初期コードに戻す"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 overflow-y-auto p-3 text-xs bg-slate-950">
        {activeTab === "code" ? (
          <textarea
            value={editableCode}
            onChange={(e) => setEditableCode(e.target.value)}
            className="w-full h-full min-h-[350px] bg-transparent text-slate-200 outline-none resize-none font-mono text-xs leading-relaxed"
            spellCheck={false}
          />
        ) : (
          <div className="space-y-3">
            {lastDiffs.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs font-sans">
                直近のパッチ差分はありません。
              </div>
            ) : (
              lastDiffs.map((diff, idx) => (
                <div key={idx} className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/40">
                  <div className="px-3 py-1.5 bg-slate-800/80 text-[11px] text-sky-400 font-bold border-b border-slate-800 flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5" />
                    {diff.file}
                  </div>
                  <div className="p-2.5 space-y-1 text-[11px] overflow-x-auto">
                    <div className="bg-rose-950/30 text-rose-300 px-2 py-1 rounded border border-rose-900/40 whitespace-pre">
                      <span className="select-none text-rose-600 mr-2">-</span>
                      {diff.before}
                    </div>
                    <div className="bg-emerald-950/30 text-emerald-300 px-2 py-1 rounded border border-emerald-900/40 whitespace-pre">
                      <span className="select-none text-emerald-600 mr-2">+</span>
                      {diff.after}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
