import React, { useState, useEffect } from "react";
import { GameCanvas } from "./components/GameCanvas";
import { CommandInputBar } from "./components/CommandInputBar";
import { RecipeCatalog } from "./components/RecipeCatalog";
import { CodeDiffViewer } from "./components/CodeDiffViewer";
import { WebHarvestModal } from "./components/WebHarvestModal";
import { GameConfig, PatchRecipe } from "./types";
import { INITIAL_GAME_CONFIG, BUILTIN_RECIPES } from "./data/defaultRecipes";
import {
  Zap,
  Globe2,
  Terminal,
  Layers,
  Cpu,
  Smartphone,
  Info,
  CheckCircle2,
  Volume2,
  VolumeX,
} from "lucide-react";

export default function App() {
  const [config, setConfig] = useState<GameConfig>(INITIAL_GAME_CONFIG);
  const [recipes, setRecipes] = useState<PatchRecipe[]>(() => {
    // Load persisted web/custom recipes from localStorage
    try {
      const saved = localStorage.getItem("instant_patch_custom_recipes");
      if (saved) {
        const parsed = JSON.parse(saved);
        return [...BUILTIN_RECIPES, ...parsed];
      }
    } catch {
      // ignore
    }
    return BUILTIN_RECIPES;
  });

  const [lastPatch, setLastPatch] = useState<{
    title: string;
    recipes: PatchRecipe[];
    timestamp: number;
    log: string;
  } | null>(null);

  const [activePatchBadge, setActivePatchBadge] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"recipes" | "diff" | "architecture">("recipes");
  const [isWebHarvestOpen, setIsWebHarvestOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Play a brief synthesized audio chime on patch application
  const playTactileChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {
      // audio context might require user interaction first
    }
  };

  // Apply a patch
  const handleApplyPatch = (
    params: Partial<GameConfig>,
    log: string,
    patchTitle?: string,
    matchedRecipes?: PatchRecipe[]
  ) => {
    playTactileChime();

    setConfig((prev) => ({
      ...prev,
      ...params,
    }));

    const title = patchTitle || "カスタムパラメータ適用";
    setActivePatchBadge(title);
    setTimeout(() => setActivePatchBadge(null), 2500);

    setLastPatch({
      title,
      recipes: matchedRecipes || [],
      timestamp: Date.now(),
      log,
    });
  };

  // Apply a recipe directly from catalog
  const handleApplyRecipe = (recipe: PatchRecipe) => {
    handleApplyPatch(recipe.params, `⚡ レシピ [${recipe.title}] を即時反映しました`, recipe.title, [recipe]);
  };

  // Add harvested recipe from Web
  const handleAddRecipeToLocal = (newRecipe: PatchRecipe) => {
    setRecipes((prev) => {
      const updated = [newRecipe, ...prev];
      try {
        const customOnly = updated.filter((r) => r.source === "web_search");
        localStorage.setItem("instant_patch_custom_recipes", JSON.stringify(customOnly));
      } catch {
        // ignore
      }
      return updated;
    });

    // Also auto-apply it right away
    handleApplyRecipe(newRecipe);
  };

  // Reset to default configuration
  const handleResetToDefault = () => {
    setConfig(INITIAL_GAME_CONFIG);
    setLastPatch({
      title: "初期状態リセット",
      recipes: [],
      timestamp: Date.now(),
      log: "すべてのゲーム設定をデフォルトに戻しました",
    });
    setActivePatchBadge("コードを初期状態にリセット");
    setTimeout(() => setActivePatchBadge(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Header */}
      <header className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base sm:text-lg tracking-tight text-white font-sans">
                ローカル即時ゲーム改造スタジオ
              </h1>
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono font-medium">
                <CheckCircle2 className="w-3 h-3" />
                案1: 完全ローカル 0.001s 反映
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Galaxy S25等のスマートフォンでも一切発熱・トークン消費ゼロで日本語指示から即座にコードを書き換えます
            </p>
          </div>
        </div>

        {/* Action Controls in Top Bar */}
        <div className="flex items-center gap-2">
          <button
            id="btn-sound-toggle"
            onClick={() => setSoundEnabled((s) => !s)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            title={soundEnabled ? "効果音: オン" : "効果音: オフ"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-sky-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            id="btn-header-web-harvest"
            onClick={() => setIsWebHarvestOpen(true)}
            className="px-3 py-1.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs rounded-lg shadow-md shadow-sky-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ネット検索でコード＆アイテム収集</span>
            <span className="sm:hidden">Web探索</span>
          </button>
        </div>
      </header>

      {/* Main Layout Area: Two Column on Desktop, Stacked on Mobile */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 sm:p-4 overflow-hidden max-w-7xl mx-auto w-full">
        {/* Left Column (Canvas Game & Command Bar) */}
        <div className="lg:col-span-7 flex flex-col gap-3 min-h-[500px]">
          {/* Canvas Wrapper */}
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg relative min-h-[360px]">
            <GameCanvas
              config={config}
              activePatchBadge={activePatchBadge}
            />
          </div>

          {/* Command Input Bar */}
          <CommandInputBar
            recipes={recipes}
            currentConfig={config}
            onApplyPatch={handleApplyPatch}
          />
        </div>

        {/* Right Column (Tabbed Workspace: Recipe Catalog, Diff Viewer, Architecture Guide) */}
        <div className="lg:col-span-5 flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg min-h-[500px]">
          {/* Tab Navigation */}
          <div className="flex items-center border-b border-slate-800 bg-slate-900/90 px-3 pt-2 text-xs font-semibold gap-1">
            <button
              id="tab-btn-recipes"
              onClick={() => setActiveTab("recipes")}
              className={`px-3 py-2 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === "recipes"
                  ? "border-sky-500 text-sky-400 font-bold"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>レシピ集 ({recipes.length})</span>
            </button>

            <button
              id="tab-btn-diff"
              onClick={() => setActiveTab("diff")}
              className={`px-3 py-2 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === "diff"
                  ? "border-sky-500 text-sky-400 font-bold"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>コード差分 / 状態</span>
            </button>

            <button
              id="tab-btn-architecture"
              onClick={() => setActiveTab("architecture")}
              className={`px-3 py-2 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === "architecture"
                  ? "border-sky-500 text-sky-400 font-bold"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>S25とアーキテクチャ</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "recipes" && (
              <RecipeCatalog
                recipes={recipes}
                currentConfig={config}
                onApplyRecipe={handleApplyRecipe}
                onOpenWebHarvest={() => setIsWebHarvestOpen(true)}
              />
            )}

            {activeTab === "diff" && (
              <CodeDiffViewer
                currentConfig={config}
                lastPatch={lastPatch}
                onResetToDefault={handleResetToDefault}
              />
            )}

            {activeTab === "architecture" && (
              <div className="p-4 space-y-4 text-xs text-slate-300 leading-relaxed overflow-y-auto h-full">
                <div className="p-3 bg-sky-950/30 border border-sky-500/30 rounded-xl">
                  <div className="flex items-center gap-2 font-bold text-sky-300 mb-1 text-sm">
                    <Smartphone className="w-4 h-4" />
                    なぜS25（スマホ）では「案1」が最強なのか？
                  </div>
                  <p className="text-slate-400">
                    Galaxy S25のような最先端のスマホであっても、スマホ上でローカルLLM（3B等）にコード修正をさせる場合、入力コンテキストの読み込み（Prefill）に大量の電力と数秒〜十数秒の時間がかかります。
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-slate-200 flex items-center gap-1.5 text-sm">
                    <Info className="w-4 h-4 text-amber-400" />
                    このアプリが採用している3層ハイブリッド構造
                  </h4>

                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
                    <div className="font-bold text-emerald-400 flex items-center justify-between">
                      <span>① ローカル・ルールベースパーサー (0.001秒・0トークン)</span>
                      <span className="text-[10px] bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                        100% オフライン
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      ユーザーの自然言語（「弾を3連射」「ちょっと速く」「敵を凍結」）から、シノニム辞書と正規表現で瞬時に意図を抽出し、ゲームコードのレシピブロックを0.001秒でHot-Reloadします。
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
                    <div className="font-bold text-sky-400 flex items-center justify-between">
                      <span>② レシピレジストリ（ノウハウの塊＆蓄積）</span>
                      <span className="text-[10px] bg-sky-950 px-1.5 py-0.5 rounded border border-sky-800">
                        LocalStorage永続化
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      ゲームの改造ノウハウを「レシピ」として大量に内包。一度覚えたレシピは端末内に保存されるため、通信が切れても一生使えます。
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
                    <div className="font-bold text-indigo-400 flex items-center justify-between">
                      <span>③ Web探索＆アイテム・コード発掘 (Google検索連動)</span>
                      <span className="text-[10px] bg-indigo-950 px-1.5 py-0.5 rounded border border-indigo-800">
                        Gemini 3.8 Flash + Search
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      「新しい弾幕パターン」「ファンタジーアイテム名の候補」など、知識が必要な時だけネット検索を活用してWeb上の集合知を収集し、ワンクリックでローカルレシピ集に蓄積できます。
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400">
                  <span className="text-white font-semibold">💡 結論:</span>
                  「指示を出す度にお金を払ったりスマホを発熱させたり待たされたりする」のを防ぎ、
                  <strong>「Webで良いノウハウを収集してローカルに詰め込み、普段は0.001秒ノーウェイトで指示即反映」</strong>
                  という最も実用的で快適なゲーム開発体験を実現しています。
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Web Harvest Modal */}
      <WebHarvestModal
        isOpen={isWebHarvestOpen}
        onClose={() => setIsWebHarvestOpen(false)}
        onAddRecipeToLocal={handleAddRecipeToLocal}
      />
    </div>
  );
}
