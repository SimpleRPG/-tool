import React, { useState } from "react";
import { RpgPatchRecipe, SimpleRpgFile } from "../types";
import { Sparkles, Code2, Tag, Layers, Check, FileCode, RefreshCw, Cpu } from "lucide-react";

interface Props {
  recipes: RpgPatchRecipe[];
  files: SimpleRpgFile[];
  onApplyRecipe: (recipe: RpgPatchRecipe) => void;
  onRescan?: () => void;
}

export const RecipeCatalog: React.FC<Props> = ({ recipes, files, onApplyRecipe, onRescan }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);
  const [isRescanning, setIsRescanning] = useState(false);

  const handleRescanClick = () => {
    setIsRescanning(true);
    if (onRescan) onRescan();
    setTimeout(() => setIsRescanning(false), 300);
  };

  const categories = [
    { id: "all", label: "すべて", count: recipes.length },
    { id: "enemy", label: "👾 モンスター", count: recipes.filter((r) => r.category === "enemy").length },
    { id: "weapon", label: "⚔️ 武器・装備", count: recipes.filter((r) => r.category === "weapon").length },
    { id: "item", label: "🧪 アイテム", count: recipes.filter((r) => r.category === "item").length },
    { id: "system", label: "⚙️ コア戦闘式", count: recipes.filter((r) => r.category === "system").length },
    { id: "drop", label: "💰 経済・ドロップ", count: recipes.filter((r) => r.category === "drop").length },
  ];

  const filteredRecipes = recipes.filter((recipe) => {
    if (selectedCategory !== "all" && recipe.category !== selectedCategory) {
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

  // Check if a recipe is currently applied in the files
  const isRecipeApplied = (recipe: RpgPatchRecipe) => {
    const target = files.find((f) => f.path.includes(recipe.targetFile));
    if (!target) return false;
    return target.content.includes(recipe.codeDiff.after);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md font-sans">
      {/* Catalog Header */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/90 flex flex-col gap-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-100 flex items-center gap-2">
                しんぷるRPG パッチレシピ集 (全{recipes.length}件)
                <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1 font-mono">
                  <Cpu className="w-2.5 h-2.5" /> コード/ZIP自動生成
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                読み込まれたしんぷるRPGコード({files.length}ファイル)から100%適用可能なパッチを自動生成
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onRescan && (
              <button
                onClick={handleRescanClick}
                disabled={isRescanning}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-[11px] text-slate-200 border border-slate-700 font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                title="現在のコードを再解析してパッチを自動再生成"
              >
                <RefreshCw className={`w-3 h-3 ${isRescanning ? "animate-spin text-sky-400" : ""}`} />
                <span>再スキャン・再生成</span>
              </button>
            )}
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              完全オフライン (0トークン)
            </span>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-xs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`shrink-0 px-2.5 py-1 rounded-lg transition-colors font-medium flex items-center gap-1 ${
                selectedCategory === cat.id
                  ? "bg-sky-500 text-slate-950 font-bold"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1 rounded-full ${
                  selectedCategory === cat.id ? "bg-sky-600 text-white" : "bg-slate-700 text-slate-400"
                }`}
              >
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Box */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="レシピ名、効果、キーワードで検索..."
          className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none"
        />
      </div>

      {/* Recipe List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredRecipes.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            該当するレシピが見つかりませんでした。
          </div>
        ) : (
          filteredRecipes.map((recipe) => {
            const applied = isRecipeApplied(recipe);
            const isExpanded = expandedRecipeId === recipe.id;

            return (
              <div
                key={recipe.id}
                className={`p-3 rounded-xl border transition-all ${
                  applied
                    ? "bg-sky-950/20 border-sky-500/40 shadow-sm"
                    : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-bold text-xs sm:text-sm text-slate-100">{recipe.title}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-sky-400 border border-slate-700 font-mono flex items-center gap-1">
                        <FileCode className="w-2.5 h-2.5" /> {recipe.targetFile}
                      </span>
                      {applied && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" /> 適用中
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-2">{recipe.description}</p>
                  </div>

                  <button
                    onClick={() => onApplyRecipe(recipe)}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      applied
                        ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        : "bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-md shadow-sky-500/20"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {applied ? "再反映" : "⚡ 即座に反映"}
                  </button>
                </div>

                {/* Trigger Keywords */}
                <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500 mt-1">
                  <Tag className="w-3 h-3" />
                  <span>認識キーワード:</span>
                  {recipe.triggerKeywords.map((kw, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 font-mono text-[10px] border border-slate-800"
                    >
                      「{kw}」
                    </span>
                  ))}
                </div>

                {/* Diff Toggle */}
                <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                  <button
                    onClick={() => setExpandedRecipeId(isExpanded ? null : recipe.id)}
                    className="text-[11px] text-slate-400 hover:text-sky-400 flex items-center gap-1 font-mono transition-colors cursor-pointer"
                  >
                    <Code2 className="w-3 h-3" />
                    <span>{isExpanded ? "コード差分を閉じる" : "コード差分 (Diff) を確認"}</span>
                  </button>

                  <span className="text-[10px] font-mono text-slate-500">{recipe.previewSnippet}</span>
                </div>

                {isExpanded && (
                  <div className="mt-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] space-y-1 overflow-x-auto">
                    <div className="text-rose-400 bg-rose-950/20 px-2 py-1 rounded border border-rose-900/30 whitespace-pre">
                      <span className="select-none text-rose-600 mr-2">-</span>
                      {recipe.codeDiff.before}
                    </div>
                    <div className="text-emerald-400 bg-emerald-950/20 px-2 py-1 rounded border border-emerald-900/30 whitespace-pre">
                      <span className="select-none text-emerald-600 mr-2">+</span>
                      {recipe.codeDiff.after}
                    </div>
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
