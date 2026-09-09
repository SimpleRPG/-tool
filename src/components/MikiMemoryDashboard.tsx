import React, { useState } from "react";
import {
  MikiLongTermMemory,
  MikiStructuralMemory,
  MikiMetaMemory,
  MikiBrainCapsule,
  SimpleRpgFile,
} from "../types";
import {
  Brain,
  Layers,
  Activity,
  Archive,
  History,
  Tag,
  AlertTriangle,
  CheckCircle2,
  Undo2,
  Trash2,
  FileCode,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface Props {
  memories: MikiLongTermMemory[];
  structuralMemory: MikiStructuralMemory;
  metaMemory: MikiMetaMemory;
  capsules: MikiBrainCapsule[];
  currentFiles: SimpleRpgFile[];
  onCreateCapsule: (label: string) => void;
  onRestoreCapsule: (capsule: MikiBrainCapsule) => void;
  onDeleteCapsule: (id: string) => void;
}

export const MikiMemoryDashboard: React.FC<Props> = ({
  memories,
  structuralMemory,
  metaMemory,
  capsules,
  currentFiles,
  onCreateCapsule,
  onRestoreCapsule,
  onDeleteCapsule,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"long_term" | "structural" | "meta" | "capsules" | "storage">("long_term");
  const [newCapsuleLabel, setNewCapsuleLabel] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Calculate Storage usage in localStorage
  const storageInfo = React.useMemo(() => {
    let vfsBytes = 0;
    let memoriesBytes = 0;
    let capsulesBytes = 0;
    let saveSlotBytes = 0;
    let totalBytes = 0;

    try {
      const vfsRaw = localStorage.getItem("simplerpg_vfs_files_v2") || "";
      vfsBytes = new Blob([vfsRaw]).size;

      const memRaw = localStorage.getItem("miki_longterm_memories") || "";
      memoriesBytes = new Blob([memRaw]).size;

      const capRaw = localStorage.getItem("miki_brain_capsules") || "";
      capsulesBytes = new Blob([capRaw]).size;

      const saveRaw = localStorage.getItem("simplerpg_save_slot_1") || "";
      saveSlotBytes = new Blob([saveRaw]).size;

      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k) {
          totalBytes += new Blob([localStorage.getItem(k) || ""]).size;
        }
      }
    } catch {
      // fallback
    }

    return {
      vfsKb: (vfsBytes / 1024).toFixed(1),
      memoriesKb: (memoriesBytes / 1024).toFixed(1),
      capsulesKb: (capsulesBytes / 1024).toFixed(1),
      saveSlotKb: (saveSlotBytes / 1024).toFixed(1),
      totalKb: (totalBytes / 1024).toFixed(1),
      hasSaveSlot: saveSlotBytes > 0,
    };
  }, [currentFiles, memories, capsules]);

  const filteredMemories = memories.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.title.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q) ||
      m.affectedFiles.some((f) => f.toLowerCase().includes(q)) ||
      m.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  const handleCreateCapsuleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCapsuleLabel.trim()) return;
    onCreateCapsule(newCapsuleLabel.trim());
    setNewCapsuleLabel("");
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
      {/* Sub Tab Header */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/90 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/30">
              <Brain className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-xs sm:text-sm text-slate-100">
              みきAI 記憶層 & ストレージカプセル
            </h3>
          </div>
          {/* Health Score Pill */}
          <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 font-mono">
            <span className="text-slate-400 text-[11px]">健全性:</span>
            <span
              className={`font-bold ${
                metaMemory.healthScore >= 90
                  ? "text-emerald-400"
                  : metaMemory.healthScore >= 70
                  ? "text-amber-400"
                  : "text-rose-400"
              }`}
            >
              {metaMemory.healthScore}点
            </span>
          </div>
        </div>

        {/* Layer Switcher Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs font-mono">
          <button
            onClick={() => setActiveSubTab("long_term")}
            className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 shrink-0 ${
              activeSubTab === "long_term"
                ? "bg-sky-500 text-slate-950 font-bold"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            長期記憶 ({memories.length})
          </button>

          <button
            onClick={() => setActiveSubTab("structural")}
            className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 shrink-0 ${
              activeSubTab === "structural"
                ? "bg-sky-500 text-slate-950 font-bold"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            構造化グラフ ({structuralMemory.nodes.length})
          </button>

          <button
            onClick={() => setActiveSubTab("meta")}
            className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 shrink-0 ${
              activeSubTab === "meta"
                ? "bg-sky-500 text-slate-950 font-bold"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            メタ記憶・診断
          </button>

          <button
            onClick={() => setActiveSubTab("capsules")}
            className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 shrink-0 ${
              activeSubTab === "capsules"
                ? "bg-sky-500 text-slate-950 font-bold"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            カプセル保管庫 ({capsules.length})
          </button>

          <button
            onClick={() => setActiveSubTab("storage")}
            className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 shrink-0 ${
              activeSubTab === "storage"
                ? "bg-sky-500 text-slate-950 font-bold"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            ストレージ状況 ({storageInfo.totalKb} KB)
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 font-sans">
        {/* ==================================================== */}
        {/* 1. Long-Term Memory Tab */}
        {/* ==================================================== */}
        {activeSubTab === "long_term" && (
          <div className="space-y-2.5">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="長期記憶（パッチ、テスト結果、ファイル名）を検索..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-sky-500"
            />

            {filteredMemories.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-500">
                該当する長期記憶エピソードは見つかりませんでした。
              </div>
            ) : (
              filteredMemories.map((mem) => (
                <div
                  key={mem.id}
                  className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-slate-100">{mem.title}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                          {new Date(mem.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{mem.description}</p>
                    </div>

                    <div className="flex items-center gap-0.5 text-amber-400 text-xs shrink-0" title={`重要度: ${mem.importance}/5`}>
                      {"★".repeat(mem.importance)}
                      <span className="text-slate-600 font-mono text-[10px] ml-1">Lv{mem.importance}</span>
                    </div>
                  </div>

                  {/* Test Metrics preview if present */}
                  {mem.testMetrics && (
                    <div className="flex items-center gap-3 p-2 bg-slate-900 rounded-lg text-[11px] font-mono border border-slate-800">
                      <span className="text-emerald-400">勝率: {mem.testMetrics.winRate}%</span>
                      <span className="text-sky-400">平均ターン: {mem.testMetrics.avgTurns}</span>
                      <span className="text-indigo-400">バランス評価: {mem.testMetrics.balanceScore}点</span>
                    </div>
                  )}

                  {/* Affected Files */}
                  <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                    <FileCode className="w-3 h-3 text-slate-500" />
                    {mem.affectedFiles.map((f, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-slate-900 text-sky-300 border border-slate-800 font-mono">
                        {f}
                      </span>
                    ))}
                    {mem.tags.map((t, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* 2. Structural Memory Graph Tab */}
        {/* ==================================================== */}
        {activeSubTab === "structural" && (
          <div className="space-y-3">
            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
              <span>しんぷるRPG 構造化ノードグラフ</span>
              <span className="text-sky-400 font-mono font-bold">全 {structuralMemory.nodes.length} エンティティ</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {structuralMemory.nodes.map((node) => (
                <div
                  key={node.id}
                  className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-lg space-y-1 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-200 truncate">{node.label}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded uppercase font-mono ${
                        node.category === "enemy"
                          ? "bg-rose-950 text-rose-300 border border-rose-800"
                          : node.category === "weapon"
                          ? "bg-amber-950 text-amber-300 border border-amber-800"
                          : node.category === "item"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {node.category}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-500 font-mono truncate">ファイル: {node.file}</div>

                  {node.properties && (
                    <div className="text-[10px] text-slate-400 font-mono bg-slate-900/80 p-1 rounded">
                      {JSON.stringify(node.properties).replace(/[{}]/g, "")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* 3. Meta-Memory & Code Health Tab */}
        {/* ==================================================== */}
        {activeSubTab === "meta" && (
          <div className="space-y-3 text-xs">
            {/* Health Overview Banner */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-slate-400 text-[11px]">全体安定度ステータス</div>
                <div className="text-sm font-bold text-slate-100 flex items-center gap-1.5 mt-0.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  {metaMemory.stabilityRating === "STABLE"
                    ? "良好 (STABLE)"
                    : metaMemory.stabilityRating === "TESTING_NEEDED"
                    ? "要テスト検証 (TESTING_NEEDED)"
                    : "改変ドリフト警告 (CRITICAL_DRIFT)"}
                </div>
              </div>

              <div className="text-right font-mono">
                <div className="text-2xl font-black text-emerald-400">{metaMemory.healthScore}%</div>
                <div className="text-[10px] text-slate-500">健全度スコア</div>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-500">未検証のパッチ数:</span>
                <div className="text-amber-400 font-bold text-sm mt-0.5">{metaMemory.untestedPatches} 件</div>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-500">変更中ファイル:</span>
                <div className="text-sky-400 font-bold text-sm mt-0.5">{metaMemory.totalModifications} / {metaMemory.totalFiles} ファイル</div>
              </div>
            </div>

            {/* Known Issues */}
            {metaMemory.knownIssues.length > 0 && (
              <div className="p-3 bg-rose-950/20 border border-rose-900/40 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-rose-400 text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  検出された課題
                </div>
                {metaMemory.knownIssues.map((issue, i) => (
                  <div key={i} className="text-rose-300 text-[11px] leading-relaxed">
                    • {issue}
                  </div>
                ))}
              </div>
            )}

            {/* Recommendations */}
            {metaMemory.recommendations.length > 0 && (
              <div className="p-3 bg-sky-950/20 border border-sky-900/40 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-sky-400 text-[11px]">
                  <Sparkles className="w-3.5 h-3.5" />
                  みきAIからのアドバイス
                </div>
                {metaMemory.recommendations.map((rec, i) => (
                  <div key={i} className="text-sky-200 text-[11px] leading-relaxed">
                    • {rec}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* 4. Brain Capsules (Snapshot Rollback Storage) */}
        {/* ==================================================== */}
        {activeSubTab === "capsules" && (
          <div className="space-y-3">
            {/* Create Capsule Form */}
            <form onSubmit={handleCreateCapsuleSubmit} className="flex gap-2">
              <input
                type="text"
                value={newCapsuleLabel}
                onChange={(e) => setNewCapsuleLabel(e.target.value)}
                placeholder="スナップショット名 (例: 「ボス調整前バックアップ」)"
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                disabled={!newCapsuleLabel.trim()}
                className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold text-xs rounded-lg transition-all flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Archive className="w-3.5 h-3.5" />
                スナップショット作成
              </button>
            </form>

            {/* Capsule List */}
            <div className="space-y-2">
              {capsules.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500">
                  保存されたブレインカプセル（スナップショット）はまだありません。
                </div>
              ) : (
                capsules.map((cap) => (
                  <div
                    key={cap.id}
                    className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
                        <Archive className="w-3.5 h-3.5 text-sky-400" />
                        {cap.label}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {cap.description} • {new Date(cap.timestamp).toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onRestoreCapsule(cap)}
                        className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title="この時点のコードに復元"
                      >
                        <Undo2 className="w-3 h-3" />
                        復元
                      </button>

                      <button
                        onClick={() => onDeleteCapsule(cap.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                        title="削除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* 5. Storage Inspection Tab */}
        {/* ==================================================== */}
        {activeSubTab === "storage" && (
          <div className="space-y-3">
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  端末内ストレージ (LocalStorage / 完全オフライン)
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  総使用量: {storageInfo.totalKb} KB
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                本ツールおよびゲームデータは、端末ブラウザのローカルストレージ（VFS）にリアルタイム暗号化・自動永続化されています。外部サーバーやクラウド通信は一切行わず、APKビルド時も端末内に直接保存されます。
              </p>
            </div>

            {/* Storage Item Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                  <span>仮想ファイルシステム (VFS)</span>
                  <span className="text-sky-400 font-bold">{storageInfo.vfsKb} KB</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  ゲームコード {currentFiles.length} ファイル (enemy-data, core等)
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                  <span>みきAI 長期記憶エピソード</span>
                  <span className="text-indigo-400 font-bold">{storageInfo.memoriesKb} KB</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  パッチ適用履歴・検証メトリクス ({memories.length} 件)
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                  <span>ブレインカプセル (復元スナップショット)</span>
                  <span className="text-amber-400 font-bold">{storageInfo.capsulesKb} KB</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  バックアップ保存数: {capsules.length} カプセル
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                  <span>しんぷるRPG ゲームセーブデータ</span>
                  <span className="text-emerald-400 font-bold">{storageInfo.saveSlotKb} KB</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  {storageInfo.hasSaveSlot ? "セーブスロット1 記録中" : "未セーブ（ゲーム起動後自動生成）"}
                </div>
              </div>
            </div>

            {/* Quick Export Tips */}
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-300">
                💡 いつでも上部の「📦 ZIP管理」から全ゲームコード＆セーブをZIP保存・復元できます
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
