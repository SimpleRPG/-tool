import React, { useState } from "react";
import { Zap, CornerDownLeft, Sparkles, Clock, CheckCircle2 } from "lucide-react";
import { SimpleRpgFile, RpgPatchRecipe, CodeDiffBlock } from "../types";
import { parseRpgCommand } from "../services/rpgLocalParser";

interface Props {
  files: SimpleRpgFile[];
  recipes: RpgPatchRecipe[];
  onApplyDiffs: (diffs: CodeDiffBlock[], log: string, patchTitle: string) => void;
}

const QUICK_RPG_PROMPTS = [
  { label: "スライム弱体化 (HP12)", prompt: "スライムのHPを半分にして弱体化" },
  { label: "ひのきの棒超強化", prompt: "ひのきの棒を強くして攻撃力アップ" },
  { label: "聖剣エクスカリバー", prompt: "聖剣エクスカリバー追加で最強に" },
  { label: "やくそう回復量UP", prompt: "やくそうの回復量を上げて強化" },
  { label: "会心ダメージ3.5倍", prompt: "会心クリティカル倍率を強化して" },
  { label: "メタルスライム追加", prompt: "はぐれメタルスライムを追加して" },
  { label: "賢者の石追加", prompt: "賢者の石を追加して" },
  { label: "ゴールド5倍", prompt: "モンスターのゴールド5倍にして" },
];

export const CommandInputBar: React.FC<Props> = ({ files, recipes, onApplyDiffs }) => {
  const [input, setInput] = useState("");
  const [lastExecution, setLastExecution] = useState<{
    timeMs: number;
    log: string;
    affectedCount: number;
  } | null>(null);

  const handleExecute = (promptText?: string) => {
    const textToRun = promptText || input;
    if (!textToRun.trim()) return;

    // 0.001s Local Zero-Latency Parser
    const result = parseRpgCommand(textToRun, files, recipes);

    if (result.diffs.length > 0) {
      const title =
        result.matchedRecipes.length > 0
          ? result.matchedRecipes.map((r) => r.title).join(" + ")
          : "カスタム数値パッチ";

      onApplyDiffs(result.diffs, result.log, title);

      setLastExecution({
        timeMs: result.parseTimeMs,
        log: result.log,
        affectedCount: result.diffs.length,
      });

      if (!promptText) {
        setInput("");
      }
    } else {
      setLastExecution({
        timeMs: result.parseTimeMs,
        log: result.log,
        affectedCount: 0,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleExecute();
  };

  return (
    <div className="flex flex-col gap-2 p-3 bg-slate-900 border border-slate-800 rounded-xl shadow-md font-sans">
      {/* Quick Prompt Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-slate-400 shrink-0 flex items-center gap-1 font-medium pl-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          ワンタップ変更:
        </span>
        {QUICK_RPG_PROMPTS.map((qp, idx) => (
          <button
            key={idx}
            id={`rpg-quick-prompt-${idx}`}
            onClick={() => handleExecute(qp.prompt)}
            className="shrink-0 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 active:bg-sky-600 active:text-white text-slate-300 rounded-lg transition-colors border border-slate-700 hover:border-slate-600 font-sans cursor-pointer"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Main Natural Language Command Input Bar */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            id="cmd-rpg-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="例: 「スライムのHPを10に」「ひのきの棒を強くして」「聖剣エクスカリバー」「やくそう強化」"
            className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 outline-none transition-all pr-20 font-sans"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] text-slate-500 font-mono pointer-events-none">
            <span className="hidden sm:inline">Enter</span>
            <CornerDownLeft className="w-3 h-3" />
          </div>
        </div>

        <button
          id="btn-apply-rpg-command"
          type="submit"
          className="shrink-0 px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 active:scale-95 text-slate-950 font-bold text-xs sm:text-sm rounded-lg shadow-lg shadow-sky-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Zap className="w-4 h-4 fill-current" />
          <span className="hidden sm:inline">⚡ 0.001秒で即時反映</span>
          <span className="sm:hidden">即反映</span>
        </button>
      </form>

      {/* Real-time Benchmark Status */}
      {lastExecution && (
        <div className="flex flex-wrap items-center justify-between text-[11px] px-2.5 py-1 bg-slate-950/80 rounded-md border border-slate-800/80 text-slate-400 font-mono">
          <div className="flex items-center gap-1.5 text-emerald-400 truncate max-w-xs sm:max-w-md">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{lastExecution.log}</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400 shrink-0 pt-0.5 sm:pt-0">
            <span className="flex items-center gap-1 text-sky-400">
              <Clock className="w-3 h-3" />
              パッチ処理時間: <strong className="text-white">{lastExecution.timeMs}ms</strong>
            </span>
            <span className="text-emerald-400 font-semibold">LLM不使用 (0トークン・完全ローカル)</span>
          </div>
        </div>
      )}
    </div>
  );
};
