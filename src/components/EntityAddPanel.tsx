// src/components/EntityAddPanel.tsx
// スキーマを使ってローカルでエンティティを追加するフォームUI
// Geminiは一切呼ばない

import React, { useState } from "react";
import { SimpleRpgFile, DetectedSchema, DetectedArraySchema } from "../types";
import { SchemaAnalyzer } from "../services/schemaAnalyzer";
import { Plus, AlertTriangle } from "lucide-react";

interface Props {
  schema: DetectedSchema | null;
  files: SimpleRpgFile[];
  onFilesUpdate: (files: SimpleRpgFile[]) => void;
}

type TabKey = "enemy" | "weapon" | "armor" | "item" | "skill";

const TAB_LABELS: Record<TabKey, string> = {
  enemy:  "👾 敵",
  weapon: "⚔️ 武器",
  armor:  "🛡️ 防具",
  item:   "🧪 アイテム",
  skill:  "✨ スキル",
};

export const EntityAddPanel: React.FC<Props> = ({ schema, files, onFilesUpdate }) => {
  const [tab, setTab] = useState<TabKey>("enemy");
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [lastAdded, setLastAdded] = useState<string | null>(null);

  const getSchema = (key: TabKey): DetectedArraySchema | null => {
    if (!schema) return null;
    const map: Record<TabKey, DetectedArraySchema | null> = {
      enemy:  schema.enemies,
      weapon: schema.weapons,
      armor:  schema.armors,
      item:   schema.items,
      skill:  schema.skills,
    };
    return map[key];
  };

  const currentSchema = getSchema(tab);

  const handleChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleAdd = () => {
    if (!currentSchema) return;

    // itemShape の型に従って値をキャスト
    const newEntry: Record<string, any> = {};
    for (const [key, type] of Object.entries(currentSchema.itemShape)) {
      const val = formValues[key] ?? "";
      newEntry[key] = type === "number" ? Number(val) || 0 : val;
    }

    // 必須項目チェック (name または id がある場合)
    if ("name" in newEntry && !newEntry.name) {
      alert("名前を入力してください");
      return;
    }

    const updatedFiles = SchemaAnalyzer.insertEntityIntoVfs(files, currentSchema, newEntry);
    onFilesUpdate(updatedFiles);
    setLastAdded(`${tab}: ${JSON.stringify(newEntry)}`);
    setFormValues({});
  };

  return (
    <div className="space-y-3">
      {/* タブ */}
      <div className="flex gap-1 flex-wrap">
        {(Object.keys(TAB_LABELS) as TabKey[]).map((key) => {
          const s = getSchema(key);
          return (
            <button
              key={key}
              onClick={() => { setTab(key); setFormValues({}); setLastAdded(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                tab === key
                  ? "bg-sky-500 text-slate-950"
                  : s
                  ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  : "bg-slate-900 text-slate-600 cursor-not-allowed"
              }`}
            >
              {TAB_LABELS[key]}
              {!s && <span className="ml-1 text-[10px]">未検出</span>}
            </button>
          );
        })}
      </div>

      {/* スキーマ未検出 */}
      {!currentSchema && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-400">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            このカテゴリのスキーマが検出できませんでした。<br />
            ZIPをインポートするとスキーマが自動解析されます。
          </span>
        </div>
      )}

      {/* 動的フォーム */}
      {currentSchema && (
        <div className="space-y-2">
          <p className="text-[10px] text-slate-500 font-mono">
            追加先: {currentSchema.sourceFile} / {currentSchema.variableName}
          </p>

          <div className="grid grid-cols-2 gap-2">
            {Object.entries(currentSchema.itemShape).map(([key, type]) => (
              <div key={key}>
                <label className="text-[10px] text-slate-400 block mb-0.5">
                  {key}
                  <span className="ml-1 text-slate-600">({type})</span>
                </label>
                <input
                  type={type === "number" ? "number" : "text"}
                  value={formValues[key] ?? ""}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-sky-500"
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleAdd}
            className="w-full py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            {TAB_LABELS[tab]}を追加
          </button>

          {lastAdded && (
            <p className="text-[10px] text-emerald-400 font-mono break-all">
              ✅ 追加しました: {lastAdded}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
