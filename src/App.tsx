import React, { useState, useEffect, useMemo } from "react";
import {
  SimpleRpgFile,
  CodeDiffBlock,
  RpgPatchRecipe,
  MikiBrainCapsule,
  MikiLongTermMemory,
} from "./types";
import { DEFAULT_SIMPLE_RPG_FILES } from "./data/defaultSimpleRpgFiles";
import { RPG_BUILTIN_RECIPES, applyDiffsToFile } from "./services/rpgLocalParser";
import { DynamicPatchGenerator } from "./services/dynamicPatchGenerator";
import { MikiMemoryService } from "./services/mikiMemoryService";
import { nativeStorage } from "./services/nativeStorage";
import { RpgGamePreview } from "./components/RpgGamePreview";
import { CommandInputBar } from "./components/CommandInputBar";
import { MikiTestBotPanel } from "./components/MikiTestBotPanel";
import { MikiMemoryDashboard } from "./components/MikiMemoryDashboard";
import { RpgCodeEditor } from "./components/RpgCodeEditor";
import { RecipeCatalog } from "./components/RecipeCatalog";
import { ZipImportExportModal } from "./components/ZipImportExportModal";
import {
  Gamepad2,
  Zap,
  Bot,
  Brain,
  FileCode,
  Layers,
  FileArchive,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Smartphone,
  ChevronRight,
} from "lucide-react";
import { SchemaAnalyzer } from "./services/schemaAnalyzer";
import { DetectedSchema } from "./types";

const STORAGE_VFS_KEY = "simplerpg_vfs_files_v2";

type MobileTab = "game" | "patch" | "test" | "memory" | "code";

