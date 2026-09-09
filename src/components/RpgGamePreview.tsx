import React, { useState, useEffect, useRef } from "react";
import { SimpleRpgFile } from "../types";
import { HtmlRunnerService } from "../services/htmlRunnerService";
import { RpgBattleLab } from "./RpgBattleLab";
import {
  RotateCcw,
  Sparkles,
  Smartphone,
  Swords,
  Maximize2,
  Minimize2,
  ExternalLink,
  Gamepad2,
  Monitor,
  LayoutGrid,
} from "lucide-react";

interface Props {
  files: SimpleRpgFile[];
  activePatchBadge: string | null;
  onQuickPatch?: (text: string) => void;
  onAutoTestRun?: (enemyName: string, winRate: number) => void;
  onUpdateFiles?: (files: SimpleRpgFile[]) => void;
}

export const RpgGamePreview: React.FC<Props> = ({
  files,
  activePatchBadge,
  onQuickPatch,
  onAutoTestRun,
  onUpdateFiles,
}) => {
  const [viewMode, setViewMode] = useState<"html5_live" | "battle_lab">("html5_live");
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [isIframeLoading, setIsIframeLoading] = useState<boolean>(false);
  
  // Width & Fullscreen controls to address "画面が狭い"
  const [frameWidthMode, setFrameWidthMode] = useState<"phone" | "wide" | "full">("wide");
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Compile game HTML from VFS files
  const { html: compiledHtml, entryFile } = React.useMemo(() => {
    return HtmlRunnerService.compileGameHtml(files);
  }, [files]);

  // Whenever files change or patch is applied, trigger smooth reload
  useEffect(() => {
    setIsIframeLoading(true);
    const timer = setTimeout(() => {
      setIsIframeLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [compiledHtml]);

  const handleManualReload = () => {
    setIframeKey((prev) => prev + 1);
    setIsIframeLoading(true);
    setTimeout(() => setIsIframeLoading(false), 200);
  };

  const handleOpenInNewWindow = () => {
    const blob = new Blob([compiledHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  const totalFiles = files.length;
  const hasCustomZip = files.some(
    (f) => f.path.startsWith("SimpleRPG") || f.path.includes("/") || f.path.includes("\\")
  );

  // Determine width class for the container
  const getContainerWidthClass = () => {
    if (isExpanded || frameWidthMode === "full") return "w-full max-w-full h-full";
    if (frameWidthMode === "wide") return "w-full max-w-[640px] h-full";
    return "w-full max-w-[420px] h-full"; // "phone"
  };

  return (
    <div
      className={`flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl transition-all duration-200 ${
        isExpanded
          ? "fixed inset-2 z-50 rounded-2xl border-2 border-sky-500/50 shadow-2xl bg-slate-950"
          : "h-full"
      }`}
    >
      {/* Top Header & View Controls */}
      <div className="px-3 py-2 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between gap-2 flex-wrap">
        {/* Left: Title & File status badge */}
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Gamepad2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs sm:text-sm text-slate-100">
                しんぷるRPG プレビュー
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                実機実行中
              </span>
            </div>
            <div className="text-[10px] text-slate-400 truncate max-w-[200px] sm:max-w-xs">
              {entryFile ? (
                <span>
                  起動: <code className="text-sky-300">{entryFile}</code> ({totalFiles}ファイル)
                </span>
              ) : (
                <span>標準エンジン ({totalFiles}ファイル)</span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Switcher, Width Selector & Tools */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Mode switch: Live Game vs Battle Lab */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
            <button
              onClick={() => setViewMode("html5_live")}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                viewMode === "html5_live"
                  ? "bg-sky-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="しんぷるRPGの実際のゲーム画面を表示"
            >
              🎮 実機画面
            </button>
            <button
              onClick={() => setViewMode("battle_lab")}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                viewMode === "battle_lab"
                  ? "bg-rose-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="敵・装備・ポーション・スキルを組み替えて戦闘テスト"
            >
              ⚔️ 戦闘ラボ (シミュ)
            </button>
          </div>

          {/* Width Size Switcher (only in html5_live) */}
          {viewMode === "html5_live" && !isExpanded && (
            <div className="hidden sm:flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px] font-mono">
              <button
                onClick={() => setFrameWidthMode("phone")}
                className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                  frameWidthMode === "phone"
                    ? "bg-slate-700 text-sky-300 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="スマホ幅 (420px)"
              >
                スマホ
              </button>
              <button
                onClick={() => setFrameWidthMode("wide")}
                className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                  frameWidthMode === "wide"
                    ? "bg-slate-700 text-sky-300 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="ワイド幅 (640px)"
              >
                ワイド
              </button>
              <button
                onClick={() => setFrameWidthMode("full")}
                className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                  frameWidthMode === "full"
                    ? "bg-slate-700 text-sky-300 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="全幅 (100%)"
              >
                フル幅
              </button>
            </div>
          )}

          {/* Open In New Tab */}
          <button
            onClick={handleOpenInNewWindow}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 text-xs transition-all cursor-pointer"
            title="別タブで全画面プレイ"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Expand toggle */}
          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 text-xs transition-all cursor-pointer"
            title={isExpanded ? "通常表示に戻す" : "プレビュー画面を拡大"}
          >
            {isExpanded ? (
              <Minimize2 className="w-3.5 h-3.5 text-sky-400" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Reload button */}
          <button
            onClick={handleManualReload}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 text-xs transition-all cursor-pointer"
            title="ゲームを再起動・リロード"
          >
            <RotateCcw
              className={`w-3.5 h-3.5 ${isIframeLoading ? "animate-spin text-sky-400" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Active Patch Pill Notification */}
      {activePatchBadge && (
        <div className="px-3 py-1 bg-gradient-to-r from-sky-950/80 via-indigo-950/80 to-slate-900 border-b border-sky-500/20 flex items-center justify-between text-[11px] text-sky-300">
          <div className="flex items-center gap-1.5 truncate">
            <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="font-semibold">最新パッチ反映:</span>
            <span className="truncate text-slate-200">{activePatchBadge}</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-mono shrink-0">
            0.001秒 反映済
          </span>
        </div>
      )}

      {/* Main Viewport */}
      <div className="relative flex-1 min-h-[380px] sm:min-h-[460px] bg-slate-950 flex flex-col items-center justify-start overflow-hidden p-1 sm:p-2">
        {viewMode === "html5_live" ? (
          <div className={`transition-all duration-200 flex flex-col ${getContainerWidthClass()}`}>
            {/* Phone/Screen Container Frame */}
            <div className="w-full h-full bg-[#090d16] border border-slate-800 rounded-xl overflow-hidden shadow-2xl relative flex flex-col">
              {/* iframe running the real SimpleRPG HTML5 codebase */}
              <iframe
                key={iframeKey}
                ref={iframeRef}
                title="しんぷるRPG ライブ実行"
                srcDoc={compiledHtml}
                sandbox="allow-scripts allow-forms allow-modals allow-same-origin"
                className="w-full h-full border-0 flex-1 bg-[#090d16]"
                style={{
                  minHeight: "360px",
                  height: "100%",
                }}
              />

              {/* Status footer */}
              <div className="px-3 py-1.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1 truncate">
                  <Smartphone className="w-3 h-3 text-sky-400" />
                  {hasCustomZip ? "ZIP内ゲームコード実行中" : "しんぷるRPG コア稼働中"}
                </span>
                <span className="text-slate-500 font-mono">
                  {frameWidthMode === "full" ? "フルスクリーン表示" : `${frameWidthMode} モード`}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Full Battle Lab (Enemies, Equipment, Potions, Skills, 100-Trial Auto-test) */
          <div className="w-full h-full">
            <RpgBattleLab
              files={files}
              onAutoTestRun={onAutoTestRun}
              onUpdateFiles={onUpdateFiles}
            />
          </div>
        )}
      </div>
    </div>
  );
};
