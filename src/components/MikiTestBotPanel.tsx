import React, { useState, useMemo, useEffect } from "react";
import { SimpleRpgFile, MikiAiTestRunResult } from "../types";
import { MikiAiTestRunner } from "../services/mikiAiTestRunner";
import { SimpleRpgScanner } from "../services/simpleRpgScanner";
import { Bot, Play, CheckCircle2, AlertTriangle, RefreshCw, Swords, Shield, Heart, Sparkles } from "lucide-react";

interface Props {
  files: SimpleRpgFile[];
  onTestCompleted?: (result: MikiAiTestRunResult) => void;
}

export const MikiTestBotPanel: React.FC<Props> = ({ files, onTestCompleted }) => {
  const scanReport = useMemo(() => SimpleRpgScanner.scanProject(files), [files]);

  const [selectedEnemyId, setSelectedEnemyId] = useState<string>(() => {
    return scanReport.enemies[0]?.id || "slime";
  });

  const [selectedWeaponId, setSelectedWeaponId] = useState<string>(() => {
    return scanReport.weapons[0]?.id || "wooden_stick";
  });

  const [trials, setTrials] = useState<number>(200);
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<MikiAiTestRunResult | null>(() => {
    return MikiAiTestRunner.runSimulation(files, scanReport.enemies[0]?.id || "slime", 100);
  });

  // Ensure selectedEnemyId stays valid when files/scanReport changes
  useEffect(() => {
    if (scanReport.enemies.length > 0 && !scanReport.enemies.some((e) => e.id === selectedEnemyId)) {
      setSelectedEnemyId(scanReport.enemies[0].id);
    }
    if (scanReport.weapons.length > 0 && !scanReport.weapons.some((w) => w.id === selectedWeaponId)) {
      setSelectedWeaponId(scanReport.weapons[0].id);
    }
  }, [scanReport, selectedEnemyId, selectedWeaponId]);

  const activeEnemy = useMemo(() => {
    return scanReport.enemies.find((e) => e.id === selectedEnemyId) || scanReport.enemies[0];
  }, [scanReport, selectedEnemyId]);

  const activeWeapon = useMemo(() => {
    return scanReport.weapons.find((w) => w.id === selectedWeaponId) || scanReport.weapons[0];
  }, [scanReport, selectedWeaponId]);

  const handleRunSimulation = () => {
    setIsRunning(true);
    setTimeout(() => {
      const result = MikiAiTestRunner.runSimulation(files, selectedEnemyId, trials, selectedWeaponId);
      setLastResult(result);
      setIsRunning(false);
      if (onTestCompleted) {
        onTestCompleted(result);
      }
    }, 120); // tactile feel
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
      {/* Header */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs sm:text-sm text-slate-100 flex items-center gap-1.5">
              ミキAI 自律テストプレイ検証
            </h3>
            <p className="text-[10px] text-slate-400">
              しんぷるRPGの全モンスター({scanReport.enemies.length}体) & 装備({scanReport.weapons.length}種)と完全連動
            </p>
          </div>
        </div>

        <button
          onClick={handleRunSimulation}
          disabled={isRunning}
          className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-400 hover:to-sky-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
        >
          {isRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{isRunning ? "検証中..." : "テスト実行"}</span>
        </button>
      </div>

      {/* Control Bar: Enemy & Weapon Selector */}
      <div className="px-3 py-2.5 border-b border-slate-800 bg-slate-950/60 flex flex-col gap-2 text-xs">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Enemy Selector */}
          <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
            <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1">
              <span className="text-sm">👾</span> 敵:
            </span>
            <select
              value={selectedEnemyId}
              onChange={(e) => setSelectedEnemyId(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 text-slate-100 font-bold rounded-lg px-2.5 py-1.5 outline-none text-xs cursor-pointer focus:border-indigo-500"
            >
              {scanReport.enemies.map((enemy, idx) => (
                <option key={`${enemy.id}_${idx}`} value={enemy.id}>
                  {enemy.name} (HP: {enemy.hp} / ATK: {enemy.atk})
                </option>
              ))}
            </select>
          </div>

          {/* Weapon Selector */}
          <div className="flex items-center gap-1.5 flex-1 min-w-[180px]">
            <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1">
              <Swords className="w-3.5 h-3.5 text-amber-400" /> 武器:
            </span>
            <select
              value={selectedWeaponId}
              onChange={(e) => setSelectedWeaponId(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 text-slate-100 font-bold rounded-lg px-2.5 py-1.5 outline-none text-xs cursor-pointer focus:border-amber-500"
            >
              {scanReport.weapons.map((wpn, idx) => (
                <option key={`${wpn.id}_${idx}`} value={wpn.id}>
                  {wpn.name} (ATK: {wpn.atk})
                </option>
              ))}
            </select>
          </div>

          {/* Trials Selector */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-slate-400">回数:</span>
            {[100, 300, 500].map((t) => (
              <button
                key={t}
                onClick={() => setTrials(t)}
                className={`px-2 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                  trials === t
                    ? "bg-indigo-600 text-white font-bold"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {t}戦
              </button>
            ))}
          </div>
        </div>

        {/* Live Detected Enemy & Weapon Pill */}
        {activeEnemy && (
          <div className="flex items-center gap-3 text-[11px] bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800/80 text-slate-300 overflow-x-auto scrollbar-none font-mono">
            <span className="font-bold text-sky-300 flex items-center gap-1">
              <Heart className="w-3 h-3 text-rose-400" /> HP: {activeEnemy.hp}
            </span>
            <span className="text-amber-300 flex items-center gap-1">
              <Swords className="w-3 h-3 text-amber-400" /> ATK: {activeEnemy.atk}
            </span>
            <span className="text-slate-400 flex items-center gap-1">
              <Shield className="w-3 h-3 text-sky-400" /> DEF: {activeEnemy.def}
            </span>
            <span className="text-yellow-400">🪙 討伐: {activeEnemy.gold}G</span>
            <span className="text-slate-500 text-[10px] ml-auto">ソース: {activeEnemy.sourceFile}</span>
          </div>
        )}
      </div>

      {/* Simulation Results View */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 font-sans">
        {lastResult && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400">プレイヤー勝率</div>
                <div
                  className={`text-lg font-black mt-0.5 ${
                    lastResult.playerWinRate >= 80
                      ? "text-emerald-400"
                      : lastResult.playerWinRate >= 50
                      ? "text-amber-400"
                      : "text-rose-400"
                  }`}
                >
                  {lastResult.playerWinRate}%
                </div>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400">平均撃破ターン</div>
                <div className="text-lg font-black text-sky-400 mt-0.5">{lastResult.avgTurns} ターン</div>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400">平均被ダメージ</div>
                <div className="text-lg font-black text-rose-400 mt-0.5">{lastResult.avgDamageTaken} dmg</div>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400">回復薬消費率</div>
                <div className="text-lg font-black text-indigo-400 mt-0.5">{lastResult.itemConsumptionRate} 個/戦</div>
              </div>
            </div>

            {/* Balance Status Banner */}
            <div
              className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                lastResult.balanceRating === "PERFECT"
                  ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                  : lastResult.balanceRating === "TOO_BRUTAL"
                  ? "bg-rose-950/30 border-rose-500/40 text-rose-300"
                  : "bg-amber-950/30 border-amber-500/40 text-amber-300"
              }`}
            >
              <div className="flex items-center gap-2">
                {lastResult.balanceRating === "PERFECT" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                )}
                <div>
                  <span className="font-bold">総合バランス判定: </span>
                  <strong>
                    {lastResult.balanceRating === "PERFECT"
                      ? "絶妙・理想的 (PERFECT)"
                      : lastResult.balanceRating === "TOO_BRUTAL"
                      ? "過酷・即死危険 (TOO_BRUTAL)"
                      : lastResult.balanceRating === "TOO_TRIVIAL"
                      ? "ぬるゲー・瞬殺 (TOO_TRIVIAL)"
                      : "やや高難易度 (SLIGHTLY_HARD)"}
                  </strong>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40">
                {lastResult.totalSimulations}戦完了
              </span>
            </div>

            {/* Miki AI Feedback Comments */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 text-xs">
              <div className="font-bold text-slate-200 flex items-center gap-1.5 text-[11px]">
                <Bot className="w-3.5 h-3.5 text-indigo-400" />
                ミキAIのテストプレイ診断レポート
              </div>
              {lastResult.mikiAiFeedback.map((fb, idx) => (
                <div key={idx} className="text-slate-300 text-xs leading-relaxed pl-2 border-l-2 border-indigo-500/40">
                  {fb}
                </div>
              ))}
            </div>

            {/* Combat Simulation Snippet Log */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
              <div className="text-[11px] font-bold text-slate-400 font-mono flex items-center justify-between">
                <span>直近のテスト戦闘ログ抜粋</span>
                <span className="text-slate-600 text-[10px]">Turn Details</span>
              </div>
              <div className="space-y-1 font-mono text-[11px] text-slate-400 bg-slate-900/90 p-2.5 rounded-lg">
                {lastResult.logSnippet.map((line, i) => (
                  <div key={i} className="text-slate-300 truncate">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