export default function App() {
  // 1. Virtual File System for SimpleRPG
  const [files, setFiles] = useState<SimpleRpgFile[]>(DEFAULT_SIMPLE_RPG_FILES);

  // 2. Miki AI Memories & Brain Capsules State
  const [memories, setMemories] = useState<MikiLongTermMemory[]>([]);
  const [capsules, setCapsules] = useState<MikiBrainCapsule[]>([]);
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    (async () => {
      const savedFiles = await nativeStorage.getJSON<SimpleRpgFile[] | null>(STORAGE_VFS_KEY, null);
      if (savedFiles && Array.isArray(savedFiles) && savedFiles.length > 0) {
        setFiles(savedFiles);
      }
      setMemories(await MikiMemoryService.getLongTermMemories());
      setCapsules(await MikiMemoryService.getBrainCapsules());
      setStorageReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!storageReady) return; // ロード完了前に空データで上書き保存しないためのガード
    nativeStorage.setJSON(STORAGE_VFS_KEY, files);
  }, [files, storageReady]);

  const [activePatchBadge, setActivePatchBadge] = useState<string | null>(null);
  const [lastDiffs, setLastDiffs] = useState<CodeDiffBlock[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Navigation State
  // For Mobile: "game" | "patch" | "test" | "memory" | "code"
  const [mobileTab, setMobileTab] = useState<MobileTab>("game");
  // For Desktop Right Panel: "miki_test" | "miki_memory" | "code_editor" | "recipes"
  const [desktopTab, setDesktopTab] = useState<"miki_test" | "miki_memory" | "code_editor" | "recipes">("miki_test");
  const [isZipModalOpen, setIsZipModalOpen] = useState(false);
  const [detectedSchema, setDetectedSchema] = useState<DetectedSchema | null>(null);

  // Structural & Meta memories derived from files & history
  const structuralMemory = useMemo(() => {
    return MikiMemoryService.buildStructuralGraph(files);
  }, [files]);

  const metaMemory = useMemo(() => {
    return MikiMemoryService.evaluateMetaMemory(files, memories);
  }, [files, memories]);

  // Dynamic Patch Generator: Automatically extracts 100% applicable SimpleRPG patches from current files / imported ZIP
  const [rescanVersion, setRescanVersion] = useState(0);

  const dynamicRecipes = useMemo(() => {
    return DynamicPatchGenerator.generatePatchesFromFiles(files);
  }, [files, rescanVersion]);

  // Top contextual quick action recipes to display in the Quick Patch Bar
  const quickActionRecipes = useMemo(() => {
    const list: RpgPatchRecipe[] = [];
    const nerf = dynamicRecipes.find((r) => r.category === "enemy" && r.id.includes("nerf"));
    if (nerf) list.push(nerf);
    const buffWpn = dynamicRecipes.find((r) => r.category === "weapon");
    if (buffWpn) list.push(buffWpn);
    const boss = dynamicRecipes.find((r) => r.category === "enemy" && r.id.includes("boss"));
    if (boss) list.push(boss);
    const item = dynamicRecipes.find((r) => r.category === "item");
    if (item) list.push(item);
    const gold = dynamicRecipes.find((r) => r.category === "drop");
    if (gold) list.push(gold);

    // If needed, fill up to 5 items from dynamic recipes
    if (list.length < 5) {
      dynamicRecipes.forEach((r) => {
        if (list.length < 5 && !list.find((x) => x.id === r.id)) {
          list.push(r);
        }
      });
    }
    return list;
  }, [dynamicRecipes]);

  // Tactile audio feedback on patch application
  const playTactileChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } catch {
      // Audio context may be restricted by autoplay policy
    }
  };

  // Apply Diffs to Files (from Parser or Recipe)
  const handleApplyDiffs = async (diffs: CodeDiffBlock[], log: string, patchTitle: string) => {
    playTactileChime();

    const updatedFiles = files.map((file) => {
      const relevantDiffs = diffs.filter(
        (d) => file.path.includes(d.file) || file.content.includes(d.before)
      );
      if (relevantDiffs.length === 0) return file;

      const newContent = applyDiffsToFile(file.content, relevantDiffs);
      return {
        ...file,
        content: newContent,
        modified: true,
        size: newContent.length,
      };
    });

    setFiles(updatedFiles);
    setLastDiffs(diffs);
    setActivePatchBadge(patchTitle);

    // Save episode to Miki Long-Term Memory
    const affectedFiles = Array.from(new Set(diffs.map((d) => d.file)));
    await MikiMemoryService.addMemory({
      type: "patch_applied",
      title: `パッチ適用: ${patchTitle}`,
      description: log,
      importance: 4,
      affectedFiles,
      tags: ["パッチ", "ローカル反映", "ゼロレイテンシ"],
    });

    setMemories(await MikiMemoryService.getLongTermMemories());
  };

  // Apply Built-in Recipe
  const handleApplyRecipe = (recipe: RpgPatchRecipe) => {
    handleApplyDiffs([recipe.codeDiff], recipe.description, recipe.title);
  };

  // Direct manual code update from editor
  const handleUpdateFileContent = async (path: string, newContent: string) => {
    playTactileChime();
    const updated = files.map((f) => {
      if (f.path === path) {
        return {
          ...f,
          content: newContent,
          modified: true,
          size: newContent.length,
        };
      }
      return f;
    });
    setFiles(updated);

    await MikiMemoryService.addMemory({
      type: "manual_edit",
      title: `手動コード編集: ${path}`,
      description: `${path} をエディタから直接編集保存しました。`,
      importance: 3,
      affectedFiles: [path],
      tags: ["手動編集", "直接保存"],
    });
    setMemories(await MikiMemoryService.getLongTermMemories());
  };

  // Reset a single file back to default
  const handleResetFile = async (path: string) => {
    const defaultFile = DEFAULT_SIMPLE_RPG_FILES.find((f) => f.path === path);
    if (!defaultFile) return;

    const updated = files.map((f) => (f.path === path ? { ...defaultFile } : f));
    setFiles(updated);

    await MikiMemoryService.addMemory({
      type: "file_reset",
      title: `ファイルリセット: ${path}`,
      description: `${path} を標準初期状態に戻しました。`,
      importance: 2,
      affectedFiles: [path],
      tags: ["リセット", "初期化"],
    });
    setMemories(await MikiMemoryService.getLongTermMemories());
  };

  // Reset all VFS to default
  const handleResetAllToDefault = async () => {
    if (window.confirm("しんぷるRPGの全ファイルを初期状態に戻しますか？")) {
      setFiles(DEFAULT_SIMPLE_RPG_FILES);
      setActivePatchBadge(null);
      setLastDiffs([]);
      await nativeStorage.setJSON(STORAGE_VFS_KEY, DEFAULT_SIMPLE_RPG_FILES);
      await MikiMemoryService.addMemory({
        type: "factory_reset",
        title: "全コード初期化",
        description: "しんぷるRPGの全ソースファイルをファクトリーデフォルトに戻しました。",
        importance: 5,
        affectedFiles: DEFAULT_SIMPLE_RPG_FILES.map((f) => f.path),
        tags: ["全初期化"],
      });
      setMemories(await MikiMemoryService.getLongTermMemories());
    }
  };

  // Capsule handlers
  const handleCreateCapsule = async (label: string) => {
    await MikiMemoryService.createBrainCapsule(label, files);
    setCapsules(await MikiMemoryService.getBrainCapsules());
    setMemories(await MikiMemoryService.getLongTermMemories());
  };

  const handleRestoreCapsule = async (target: string | MikiBrainCapsule) => {
    const capsuleId = typeof target === "string" ? target : target.id;
    const capsule = capsules.find((c) => c.id === capsuleId);
    if (!capsule) return;

    if (window.confirm(`「${capsule.label}」のスナップショットに復元しますか？現在のコードは上書きされます。`)) {
      const restoredFiles = files.map((f) => {
        if (capsule.files[f.path] !== undefined) {
          return {
            ...f,
            content: capsule.files[f.path],
            modified: true,
            size: capsule.files[f.path].length,
          };
        }
        return f;
      });

      setFiles(restoredFiles);
      await MikiMemoryService.addMemory({
        type: "snapshot_restored",
        title: `カプセル復元: ${capsule.label}`,
        description: `過去のスナップショット (${new Date(capsule.timestamp).toLocaleString()}) にロールバックしました。`,
        importance: 5,
        affectedFiles: Object.keys(capsule.files),
        tags: ["ロールバック", "復元"],
      });
      setMemories(await MikiMemoryService.getLongTermMemories());
    }
  };

  const handleDeleteCapsule = async (id: string) => {
    await MikiMemoryService.deleteCapsule(id);
    setCapsules(await MikiMemoryService.getBrainCapsules());
  };

  // Import ZIP files into studio
  const handleImportFiles = async (newFiles: SimpleRpgFile[]) => {
    setFiles(newFiles);
    setActivePatchBadge(null);

    // スキーマ解析 (ローカルのみ、Gemini不使用)
    const schema = SchemaAnalyzer.analyzeSchema(newFiles);
    setDetectedSchema(schema);

    await MikiMemoryService.addMemory({
      type: "snapshot_created",
      title: "ZIPアーカイブ読み込み",
      description: `外部ZIPから ${newFiles.length} 個のしんぷるRPGファイルを読み込みました。`,
      importance: 5,
      affectedFiles: newFiles.map((f) => f.path),
      tags: ["ZIPインポート", "外部プロジェクト"],
    });
    setMemories(await MikiMemoryService.getLongTermMemories());
    setIsZipModalOpen(false);
    setMobileTab("game");
  };

  const hasLoadedZip = files.some((f) => f.path.includes("/") || f.path.startsWith("SimpleRPG"));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-slate-950 pb-16 lg:pb-0">
      {/* ==================================================== */}
      {/* Top Application Navigation Bar */}
      {/* ==================================================== */}
      <header className="px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between gap-2">
        {/* Left Branding */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-slate-950 font-black shadow-md shadow-sky-500/20 text-xs sm:text-base shrink-0">
            ⚔️
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="font-bold text-xs sm:text-sm text-slate-100 tracking-tight">
                しんぷるRPG 開発スタジオ
              </h1>
              {hasLoadedZip ? (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                  ZIP読込中
                </span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-mono hidden sm:inline-block">
                  みきAI 記憶層
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              LLM不使用・ローカル0.001秒パッチ反映 & ミキAI自律戦闘テスト環境
            </p>
          </div>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Audio Chime Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title={soundEnabled ? "効果音: ON" : "効果音: OFF"}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-sky-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
          </button>

          {/* Reset all button */}
          <button
            onClick={handleResetAllToDefault}
            className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            title="全コードを初期状態にリセット"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">リセット</span>
          </button>

          {/* ZIP Import/Export & APK Kit Button */}
          <button
            id="btn-open-zip-modal"
            onClick={() => setIsZipModalOpen(true)}
            className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-sky-600/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <FileArchive className="w-3.5 h-3.5" />
            <span>ZIP読込 / APK</span>
          </button>
        </div>
      </header>

      {/* ==================================================== */}
      {/* Workspace Area: Mobile-First Single Tab on Mobile, 2-Col on Desktop */}
      {/* ==================================================== */}

      {/* --- DESKTOP VIEW (hidden on mobile, visible on lg:) --- */}
      <main className="hidden lg:grid flex-1 p-4 max-w-7xl w-full mx-auto grid-cols-12 gap-4">
        {/* Left Column (5 cols): Game Preview & Command Input Bar */}
        <section className="col-span-5 flex flex-col gap-3 min-h-[580px]">
          <div className="flex-1 min-h-[500px]">
            <RpgGamePreview
              files={files}
              activePatchBadge={activePatchBadge}
              onUpdateFiles={(newFiles) => setFiles(newFiles)}
              detectedSchema={detectedSchema}
              onUpdateSchema={setDetectedSchema}
              onAutoTestRun={async (enemyName, winRate) => {
                await MikiMemoryService.addMemory({
                  type: "test_result",
                  title: `戦闘ラボ検証: ${enemyName} (勝率${winRate}%)`,
                  description: `戦闘シミュレータにて【${enemyName}】に対する検証を実施。勝率は${winRate}%でした。`,
                  importance: 3,
                  affectedFiles: ["enemy-data.js", "combat-equip-data.js"],
                  tags: ["戦闘テスト", enemyName],
                  testMetrics: {
                    winRate,
                    avgTurns: 4,
                    balanceScore: winRate >= 70 ? 90 : 65,
                  },
                });
                setMemories(await MikiMemoryService.getLongTermMemories());
              }}
            />
          </div>

          <CommandInputBar
            files={files}
            recipes={dynamicRecipes}
            onApplyDiffs={handleApplyDiffs}
          />
        </section>

        {/* Right Column (7 cols): Desktop Tabs */}
        <section className="col-span-7 flex flex-col gap-2">
          {/* Studio Tab Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto text-xs font-semibold">
            <button
              onClick={() => setDesktopTab("miki_test")}
              className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                desktopTab === "miki_test"
                  ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>🤖 ミキAI テストプレイ</span>
            </button>

            <button
              onClick={() => setDesktopTab("miki_memory")}
              className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                desktopTab === "miki_memory"
                  ? "bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <Brain className="w-4 h-4" />
              <span>🧠 みきAI 記憶層・カプセル</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 font-mono">
                {memories.length}
              </span>
            </button>

            <button
              onClick={() => setDesktopTab("code_editor")}
              className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                desktopTab === "code_editor"
                  ? "bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>📄 RPGコード・差分</span>
            </button>

            <button
              onClick={() => setDesktopTab("recipes")}
              className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                desktopTab === "recipes"
                  ? "bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>⚡ コード自動生成パッチ ({dynamicRecipes.length})</span>
            </button>
          </div>

          {/* Active Tab View */}
          <div className="flex-1 min-h-0">
            {desktopTab === "miki_test" && (
              <MikiTestBotPanel
                files={files}
                onTestCompleted={async () => {
                  setMemories(await MikiMemoryService.getLongTermMemories());
                }}
              />
            )}

            {desktopTab === "miki_memory" && (
              <MikiMemoryDashboard
                memories={memories}
                structuralMemory={structuralMemory}
                metaMemory={metaMemory}
                capsules={capsules}
                currentFiles={files}
                onCreateCapsule={handleCreateCapsule}
                onRestoreCapsule={handleRestoreCapsule}
                onDeleteCapsule={handleDeleteCapsule}
              />
            )}

            {desktopTab === "code_editor" && (
              <RpgCodeEditor
                files={files}
                lastDiffs={lastDiffs}
                onUpdateFileContent={handleUpdateFileContent}
                onResetFile={handleResetFile}
              />
            )}

            {desktopTab === "recipes" && (
              <RecipeCatalog
                recipes={dynamicRecipes}
                files={files}
                onApplyRecipe={handleApplyRecipe}
                onRescan={() => setRescanVersion((v) => v + 1)}
              />
            )}
          </div>
        </section>
      </main>

      {/* --- MOBILE VIEW (visible on < lg:, mobile-optimized full screen) --- */}
      <main className="lg:hidden flex-1 flex flex-col p-2 sm:p-3 overflow-hidden">
        {/* Mobile Tab 1: Game Live Execution */}
        {mobileTab === "game" && (
          <div className="flex-1 flex flex-col gap-2 min-h-0">
            <div className="flex-1 min-h-[420px] h-[calc(100vh-190px)]">
              <RpgGamePreview
                files={files}
                activePatchBadge={activePatchBadge}
                onUpdateFiles={(newFiles) => setFiles(newFiles)}
                detectedSchema={detectedSchema}
                onUpdateSchema={setDetectedSchema}
                onAutoTestRun={async (enemyName, winRate) => {
                  await MikiMemoryService.addMemory({
                    type: "test_result",
                    title: `戦闘ラボ検証: ${enemyName} (勝率${winRate}%)`,
                    description: `戦闘シミュレータにて【${enemyName}】に対する検証を実施。勝率は${winRate}%でした。`,
                    importance: 3,
                    affectedFiles: ["enemy-data.js", "combat-equip-data.js"],
                    tags: ["戦闘テスト", enemyName],
                    testMetrics: {
                      winRate,
                      avgTurns: 4,
                      balanceScore: winRate >= 70 ? 90 : 65,
                    },
                  });
                  setMemories(await MikiMemoryService.getLongTermMemories());
                }}
              />
            </div>

            {/* Quick One-Tap Patch Bar right beneath the game preview for easy thumb access - DYNAMICALLY GENERATED FROM CODE/ZIP */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 flex items-center gap-1.5 overflow-x-auto text-[11px] scrollbar-none">
              <span className="text-slate-400 shrink-0 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-sky-400" />
                即反映:
              </span>
              {quickActionRecipes.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleApplyRecipe(r)}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 font-semibold shrink-0 cursor-pointer active:scale-95 border border-slate-700/60 max-w-[150px] truncate"
                  title={r.title}
                >
                  {r.previewSnippet || r.title}
                </button>
              ))}
              <button
                onClick={() => setMobileTab("patch")}
                className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold shrink-0 flex items-center gap-1 ml-auto cursor-pointer"
              >
                全パッチ ({dynamicRecipes.length})
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Mobile Tab 2: AI Patch & Command Bar & Recipes */}
        {mobileTab === "patch" && (
          <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
            <CommandInputBar
              files={files}
              recipes={dynamicRecipes}
              onApplyDiffs={(diffs, log, title) => {
                handleApplyDiffs(diffs, log, title);
                // Switch back to game preview automatically so user sees the change!
                setMobileTab("game");
              }}
            />

            <div className="flex-1">
              <RecipeCatalog
                recipes={dynamicRecipes}
                files={files}
                onApplyRecipe={(r) => {
                  handleApplyRecipe(r);
                  setMobileTab("game");
                }}
                onRescan={() => setRescanVersion((v) => v + 1)}
              />
            </div>
          </div>
        )}

        {/* Mobile Tab 3: Miki Test Bot */}
        {mobileTab === "test" && (
          <div className="flex-1 overflow-y-auto">
            <MikiTestBotPanel
              files={files}
              onTestCompleted={async () => {
                setMemories(await MikiMemoryService.getLongTermMemories());
              }}
            />
          </div>
        )}

        {/* Mobile Tab 4: Miki Long-Term Memory & Capsules */}
        {mobileTab === "memory" && (
          <div className="flex-1 overflow-y-auto">
            <MikiMemoryDashboard
              memories={memories}
              structuralMemory={structuralMemory}
              metaMemory={metaMemory}
              capsules={capsules}
              currentFiles={files}
              onCreateCapsule={handleCreateCapsule}
              onRestoreCapsule={handleRestoreCapsule}
              onDeleteCapsule={handleDeleteCapsule}
            />
          </div>
        )}

        {/* Mobile Tab 5: Code Editor */}
        {mobileTab === "code" && (
          <div className="flex-1 overflow-hidden h-[calc(100vh-140px)]">
            <RpgCodeEditor
              files={files}
              lastDiffs={lastDiffs}
              onUpdateFileContent={handleUpdateFileContent}
              onResetFile={handleResetFile}
            />
          </div>
        )}
      </main>

      {/* ==================================================== */}
      {/* Mobile Fixed Bottom Navigation Bar (親指で届く快適ナビ) */}
      {/* ==================================================== */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 border-t border-slate-800 backdrop-blur-lg px-2 py-1.5 flex items-center justify-around">
        <button
          onClick={() => setMobileTab("game")}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-w-[58px] min-h-[46px] ${
            mobileTab === "game"
              ? "bg-sky-500/20 text-sky-400 font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Gamepad2 className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">ゲーム</span>
        </button>

        <button
          onClick={() => setMobileTab("patch")}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-w-[58px] min-h-[46px] ${
            mobileTab === "patch"
              ? "bg-sky-500/20 text-sky-400 font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Zap className="w-5 h-5 mb-0.5 text-amber-400" />
          <span className="text-[10px]">パッチ</span>
        </button>

        <button
          onClick={() => setMobileTab("test")}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-w-[58px] min-h-[46px] ${
            mobileTab === "test"
              ? "bg-indigo-500/20 text-indigo-400 font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Bot className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">AI検証</span>
        </button>

        <button
          onClick={() => setMobileTab("memory")}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-w-[58px] min-h-[46px] relative ${
            mobileTab === "memory"
              ? "bg-sky-500/20 text-sky-400 font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Brain className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">記憶</span>
          {memories.length > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-sky-400" />
          )}
        </button>

        <button
          onClick={() => setMobileTab("code")}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-w-[58px] min-h-[46px] ${
            mobileTab === "code"
              ? "bg-sky-500/20 text-sky-400 font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <FileCode className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">コード</span>
        </button>
      </nav>

      {/* ==================================================== */}
      {/* ZIP Import/Export & APK Kit Generator Modal */}
      {/* ==================================================== */}
      <ZipImportExportModal
        isOpen={isZipModalOpen}
        onClose={() => setIsZipModalOpen(false)}
        files={files}
        onImportFiles={handleImportFiles}
      />
    </div>
  );
}
