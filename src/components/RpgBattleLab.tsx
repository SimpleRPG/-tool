// SimpleRPG Dynamic Battle Lab & Entity Inspector
// Directly probes and modifies Enemies, Weapons, Armors, Items, Skills, and Player Stats
// from the Virtual File System (VFS) or imported ZIP.

import React, { useState, useMemo, useEffect } from "react";
import { SimpleRpgFile } from "../types";
import {
  SimpleRpgScanner,
  ScannedEnemy,
  ScannedWeapon,
  ScannedArmor,
  ScannedItem,
  ScannedSkill,
} from "../services/simpleRpgScanner";
import {
  Swords,
  Shield,
  Heart,
  Sparkles,
  RefreshCw,
  Play,
  RotateCcw,
  Sliders,
  CheckCircle2,
  Activity,
  Layers,
  ChevronRight,
  Target,
  Zap,
  Flame,
  Check,
  Package,
} from "lucide-react";

interface Props {
  files: SimpleRpgFile[];
  onUpdateFiles?: (files: SimpleRpgFile[]) => void;
  onAutoTestRun?: (enemyName: string, winRate: number) => void;
}

export const RpgBattleLab: React.FC<Props> = ({ files, onUpdateFiles, onAutoTestRun }) => {
  // 1. Deep-scan VFS or ZIP to discover all entities
  const scanReport = useMemo(() => {
    return SimpleRpgScanner.scanProject(files);
  }, [files]);

  const { enemies, weapons, armors, items, skills, player: defaultPlayer } = scanReport;

  // Active Tab: "enemy" | "equip" | "item_skill" | "player" | "battle"
  const [activeTab, setActiveTab] = useState<"enemy" | "equip" | "item_skill" | "player" | "battle">("enemy");

  // Notification Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Selected entities for configuration & testing
  const [selectedEnemyId, setSelectedEnemyId] = useState<string>(enemies[0]?.id || "slime");
  const [selectedWeaponId, setSelectedWeaponId] = useState<string>(weapons[0]?.id || "wooden_stick");
  const [selectedArmorId, setSelectedArmorId] = useState<string>(armors[0]?.id || "cloth_tunic");
  const [selectedItemId, setSelectedItemId] = useState<string>(items[0]?.id || "herb");
  const [selectedSkillId, setSelectedSkillId] = useState<string>(skills[0]?.id || "gigadein");

  // Editable Enemy Stats
  const selectedEnemy = useMemo(() => {
    return enemies.find((e) => e.id === selectedEnemyId) || enemies[0];
  }, [enemies, selectedEnemyId]);

  const [editEnemyHp, setEditEnemyHp] = useState<number>(selectedEnemy?.hp || 25);
  const [editEnemyAtk, setEditEnemyAtk] = useState<number>(selectedEnemy?.atk || 6);
  const [editEnemyDef, setEditEnemyDef] = useState<number>(selectedEnemy?.def || 2);
  const [editEnemyGold, setEditEnemyGold] = useState<number>(selectedEnemy?.gold || 5);

  useEffect(() => {
    if (selectedEnemy) {
      setEditEnemyHp(selectedEnemy.hp);
      setEditEnemyAtk(selectedEnemy.atk);
      setEditEnemyDef(selectedEnemy.def);
      setEditEnemyGold(selectedEnemy.gold);
      setEnemyCurHp(selectedEnemy.hp);
    }
  }, [selectedEnemy]);

  // Editable Equipment Stats
  const selectedWeapon = useMemo(() => {
    return weapons.find((w) => w.id === selectedWeaponId) || weapons[0];
  }, [weapons, selectedWeaponId]);

  const selectedArmor = useMemo(() => {
    return armors.find((a) => a.id === selectedArmorId) || armors[0];
  }, [armors, selectedArmorId]);

  const [editWeaponAtk, setEditWeaponAtk] = useState<number>(selectedWeapon?.atk || 3);
  const [editArmorDef, setEditArmorDef] = useState<number>(selectedArmor?.def || 2);

  useEffect(() => {
    if (selectedWeapon) setEditWeaponAtk(selectedWeapon.atk);
  }, [selectedWeapon]);

  useEffect(() => {
    if (selectedArmor) setEditArmorDef(selectedArmor.def);
  }, [selectedArmor]);

  // Editable Item & Skill Stats
  const selectedItem = useMemo(() => {
    return items.find((it) => it.id === selectedItemId) || items[0];
  }, [items, selectedItemId]);

  const selectedSkill = useMemo(() => {
    return skills.find((s) => s.id === selectedSkillId) || skills[0];
  }, [skills, selectedSkillId]);

  const [editItemHeal, setEditItemHeal] = useState<number>(selectedItem?.healHp || 35);
  const [editSkillMpCost, setEditSkillMpCost] = useState<number>(selectedSkill?.mpCost || 10);
  const [editSkillDamage, setEditSkillDamage] = useState<number>(selectedSkill?.damage || 45);

  useEffect(() => {
    if (selectedItem) setEditItemHeal(selectedItem.healHp || 35);
  }, [selectedItem]);

  useEffect(() => {
    if (selectedSkill) {
      setEditSkillMpCost(selectedSkill.mpCost);
      setEditSkillDamage(selectedSkill.damage);
    }
  }, [selectedSkill]);

  // Editable Player Status
  const [editPlayerHp, setEditPlayerHp] = useState<number>(defaultPlayer.hp);
  const [editPlayerMp, setEditPlayerMp] = useState<number>(defaultPlayer.mp);
  const [editPlayerGold, setEditPlayerGold] = useState<number>(defaultPlayer.gold);

  useEffect(() => {
    setEditPlayerHp(defaultPlayer.hp);
    setEditPlayerMp(defaultPlayer.mp);
    setEditPlayerGold(defaultPlayer.gold);
  }, [defaultPlayer]);

  // ========================================================
  // Battle Simulation State
  // ========================================================
  const [playerCurHp, setPlayerCurHp] = useState<number>(editPlayerHp);
  const [playerCurMp, setPlayerCurMp] = useState<number>(editPlayerMp);
  const [enemyCurHp, setEnemyCurHp] = useState<number>(editEnemyHp);
  const [battleTurn, setBattleTurn] = useState<number>(1);
  const [battleStatus, setBattleStatus] = useState<"fighting" | "won" | "lost">("fighting");
  const [battleLogs, setBattleLogs] = useState<string[]>([
    `⚔️ 戦闘準備完了: 【${selectedEnemy?.name}】との対戦シミュレーション`,
  ]);

  const resetBattle = () => {
    setPlayerCurHp(editPlayerHp);
    setPlayerCurMp(editPlayerMp);
    setEnemyCurHp(editEnemyHp);
    setBattleTurn(1);
    setBattleStatus("fighting");
    setBattleLogs([`🔄 戦闘リセット: 【${selectedEnemy?.name}】(HP ${editEnemyHp}) との戦闘開始！`]);
  };

  // Turn Action: Attack
  const handlePlayerAttack = () => {
    if (battleStatus !== "fighting") return;

    const dmg = Math.max(1, Math.floor(editWeaponAtk * 2.5 + Math.random() * 4 - editEnemyDef * 0.5));
    const nextEnemyHp = Math.max(0, enemyCurHp - dmg);
    setEnemyCurHp(nextEnemyHp);

    const newLogs = [...battleLogs];
    newLogs.push(`T${battleTurn} ⚔️ ゆうしゃの攻撃！ ${selectedEnemy.name} に ${dmg} のダメージ！`);

    if (nextEnemyHp <= 0) {
      setBattleStatus("won");
      newLogs.push(`🎉 ${selectedEnemy.name} を討伐！ ${editEnemyGold}G を獲得しました！`);
      setBattleLogs(newLogs.slice(-15));
      return;
    }

    // Enemy counter-attack
    const eDmg = Math.max(1, Math.floor(editEnemyAtk * 0.7 + Math.random() * 3 - editArmorDef * 0.4));
    const nextPlayerHp = Math.max(0, playerCurHp - eDmg);
    setPlayerCurHp(nextPlayerHp);
    newLogs.push(`💥 ${selectedEnemy.name} の反撃！ ${eDmg} のダメージを受けた！`);

    if (nextPlayerHp <= 0) {
      setBattleStatus("lost");
      newLogs.push(`💀 ゆうしゃは力尽きてしまった…`);
    }

    setBattleTurn((t) => t + 1);
    setBattleLogs(newLogs.slice(-15));
  };

  // Turn Action: Herb
  const handlePlayerItem = () => {
    if (battleStatus !== "fighting") return;
    const nextPlayerHp = Math.min(editPlayerHp, playerCurHp + editItemHeal);
    setPlayerCurHp(nextPlayerHp);

    const newLogs = [...battleLogs];
    newLogs.push(`T${battleTurn} 🧪 ${selectedItem.name} を使用！ HPが ${editItemHeal} 回復した！`);

    // Enemy counter
    const eDmg = Math.max(1, Math.floor(editEnemyAtk * 0.7 + Math.random() * 3 - editArmorDef * 0.4));
    const nextPlayerHpAfter = Math.max(0, nextPlayerHp - eDmg);
    setPlayerCurHp(nextPlayerHpAfter);
    newLogs.push(`💥 ${selectedEnemy.name} の反撃！ ${eDmg} のダメージを受けた！`);

    if (nextPlayerHpAfter <= 0) {
      setBattleStatus("lost");
      newLogs.push(`💀 ゆうしゃは力尽きてしまった…`);
    }

    setBattleTurn((t) => t + 1);
    setBattleLogs(newLogs.slice(-15));
  };

  // Turn Action: Skill (Gigadein)
  const handlePlayerSkill = () => {
    if (battleStatus !== "fighting") return;
    if (playerCurMp < editSkillMpCost) {
      setBattleLogs((prev) => [...prev.slice(-14), `⚠️ MPが不足しています！ (必要: ${editSkillMpCost})`]);
      return;
    }

    setPlayerCurMp((mp) => mp - editSkillMpCost);
    const dmg = editSkillDamage;
    const nextEnemyHp = Math.max(0, enemyCurHp - dmg);
    setEnemyCurHp(nextEnemyHp);

    const newLogs = [...battleLogs];
    newLogs.push(`T${battleTurn} ✨ ${selectedSkill.name} 詠唱！ ${selectedEnemy.name} に ${dmg} の大ダメージ！`);

    if (nextEnemyHp <= 0) {
      setBattleStatus("won");
      newLogs.push(`🎉 ${selectedEnemy.name} を撃砕！ 勝利しました！`);
      setBattleLogs(newLogs.slice(-15));
      return;
    }

    // Enemy counter
    const eDmg = Math.max(1, Math.floor(editEnemyAtk * 0.7 + Math.random() * 3 - editArmorDef * 0.4));
    const nextPlayerHp = Math.max(0, playerCurHp - eDmg);
    setPlayerCurHp(nextPlayerHp);
    newLogs.push(`💥 ${selectedEnemy.name} の反撃！ ${eDmg} のダメージを受けた！`);

    if (nextPlayerHp <= 0) {
      setBattleStatus("lost");
      newLogs.push(`💀 ゆうしゃは力尽きてしまった…`);
    }

    setBattleTurn((t) => t + 1);
    setBattleLogs(newLogs.slice(-15));
  };

  // 100-Trial Automated Simulation
  const [autoSimResult, setAutoSimResult] = useState<{
    wins: number;
    losses: number;
    winRate: number;
    avgTurns: number;
  } | null>(null);

  const run100BattleSim = () => {
    let wins = 0;
    let losses = 0;
    let totalTurns = 0;

    for (let i = 0; i < 100; i++) {
      let pHp = editPlayerHp;
      let pMp = editPlayerMp;
      let eHp = editEnemyHp;
      let turns = 0;

      while (pHp > 0 && eHp > 0 && turns < 50) {
        turns++;
        // Strategy: Use skill if MP available, else attack
        if (pMp >= editSkillMpCost && turns === 1) {
          pMp -= editSkillMpCost;
          eHp -= editSkillDamage;
        } else if (pHp < editPlayerHp * 0.4) {
          pHp = Math.min(editPlayerHp, pHp + editItemHeal);
        } else {
          const dmg = Math.max(1, Math.floor(editWeaponAtk * 2.5 + Math.random() * 4 - editEnemyDef * 0.5));
          eHp -= dmg;
        }

        if (eHp <= 0) {
          wins++;
          break;
        }

        const eDmg = Math.max(1, Math.floor(editEnemyAtk * 0.7 + Math.random() * 3 - editArmorDef * 0.4));
        pHp -= eDmg;

        if (pHp <= 0) {
          losses++;
          break;
        }
      }
      totalTurns += turns;
    }

    const winRate = Math.round((wins / 100) * 100);
    const avgTurns = +(totalTurns / 100).toFixed(1);
    setAutoSimResult({ wins, losses, winRate, avgTurns });

    if (onAutoTestRun && selectedEnemy) {
      onAutoTestRun(selectedEnemy.name, winRate);
    }
    showToast(`100戦シミュレーション完了: 勝率 ${winRate}% (平均 ${avgTurns} ターン)`);
  };

  // ========================================================
  // Direct Code Mutation Handlers (VFS & Live Preview Update)
  // ========================================================
  const handleApplyEnemyToCode = () => {
    if (!onUpdateFiles) return;
    const updated = SimpleRpgScanner.updateEnemyInFiles(files, selectedEnemy.name, {
      hp: editEnemyHp,
      maxHp: editEnemyHp,
      atk: editEnemyAtk,
      def: editEnemyDef,
      gold: editEnemyGold,
    });
    onUpdateFiles(updated);
    showToast(`⚡ 【${selectedEnemy.name}】のステータス (HP:${editEnemyHp}, ATK:${editEnemyAtk}) をゲームコードに反映しました！`);
  };

  const handleSetAsActiveGameEnemy = () => {
    if (!onUpdateFiles) return;
    const updated = SimpleRpgScanner.setActiveEnemyInGame(files, {
      ...selectedEnemy,
      hp: editEnemyHp,
      maxHp: editEnemyHp,
      atk: editEnemyAtk,
      def: editEnemyDef,
      gold: editEnemyGold,
    });
    onUpdateFiles(updated);
    showToast(`🎯 ゲーム内の出現敵を【${selectedEnemy.name}】に切り替えました！プレビューですぐ戦えます。`);
  };

  const handleApplyEquipmentToCode = () => {
    if (!onUpdateFiles) return;
    let updated = SimpleRpgScanner.updateWeaponInFiles(files, selectedWeapon.id, editWeaponAtk);
    onUpdateFiles(updated);
    showToast(`⚡ 武器攻撃力 (${editWeaponAtk}) をゲームコードに反映しました！`);
  };

  const handleApplyItemAndSkillToCode = () => {
    if (!onUpdateFiles) return;
    let updated = SimpleRpgScanner.updateItemInFiles(files, selectedItem.id, editItemHeal);
    updated = SimpleRpgScanner.updateSkillInFiles(updated, selectedSkill.id, editSkillMpCost, editSkillDamage);
    onUpdateFiles(updated);
    showToast(`⚡ やくそう回復量(${editItemHeal}) & ギガデイン威力(${editSkillDamage}) をコードに反映しました！`);
  };

  const handleApplyPlayerStatusToCode = () => {
    if (!onUpdateFiles) return;
    const updated = SimpleRpgScanner.updatePlayerStatusInFiles(files, {
      hp: editPlayerHp,
      maxHp: editPlayerHp,
      mp: editPlayerMp,
      gold: editPlayerGold,
    });
    onUpdateFiles(updated);
    showToast(`⚡ 勇者の初期ステータス (HP:${editPlayerHp}, MP:${editPlayerMp}, Gold:${editPlayerGold}) をコードに反映しました！`);
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden text-slate-100 font-sans shadow-xl">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white text-xs px-3 py-1.5 flex items-center gap-2 font-medium animate-fadeIn">
          <Check className="w-3.5 h-3.5 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header with Project Probe Info */}
      <div className="px-3 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-sky-500/20 text-sky-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-200">しんぷるRPG 探索・改造・戦闘ラボ</h2>
            <p className="text-[10px] text-slate-400">
              コード内から自動検出: 敵 {enemies.length}種 / 武器 {weapons.length}種 / 持ち物 {items.length}種 / 魔法 {skills.length}種
            </p>
          </div>
        </div>

        {/* Global Reset */}
        <button
          onClick={resetBattle}
          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 flex items-center gap-1 cursor-pointer transition-colors"
          title="戦闘数値をリセット"
        >
          <RotateCcw className="w-3 h-3" />
          リセット
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center bg-slate-950/70 border-b border-slate-800 px-2 overflow-x-auto text-xs shrink-0">
        <button
          onClick={() => setActiveTab("enemy")}
          className={`px-3 py-2 font-semibold border-b-2 flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
            activeTab === "enemy"
              ? "border-sky-400 text-sky-400 bg-sky-950/30"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          👾 敵キャラ ({enemies.length})
        </button>
        <button
          onClick={() => setActiveTab("equip")}
          className={`px-3 py-2 font-semibold border-b-2 flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
            activeTab === "equip"
              ? "border-amber-400 text-amber-400 bg-amber-950/30"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Swords className="w-3.5 h-3.5" />
          ⚔️ 武器・防具
        </button>
        <button
          onClick={() => setActiveTab("item_skill")}
          className={`px-3 py-2 font-semibold border-b-2 flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
            activeTab === "item_skill"
              ? "border-emerald-400 text-emerald-400 bg-emerald-950/30"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          🧪 やくそう・魔法
        </button>
        <button
          onClick={() => setActiveTab("player")}
          className={`px-3 py-2 font-semibold border-b-2 flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
            activeTab === "player"
              ? "border-purple-400 text-purple-400 bg-purple-950/30"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          🛡️ 勇者ステータス
        </button>
        <button
          onClick={() => setActiveTab("battle")}
          className={`px-3 py-2 font-semibold border-b-2 flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
            activeTab === "battle"
              ? "border-rose-400 text-rose-400 bg-rose-950/30"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          🎮 戦闘シミュレータ
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 p-3 overflow-y-auto">
        {/* ======================================================== */}
        {/* TAB 1: 敵キャラ選択 & ステータス変更 */}
        {/* ======================================================== */}
        {activeTab === "enemy" && (
          <div className="flex flex-col gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
              <label className="text-[11px] font-bold text-slate-400 block mb-1.5">
                しんぷるRPG 敵モンスター選択 (ZIP/コードから検出):
              </label>
              <select
                value={selectedEnemyId}
                onChange={(e) => setSelectedEnemyId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg p-2 text-sm font-semibold outline-none focus:border-sky-500"
              >
                {enemies.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.sprite || "👾"} {e.name} (HP: {e.hp} / ATK: {e.atk} / DEF: {e.def} / {e.gold}G)
                  </option>
                ))}
              </select>
            </div>

            {/* Editable Stats for selected enemy */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-xs text-sky-300 flex items-center gap-1.5">
                  <span className="text-xl">{selectedEnemy?.sprite || "🟢"}</span>
                  【{selectedEnemy?.name}】のステータス調整
                </span>
                <span className="text-[10px] text-slate-500 font-mono">ソース: {selectedEnemy?.sourceFile}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">最大HP (体力): <b className="text-emerald-400">{editEnemyHp}</b></label>
                  <input
                    type="range"
                    min={1}
                    max={1000}
                    value={editEnemyHp}
                    onChange={(e) => setEditEnemyHp(parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-500"
                  />
                  <input
                    type="number"
                    value={editEnemyHp}
                    onChange={(e) => setEditEnemyHp(parseInt(e.target.value, 10) || 1)}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-emerald-300 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">攻撃力 (ATK): <b className="text-rose-400">{editEnemyAtk}</b></label>
                  <input
                    type="range"
                    min={1}
                    max={150}
                    value={editEnemyAtk}
                    onChange={(e) => setEditEnemyAtk(parseInt(e.target.value, 10))}
                    className="w-full accent-rose-500"
                  />
                  <input
                    type="number"
                    value={editEnemyAtk}
                    onChange={(e) => setEditEnemyAtk(parseInt(e.target.value, 10) || 1)}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-rose-300 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">防御力 (DEF): <b className="text-blue-400">{editEnemyDef}</b></label>
                  <input
                    type="range"
                    min={0}
                    max={80}
                    value={editEnemyDef}
                    onChange={(e) => setEditEnemyDef(parseInt(e.target.value, 10))}
                    className="w-full accent-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">討伐ゴールド: <b className="text-amber-400">{editEnemyGold} G</b></label>
                  <input
                    type="range"
                    min={0}
                    max={500}
                    value={editEnemyGold}
                    onChange={(e) => setEditEnemyGold(parseInt(e.target.value, 10))}
                    className="w-full accent-amber-500"
                  />
                </div>
              </div>

              {/* Action Buttons to write to Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={handleApplyEnemyToCode}
                  className="px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 active:scale-95 font-bold text-white text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-sky-900/30 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  ⚡ この数値をゲームコードに即時反映
                </button>
                <button
                  onClick={handleSetAsActiveGameEnemy}
                  className="px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 active:scale-95 font-bold text-white text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-900/30 transition-all"
                >
                  <Target className="w-3.5 h-3.5" />
                  🎯 ゲーム内の出現敵に設定する
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: 装備 (武器・防具) 選択 & 変更 */}
        {/* ======================================================== */}
        {activeTab === "equip" && (
          <div className="flex flex-col gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
              <label className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                <Swords className="w-3.5 h-3.5" />
                武器選択 & 攻撃力調整:
              </label>
              <select
                value={selectedWeaponId}
                onChange={(e) => setSelectedWeaponId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg p-2 text-xs font-semibold outline-none"
              >
                {weapons.map((w) => (
                  <option key={w.id} value={w.id}>
                    ⚔️ {w.name} (攻撃力: {w.atk})
                  </option>
                ))}
              </select>

              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">武器攻撃力 (weaponAtk):</span>
                  <span className="text-amber-400 font-mono font-bold">{editWeaponAtk}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={200}
                  value={editWeaponAtk}
                  onChange={(e) => setEditWeaponAtk(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-500"
                />
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
              <label className="text-[11px] font-bold text-blue-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                防具選択 & 防御力調整:
              </label>
              <select
                value={selectedArmorId}
                onChange={(e) => setSelectedArmorId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg p-2 text-xs font-semibold outline-none"
              >
                {armors.map((a) => (
                  <option key={a.id} value={a.id}>
                    🛡️ {a.name} (防御力: {a.def})
                  </option>
                ))}
              </select>

              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">防具防御力 (armorDef):</span>
                  <span className="text-blue-400 font-mono font-bold">{editArmorDef}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={editArmorDef}
                  onChange={(e) => setEditArmorDef(parseInt(e.target.value, 10))}
                  className="w-full accent-blue-500"
                />
              </div>
            </div>

            <button
              onClick={handleApplyEquipmentToCode}
              className="px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 active:scale-95 font-bold text-white text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-amber-900/30 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              ⚡ 武器・防具の数値をゲームコードに即時反映
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: 持ち物・スキル (やくそう・魔法) 選択 & 変更 */}
        {/* ======================================================== */}
        {activeTab === "item_skill" && (
          <div className="flex flex-col gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
              <label className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" />
                持ち物・やくそう回復量調整:
              </label>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">やくそうHP回復量:</span>
                <span className="text-emerald-400 font-mono font-bold">+{editItemHeal} HP</span>
              </div>
              <input
                type="range"
                min={10}
                max={300}
                value={editItemHeal}
                onChange={(e) => setEditItemHeal(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-500"
              />
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col gap-3">
              <label className="text-[11px] font-bold text-purple-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                スキル・ギガデイン性能調整:
              </label>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">消費MPコスト:</span>
                  <span className="text-sky-400 font-mono font-bold">{editSkillMpCost} MP</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50}
                  value={editSkillMpCost}
                  onChange={(e) => setEditSkillMpCost(parseInt(e.target.value, 10))}
                  className="w-full accent-sky-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">魔法ダメージ:</span>
                  <span className="text-rose-400 font-mono font-bold">{editSkillDamage} DMG</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={999}
                  value={editSkillDamage}
                  onChange={(e) => setEditSkillDamage(parseInt(e.target.value, 10))}
                  className="w-full accent-rose-500"
                />
              </div>
            </div>

            <button
              onClick={handleApplyItemAndSkillToCode}
              className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 font-bold text-white text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-900/30 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              ⚡ やくそう・魔法の数値をゲームコードに即時反映
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: 勇者ステータス変更 */}
        {/* ======================================================== */}
        {activeTab === "player" && (
          <div className="flex flex-col gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col gap-3">
              <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                勇者の初期パラメータ調整
              </span>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">初期最大HP:</span>
                  <span className="text-rose-400 font-mono font-bold">{editPlayerHp} HP</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={999}
                  value={editPlayerHp}
                  onChange={(e) => setEditPlayerHp(parseInt(e.target.value, 10))}
                  className="w-full accent-rose-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">初期最大MP:</span>
                  <span className="text-sky-400 font-mono font-bold">{editPlayerMp} MP</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={300}
                  value={editPlayerMp}
                  onChange={(e) => setEditPlayerMp(parseInt(e.target.value, 10))}
                  className="w-full accent-sky-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">初期所持金 (Gold):</span>
                  <span className="text-amber-400 font-mono font-bold">{editPlayerGold} G</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={99999}
                  step={50}
                  value={editPlayerGold}
                  onChange={(e) => setEditPlayerGold(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-500"
                />
              </div>

              <button
                onClick={handleApplyPlayerStatusToCode}
                className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 active:scale-95 font-bold text-white text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-purple-900/30 transition-all mt-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                ⚡ 勇者ステータスをゲームコードに即時反映
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: 戦闘テスト (手動バトル & 100戦オート検証) */}
        {/* ======================================================== */}
        {activeTab === "battle" && (
          <div className="flex flex-col gap-3">
            {/* Matchup Header */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedEnemy?.sprite || "🟢"}</span>
                <div>
                  <div className="font-bold text-xs text-slate-200">対戦相手: {selectedEnemy?.name}</div>
                  <div className="text-[10px] text-slate-400">
                    HP: <b className="text-emerald-400">{enemyCurHp}</b> / {editEnemyHp} | ATK: {editEnemyAtk} | DEF: {editEnemyDef}
                  </div>
                </div>
              </div>

              <div className="text-right text-[10px]">
                <div className="text-rose-400 font-bold">勇者HP: {playerCurHp} / {editPlayerHp}</div>
                <div className="text-sky-400 font-bold">勇者MP: {playerCurMp} / {editPlayerMp}</div>
              </div>
            </div>

            {/* Combat Actions */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handlePlayerAttack}
                disabled={battleStatus !== "fighting"}
                className="px-3 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-40 font-bold text-xs text-white flex items-center justify-center gap-1 cursor-pointer active:scale-95 transition-all"
              >
                <Swords className="w-3.5 h-3.5" />
                ⚔️ こうげき
              </button>
              <button
                onClick={handlePlayerItem}
                disabled={battleStatus !== "fighting"}
                className="px-3 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 font-bold text-xs text-white flex items-center justify-center gap-1 cursor-pointer active:scale-95 transition-all"
              >
                <Package className="w-3.5 h-3.5" />
                🧪 やくそう
              </button>
              <button
                onClick={handlePlayerSkill}
                disabled={battleStatus !== "fighting" || playerCurMp < editSkillMpCost}
                className="px-3 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 font-bold text-xs text-white flex items-center justify-center gap-1 cursor-pointer active:scale-95 transition-all"
              >
                <Zap className="w-3.5 h-3.5" />
                ✨ ギガデイン
              </button>
            </div>

            {/* Battle Logs */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 h-36 overflow-y-auto font-mono text-[11px] flex flex-col gap-1">
              {battleLogs.map((log, i) => (
                <div key={i} className="text-slate-300">
                  {log}
                </div>
              ))}
            </div>

            {/* 100-Trial Automated Simulation */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  100戦 高速オート検証
                </span>
                <button
                  onClick={run100BattleSim}
                  className="px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 active:scale-95 font-bold text-white text-xs flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Play className="w-3 h-3" />
                  100戦実行
                </button>
              </div>

              {autoSimResult && (
                <div className="grid grid-cols-3 gap-2 mt-1 text-center bg-slate-900 rounded-lg p-2 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400">勝率</div>
                    <div className={`font-bold text-sm ${autoSimResult.winRate >= 60 ? "text-emerald-400" : "text-rose-400"}`}>
                      {autoSimResult.winRate}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">勝敗数</div>
                    <div className="font-bold text-slate-200">
                      {autoSimResult.wins}勝 / {autoSimResult.losses}敗
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">平均ターン</div>
                    <div className="font-bold text-amber-400">{autoSimResult.avgTurns}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
