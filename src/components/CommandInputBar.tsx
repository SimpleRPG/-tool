import React, { useState } from "react";
import { Zap, CornerDownLeft, Sparkles, Clock, CheckCircle2 } from "lucide-react";
import { PatchRecipe, GameConfig } from "../types";
import { parseLocalCommand } from "../services/localParser";

interface Props {
  recipes: PatchRecipe[];
  currentConfig: GameConfig;
  onApplyPatch: (params: Partial<GameConfig>, log: string, patchTitle?: string, matchedRecipes?: PatchRecipe[]) => void;
}

const QUICK_PROMPTS = [
  { label: "弾を3連射", prompt: "弾を3連射にして" },
  { label: "自機2倍速", prompt: "自機を2倍速にして加速して" },
  { label: "極太レーザー", prompt: "貫通メガレーザービームにして" },
  { label: "シールド展開", prompt: "シールドを展開して防御して" },
  { label: "誘導ホーミング", prompt: "弾を自動追尾ホーミング弾にして" },
  { label: "敵を凍結", prompt: "敵を絶対零度で凍結して遅くして" },
  { label: "8方向全方位", prompt: "8方向全方位スターバースト発射" },
  { label: "時止めスロー", prompt: "時止めスローモーションにして" },
  { label: "スコア10倍", prompt: "スコア10倍ゴールドラッシュフィーバー" },
];

export const CommandInputBar: React.FC<Props> = ({ recipes, currentConfig, onApplyPatch }) => {
  const [input, setInput] = useState("");
  const [lastExecution, setLastExecution] = useState<{
    timeMs: number;
    log: string;
    tokens: number;
  } | null>(null);

  const handleExecute = (promptText?: string) => {
    const textToRun = promptText || input;
    if (!textToRun.trim()) return;

    // 0.001秒ローカルパーサーの実行
    const result = parseLocalCommand(textToRun, recipes, currentConfig);

    setLastExecution({
      timeMs: result.parseTimeMs,
      log: result.log,
      tokens: 0,
    });

    const title = result.matchedRecipes.length > 0 ? result.matchedRecipes.map((r) => r.title).join(" + ") : undefined;
    onApplyPatch(result.extractedParams, result.log, title, result.matchedRecipes);

    if (!promptText) {
      setInput("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleExecute();
  };

  return (
    <div className="flex flex-col gap-2 p-3 bg-slate-900 border border-slate-800 rounded-xl shadow-md">
      {/* Quick Prompt Chips (Ideal for Galaxy S25 / Touch UX) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-slate-400 shrink-0 flex items-center gap-1 font-medium pl-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          ワンタップ指示:
        </span>
        {QUICK_PROMPTS.map((qp, idx) => (
          <button
            key={idx}
            id={`quick-prompt-${idx}`}
            onClick={() => handleExecute(qp.prompt)}
            className="shrink-0 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 active:bg-sky-600 active:text-white text-slate-300 rounded-lg transition-colors border border-slate-700 hover:border-slate-600 font-sans"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Main Natural Language Command Input Bar */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            id="cmd-natural-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="例: 「弾を3連射にしてちょっと速くして」「敵を凍結」「シールド張って」"
            className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all pr-20"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] text-slate-500 font-mono pointer-events-none">
            <span className="hidden sm:inline">Enter</span>
            <CornerDownLeft className="w-3 h-3" />
          </div>
        </div>

        <button
          id="btn-apply-command"
          type="submit"
          className="shrink-0 px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 active:scale-95 text-slate-950 font-bold text-xs sm:text-sm rounded-lg shadow-lg shadow-sky-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Zap className="w-4 h-4 fill-current" />
          <span className="hidden sm:inline">⚡ 0.001秒で即時反映</span>
          <span className="sm:hidden">即反映</span>
        </button>
      </form>

      {/* Real-time Benchmark & Zero-Latency Execution Status */}
      {lastExecution && (
        <div className="flex flex-wrap items-center justify-between text-[11px] px-2 py-1 bg-slate-950/80 rounded-md border border-slate-800/80 text-slate-400 font-mono">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="truncate max-w-xs sm:max-w-md">{lastExecution.log}</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400 shrink-0 pt-0.5 sm:pt-0">
            <span className="flex items-center gap-1 text-sky-400">
              <Clock className="w-3 h-3" />
              処理時間: <strong className="text-white">{lastExecution.timeMs}ms</strong>
            </span>
            <span className="text-emerald-400 font-semibold">トークン: 0 (完全オフライン)</span>
          </div>
        </div>
      )}
    </div>
  );
};
