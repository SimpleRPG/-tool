import React, { useState } from "react";
import { PatchRecipe, GameConfig } from "../types";
import { Sparkles, Code2, Check, Tag, Globe2, Layers } from "lucide-react";

interface Props {
  recipes: PatchRecipe[];
  currentConfig: GameConfig;
  onApplyRecipe: (recipe: PatchRecipe) => void;
  onOpenWebHarvest: () => void;
}

export const RecipeCatalog: React.FC<Props> = ({
  recipes,
  currentConfig,
  onApplyRecipe,
  onOpenWebHarvest,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);

  const categories = [
    { id: "all", label: "すべて", count: recipes.length },
    { id: "weapon", label: "💥 武器/弾幕", count: recipes.filter((r) => r.category === "weapon").length },
    { id: "player", label: "🚀 自機", count: recipes.filter((r) => r.category === "player").length },
    { id: "enemy", label: "👾 敵/ボス", count: recipes.filter((r) => r.category === "enemy").length },
    { id: "item", label: "🧪 アイテム", count: recipes.filter((r) => r.category === "item").length },
    { id: "fx", label: "🎨 演出/世界", count: recipes.filter((r) => r.category === "fx").length },
    { id: "web_search", label: "🌐 Web発掘", count: recipes.filter((r) => r.source === "web_search").length },
  ];

  const filteredRecipes = recipes.filter((recipe) => {
    if (selectedCategory === "web_search") {
      if (recipe.source !== "web_search") return false;
    } else if (selectedCategory !== "all" && recipe.category !== selectedCategory) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = recipe.title.toLowerCase().includes(q);
      const matchDesc = recipe.description.toLowerCase().includes(q);
      const matchKw = recipe.triggerKeywords.some((k) => k.toLowerCase().includes(q));
      return matchTitle || matchDesc || matchKw;
    }
    return true;
  });

  // Check if a recipe's parameters are actively matching the current configuration
  const isRecipeActive = (recipe: PatchRecipe) => {
    const keys = Object.keys(recipe.params) as (keyof GameConfig)[];
    if (keys.length === 0) return false;
    return keys.every((k) => currentConfig[k] === recipe.params[k]);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
      {/* Catalog Header */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-900/90 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            <h3 className="font-bold text-sm text-slate-100 font-sans">
              変更ノウハウ・レシピ集 (全{recipes.length}件)
            </h3>
          </div>
          <button
            id="btn-open-web-harvest"
            onClick={onOpenWebHarvest}
            className="px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Globe2 className="w-3.5 h-3.5" />
            ネット検索で新レシピ収集
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-xs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              id={`cat-filter-${cat.id}`}
              onClick={() => setSelectedCategory(cat.id)}
              className={`shrink-0 px-2.5 py-1 rounded-lg transition-colors font-medium flex items-center gap-1 ${
                selectedCategory === cat.id
                  ? "bg-sky-500 text-slate-950 font-bold"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1 py-0.2 rounded-full ${
                  selectedCategory === cat.id ? "bg-sky-600 text-white" : "bg-slate-700 text-slate-400"
                }`}
              >
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search within recipes */}
        <input
          id="recipe-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="レシピ名、効果、キーワードで検索..."
          className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none"
        />
      </div>

      {/* Recipe List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-slate-800/40">
        {filteredRecipes.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            該当するレシピが見つかりませんでした。
          </div>
        ) : (
          filteredRecipes.map((recipe) => {
            const active = isRecipeActive(recipe);
            const isExpanded = expandedRecipeId === recipe.id;

            return (
              <div
                key={recipe.id}
                id={`recipe-card-${recipe.id}`}
                className={`p-3 rounded-lg border transition-all ${
                  active
                    ? "bg-sky-950/30 border-sky-500/40 shadow-sm shadow-sky-500/10"
                    : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-bold text-sm text-slate-200">{recipe.title}</span>
                      {recipe.source === "web_search" && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-medium flex items-center gap-1">
                          <Globe2 className="w-2.5 h-2.5" /> Web発掘
                        </span>
                      )}
                      {active && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" /> 適用中
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-2">{recipe.description}</p>
                  </div>

                  <button
                    id={`btn-apply-recipe-${recipe.id}`}
                    onClick={() => onApplyRecipe(recipe)}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      active
                        ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        : "bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-md shadow-sky-500/20"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {active ? "再適用" : "⚡ 即時適用"}
                  </button>
                </div>

                {/* Trigger Keywords */}
                <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-400 mt-1">
                  <Tag className="w-3 h-3 text-slate-500" />
                  <span className="text-slate-500">認識キーワード:</span>
                  {recipe.triggerKeywords.map((kw, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 rounded bg-slate-800/90 text-slate-300 font-mono text-[10px] border border-slate-700/60"
                    >
                      「{kw}」
                    </span>
                  ))}
                </div>

                {/* Code Diff Expand Toggle */}
                {recipe.codeDiff && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800/60">
                    <button
                      onClick={() => setExpandedRecipeId(isExpanded ? null : recipe.id)}
                      className="text-[11px] text-slate-400 hover:text-sky-400 flex items-center gap-1 font-mono transition-colors"
                    >
                      <Code2 className="w-3 h-3" />
                      <span>{isExpanded ? "コード差分を隠す" : `コード差分を表示 (${recipe.codeDiff.file})`}</span>
                    </button>

                    {isExpanded && (
                      <div className="mt-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] overflow-x-auto space-y-1">
                        <div className="text-slate-500 text-[10px] pb-1 border-b border-slate-800 flex justify-between">
                          <span>{recipe.codeDiff.file}</span>
                          <span>{recipe.codeDiff.lineRange || ""}</span>
                        </div>
                        <div className="text-rose-400 bg-rose-950/20 px-1.5 py-0.5 rounded border border-rose-900/30 whitespace-pre">
                          - {recipe.codeDiff.before}
                        </div>
                        <div className="text-emerald-400 bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-900/30 whitespace-pre">
                          + {recipe.codeDiff.after}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
