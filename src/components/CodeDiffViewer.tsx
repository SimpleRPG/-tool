import React, { useState } from "react";
import { GameConfig, PatchRecipe } from "../types";
import { FileCode, Check, Copy, History, Terminal } from "lucide-react";

interface Props {
  currentConfig: GameConfig;
  lastPatch: {
    title: string;
    recipes: PatchRecipe[];
    timestamp: number;
    log: string;
  } | null;
  onResetToDefault: () => void;
}

export const CodeDiffViewer: React.FC<Props> = ({ currentConfig, lastPatch, onResetToDefault }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"diff" | "config">("diff");

  const generateLiveCodePreview = (cfg: GameConfig) => {
    return `// ==========================================
// 🚀 Live Game Logic & State (0.001s Hot-Reloaded)
// ==========================================

export const activePlayerConfig = {
  speed: ${cfg.playerSpeed}, // 移動速度 (初期: 4.5)
  hitboxRadius: ${cfg.playerSize},
  color: "${cfg.playerColor}",
  maxHp: ${cfg.playerMaxHp},
  shieldActive: ${cfg.playerShield}, // プラズマシールド
  ghostTrail: ${cfg.playerGhostTrail},
  magnetRadius: ${cfg.playerMagnetRadius},
};

export const activeWeaponConfig = {
  bulletType: "${cfg.bulletType}", // 'normal' | 'spread' | 'homing' | 'laser' | 'bouncing' | 'orbital'
  count: ${cfg.bulletCount}, // 同時発射数
  velocity: ${cfg.bulletSpeed},
  spreadAngle: ${cfg.bulletSpread.toFixed(2)},
  size: ${cfg.bulletSize},
  color: "${cfg.bulletColor}",
  damage: ${cfg.bulletDamage},
  cooldownMs: ${cfg.bulletCooldown},
  piercing: ${cfg.piercing},
  bounces: ${cfg.bounces},
};

export const activeEnemyConfig = {
  speed: ${cfg.enemySpeed},
  spawnRateMult: ${cfg.enemySpawnRate},
  freezeFactor: ${cfg.enemyFreezeEffect}, // 凍結スロー率
  splitOnDeath: ${cfg.enemySplitOnDeath},
  bossChance: ${cfg.bossChance},
};

export const activeWorldFX = {
  theme: "${cfg.theme}",
  scoreMultiplier: ${cfg.scoreMultiplier},
  screenShake: ${cfg.screenShakeIntensity},
  timeScale: ${cfg.timeScale},
  neonGlow: ${cfg.neonGlow},
};`;
  };

  const handleCopy = () => {
    const code = generateLiveCodePreview(currentConfig);
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
      {/* Header */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="font-mono font-bold text-xs text-slate-200">
            {activeTab === "diff" ? "⚡ 最新パッチ差分 (Diff Patch)" : "📄 現在の適用コード (State)"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Switcher */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
            <button
              onClick={() => setActiveTab("diff")}
              className={`px-2.5 py-1 rounded-md transition-colors font-mono ${
                activeTab === "diff" ? "bg-slate-800 text-sky-400 font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Diff
            </button>
            <button
              onClick={() => setActiveTab("config")}
              className={`px-2.5 py-1 rounded-md transition-colors font-mono ${
                activeTab === "config" ? "bg-slate-800 text-sky-400 font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Config.ts
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            title="コードをコピー"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            id="btn-reset-all-patches"
            onClick={onResetToDefault}
            className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            title="初期コードに戻す"
          >
            <History className="w-3 h-3" />
            リセット
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs text-slate-300 bg-slate-950/80">
        {activeTab === "diff" ? (
          lastPatch && lastPatch.recipes.length > 0 ? (
            <div className="space-y-4">
              <div className="p-2.5 bg-sky-950/30 border border-sky-500/30 rounded-lg text-slate-300 text-xs flex items-center justify-between">
                <div>
                  <span className="text-slate-400 font-semibold">直前の指示適用: </span>
                  <strong className="text-sky-300">{lastPatch.title}</strong>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800">
                  Hot Reloaded (0.001s)
                </span>
              </div>

              {lastPatch.recipes.map((rec, i) => (
                <div key={i} className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/50">
                  <div className="px-3 py-1.5 bg-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between border-b border-slate-800">
                    <span className="flex items-center gap-1.5 text-sky-400">
                      <FileCode className="w-3.5 h-3.5" />
                      {rec.codeDiff.file}
                    </span>
                    <span className="text-slate-500">{rec.codeDiff.lineRange || "PATCH BLOCK"}</span>
                  </div>

                  <div className="p-2.5 space-y-1 bg-slate-950 text-[11px] leading-relaxed overflow-x-auto">
                    <div className="text-rose-400 bg-rose-950/20 px-2 py-1 rounded border border-rose-900/30 whitespace-pre">
                      <span className="select-none text-rose-600 mr-2">-</span>
                      {rec.codeDiff.before}
                    </div>
                    <div className="text-emerald-400 bg-emerald-950/20 px-2 py-1 rounded border border-emerald-900/30 whitespace-pre">
                      <span className="select-none text-emerald-600 mr-2">+</span>
                      {rec.codeDiff.after}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              <p className="mb-2">まだパッチは適用されていません。</p>
              <p className="text-[11px] text-slate-600">
                画面下の「弾を3連射」「自機2倍速」などをクリックするか、指示を入力すると即座にコード差分が表示されます。
              </p>
            </div>
          )
        ) : (
          <pre className="text-slate-300 leading-relaxed overflow-x-auto">
            <code>{generateLiveCodePreview(currentConfig)}</code>
          </pre>
        )}
      </div>
    </div>
  );
};
