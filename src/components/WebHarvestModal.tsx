import React, { useState } from "react";
import { Globe, Search, Plus, Sparkles, ExternalLink, Loader2, Check, X, BookOpen, Lightbulb } from "lucide-react";
import { PatchRecipe, WebCitation } from "../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAddRecipeToLocal: (recipe: PatchRecipe) => void;
}

const PRESET_TOPICS = [
  { label: "東方風の優美な弾幕", query: "東方Project 弾幕アルゴリズム 渦巻き 幾何学", mode: "code" },
  { label: "ヴァンサバ風の進化武器", query: "Vampire Survivors 武器進化 アイテム名 効果", mode: "items" },
  { label: "北欧神話の伝説武具", query: "北欧神話 武器 アイテム 特殊効果 神話", mode: "items" },
  { label: "サイバーパンクの特殊弾", query: "サイバーパンク レーザー ナノマシン EMP 兵器", mode: "recipes" },
  { label: "バウンド跳弾の物理演算", query: "2Dゲーム 跳ね返り 物理演算 アルゴリズム", mode: "code" },
];

export const WebHarvestModal: React.FC<Props> = ({ isOpen, onClose, onAddRecipeToLocal }) => {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"items" | "code" | "recipes">("items");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [citations, setCitations] = useState<WebCitation[]>([]);
  const [harvestedRecipes, setHarvestedRecipes] = useState<PatchRecipe[]>([]);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (overrideQuery?: string, overrideMode?: "items" | "code" | "recipes") => {
    const q = overrideQuery || query;
    const m = overrideMode || mode;
    if (!q.trim()) return;

    setLoading(true);
    setErrorMessage(null);
    setSummary(null);
    setCitations([]);
    setHarvestedRecipes([]);

    try {
      const res = await fetch("/api/web-harvest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, mode: m }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "ネット検索とレシピ生成に失敗しました");
      }

      const data = await res.json();
      setSummary(data.summary || "Web情報を収集しました。");
      setCitations(data.searchCitations || []);

      // Format recipes with source tag
      const formatted: PatchRecipe[] = (data.recipes || []).map((r: any, idx: number) => ({
        id: r.id || `web_${Date.now()}_${idx}`,
        title: r.title || "Web発掘レシピ",
        category: r.category || "weapon",
        description: r.description || "Web検索から抽出されたカスタムレシピ",
        triggerKeywords: r.triggerKeywords || [q],
        params: r.params || {},
        codeDiff: {
          file: "WebPatchRegistry.ts",
          lineRange: `L${idx * 10 + 1}-L${idx * 10 + 6}`,
          before: "// Default unaugmented configuration",
          after: r.codeSnippet || JSON.stringify(r.params, null, 2),
        },
        source: "web_search",
        tags: ["Web発掘", q],
      }));

      setHarvestedRecipes(formatted);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (recipe: PatchRecipe) => {
    onAddRecipeToLocal(recipe);
    setAddedIds((prev) => new Set(prev).add(recipe.id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/30">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Web探索・新コード＆アイテム名収集
              </h2>
              <p className="text-xs text-slate-400">
                Google検索を活用してゲームアイデアや弾幕コードを発掘し、ローカル辞書に即座に蓄積します
              </p>
            </div>
          </div>
          <button
            id="btn-close-web-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Mode Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">探索モード:</span>
            {[
              { id: "items", label: "🧪 アイテム名・武具候補" },
              { id: "code", label: "💻 ゲームコード・弾幕計算式" },
              { id: "recipes", label: "⚡ 総合改造レシピ" },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id as any)}
                className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                  mode === m.id
                    ? "bg-sky-500 text-slate-950 font-bold"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                id="input-web-harvest-query"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="例: 「ヴァンサバ風の聖水弾」「東方の桜花弾幕」「北欧神話の雷槌ミョルニル」"
                className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none pr-10"
              />
              <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>

            <button
              id="btn-web-harvest-run"
              onClick={() => handleSearch()}
              disabled={loading || !query.trim()}
              className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold text-sm rounded-xl transition-colors flex items-center gap-2 shrink-0 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>探索中...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Web探索実行</span>
                </>
              )}
            </button>
          </div>

          {/* Preset Suggestions */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <Lightbulb className="w-3 h-3 text-amber-400" />
              おすすめの探索キーワード:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_TOPICS.map((pt, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setQuery(pt.query);
                    setMode(pt.mode as any);
                    handleSearch(pt.query, pt.mode as any);
                  }}
                  className="text-xs px-2.5 py-1 bg-slate-800/80 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700/60 hover:border-slate-600 transition-colors"
                >
                  {pt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error display */}
          {errorMessage && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs">
              {errorMessage}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
              <p className="text-xs font-mono">Google検索エンジンでゲーム情報・アイテム設定を調査中...</p>
            </div>
          )}

          {/* Search Result Citations & Summary */}
          {!loading && summary && (
            <div className="space-y-3 pt-2">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                <div className="flex items-center gap-1.5 font-bold text-sky-400 mb-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  Web収集サマリー
                </div>
                {summary}
              </div>

              {citations.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                  <span className="text-slate-500">参照元ソース:</span>
                  {citations.map((c, i) => (
                    <a
                      key={i}
                      href={c.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2 py-0.5 rounded bg-slate-800/60 text-sky-400 hover:text-sky-300 border border-slate-700/50 flex items-center gap-1 transition-colors truncate max-w-[200px]"
                    >
                      <span className="truncate">{c.title || c.url}</span>
                      <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Discovered Recipe Cards */}
          {!loading && harvestedRecipes.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
                <span>発掘されたレシピ候補 ({harvestedRecipes.length}件)</span>
                <span className="text-emerald-400">ワンクリックでローカルレシピ集に登録可能</span>
              </div>

              {harvestedRecipes.map((recipe) => {
                const isAdded = addedIds.has(recipe.id);
                return (
                  <div
                    key={recipe.id}
                    className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                          {recipe.title}
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30">
                            {recipe.category}
                          </span>
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{recipe.description}</p>
                      </div>

                      <button
                        onClick={() => handleAdd(recipe)}
                        disabled={isAdded}
                        className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          isAdded
                            ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800"
                            : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20"
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            登録済み
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            ローカルに登録
                          </>
                        )}
                      </button>
                    </div>

                    {/* Trigger keywords */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                      <span className="text-slate-500">登録されるトリガー語:</span>
                      {recipe.triggerKeywords.map((kw, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded bg-slate-900 text-sky-300 font-mono text-[10px] border border-slate-800"
                        >
                          「{kw}」
                        </span>
                      ))}
                    </div>

                    {/* Parameters Preview */}
                    <div className="bg-slate-900/90 p-2 rounded-lg font-mono text-[10px] text-slate-300 border border-slate-800 overflow-x-auto">
                      <span className="text-slate-500">// パラメータ適用値: </span>
                      {JSON.stringify(recipe.params)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono">
            💡 一度ローカルに登録すれば、以降は完全オフライン・0.001秒で発動します
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
