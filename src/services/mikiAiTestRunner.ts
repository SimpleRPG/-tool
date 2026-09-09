// Miki AI Autonomous Test Play & Combat Simulation Engine
// Used exclusively for testing SimpleRPG game code & balance (NO LLM, Pure Monte-Carlo)

import { SimpleRpgFile, MikiAiTestRunResult } from "../types";
import { MikiMemoryService } from "./mikiMemoryService";
import { SimpleRpgScanner, ScannedEnemy, ScannedWeapon } from "./simpleRpgScanner";

export class MikiAiTestRunner {
  static runSimulation(
    files: SimpleRpgFile[],
    selectedEnemyIdOrScenario: string = "slime",
    trials: number = 200,
    selectedWeaponId?: string
  ): MikiAiTestRunResult {
    const scanReport = SimpleRpgScanner.scanProject(files);

    // Resolve Target Enemy from scanned project files
    let targetEnemy: ScannedEnemy | undefined = scanReport.enemies.find(
      (e) => e.id === selectedEnemyIdOrScenario || e.name === selectedEnemyIdOrScenario
    );

    if (!targetEnemy) {
      if (selectedEnemyIdOrScenario === "slime_early_game" || selectedEnemyIdOrScenario === "slime") {
        targetEnemy = scanReport.enemies.find((e) => e.id.toLowerCase().includes("slime")) || scanReport.enemies[0];
      } else if (selectedEnemyIdOrScenario === "dungeon_endurance") {
        targetEnemy =
          scanReport.enemies.find((e) => e.id.includes("drake") || e.id.includes("skeleton")) ||
          scanReport.enemies[1] ||
          scanReport.enemies[0];
      } else if (selectedEnemyIdOrScenario === "boss_end_game") {
        targetEnemy =
          scanReport.enemies.find((e) => e.id.includes("demon") || e.id.includes("boss") || e.id.includes("drake")) ||
          scanReport.enemies[scanReport.enemies.length - 1];
      } else if (scanReport.enemies.length > 0) {
        targetEnemy = scanReport.enemies[0];
      }
    }

    const enemyName = targetEnemy ? targetEnemy.name : "みどりスライム";
    const enemyHp = targetEnemy ? targetEnemy.hp : 25;
    const enemyAtk = targetEnemy ? targetEnemy.atk : 6;
    const enemyDef = targetEnemy ? targetEnemy.def : 2;

    // Resolve Player Weapon from scanned project files
    let targetWeapon: ScannedWeapon | undefined;
    if (selectedWeaponId) {
      targetWeapon = scanReport.weapons.find((w) => w.id === selectedWeaponId || w.name === selectedWeaponId);
    }
    if (!targetWeapon) {
      // Auto-select weapon suitable for encounter if not specified
      if (enemyHp >= 400 && scanReport.weapons.length > 1) {
        targetWeapon = scanReport.weapons[scanReport.weapons.length - 1];
      } else if (enemyHp >= 150 && scanReport.weapons.length > 2) {
        targetWeapon = scanReport.weapons[Math.floor(scanReport.weapons.length / 2)];
      } else {
        targetWeapon = scanReport.weapons[0] || { id: "wooden_stick", name: "ひのきの棒", atk: 3, sourceFile: "combat-equip-data.js" };
      }
    }

    const weaponName = targetWeapon.name;
    const playerAtk = targetWeapon.atk;
    const playerDef = scanReport.armors.length > 0 ? scanReport.armors[0].def : 5;
    const playerHpMax = Math.max(80, scanReport.player.hp || 80);

    // Check crit multiplier and damage formulas from game-core-1.js / game-ui.js
    let critMultiplier = 1.8;
    const coreFile = files.find((f) => f.path.includes("game-core") || f.path.includes("game-ui"));
    if (coreFile) {
      if (coreFile.content.includes("3.5") || coreFile.content.includes("Math.floor(dmg * 3.5)")) {
        critMultiplier = 3.5;
      } else if (coreFile.content.includes("2.5")) {
        critMultiplier = 2.5;
      }
    }

    // Simulation loop
    let playerWins = 0;
    let totalTurns = 0;
    let totalDmgDealt = 0;
    let totalDmgTaken = 0;
    let totalItemsUsed = 0;
    const logSnippet: string[] = [];

    for (let i = 0; i < trials; i++) {
      let pHp = playerHpMax;
      let eHp = enemyHp;
      let turns = 0;
      let itemsUsed = 0;

      while (pHp > 0 && eHp > 0 && turns < 60) {
        turns++;

        // Player turn
        const isCrit = Math.random() < 0.15;
        let pDmg = Math.max(1, Math.floor(playerAtk * 1.5 - enemyDef * 0.7));
        if (isCrit) pDmg = Math.floor(pDmg * critMultiplier);
        eHp -= pDmg;
        totalDmgDealt += pDmg;

        if (eHp <= 0) {
          playerWins++;
          if (i === 0) {
            logSnippet.push(`Turn ${turns}: プレイヤーの会心攻撃！ [${enemyName}] に ${pDmg} ダメージを与えて撃破！`);
          }
          break;
        }

        // Auto item heal if HP is below 25%
        if (pHp < playerHpMax * 0.25) {
          pHp += 40;
          itemsUsed++;
          totalItemsUsed++;
          if (i === 0) {
            logSnippet.push(`Turn ${turns}: [ミキAI行動] やくそうを使用し HP +40 (残HP: ${pHp})`);
          }
        }

        // Enemy turn
        const eDmg = Math.max(1, Math.floor(enemyAtk * 1.4 - playerDef * 0.6));
        pHp -= eDmg;
        totalDmgTaken += eDmg;

        if (i === 0 && turns <= 3) {
          logSnippet.push(`Turn ${turns}: [${enemyName}] の攻撃！ プレイヤーに ${eDmg} ダメージ (残HP: ${Math.max(0, pHp)})`);
        }
      }
      totalTurns += turns;
    }

    const winRate = Math.round((playerWins / trials) * 100);
    const avgTurns = +(totalTurns / trials).toFixed(1);
    const avgDamageDealt = Math.round(totalDmgDealt / trials);
    const avgDamageTaken = Math.round(totalDmgTaken / trials);
    const itemConsumptionRate = +(totalItemsUsed / trials).toFixed(1);

    // Evaluate Balance
    let balanceRating: "PERFECT" | "SLIGHTLY_HARD" | "SLIGHTLY_EASY" | "TOO_BRUTAL" | "TOO_TRIVIAL" = "PERFECT";
    const mikiAiFeedback: string[] = [];

    if (winRate >= 99 && avgTurns <= 2) {
      balanceRating = "TOO_TRIVIAL";
      mikiAiFeedback.push(`⚠️ プレイヤーの火力が過剰です (平均${avgTurns}ターンで撃破)。戦闘の緊張感が失われています。`);
      mikiAiFeedback.push(`モンスターのHPを上げるか、武器攻撃力を見直すことを推奨します。`);
    } else if (winRate >= 80 && winRate <= 95) {
      balanceRating = "PERFECT";
      mikiAiFeedback.push(`✅ 理想的なゲームバランスです。平均ターン数は${avgTurns}、適度な被ダメージ（平均${avgDamageTaken}）が生じています。`);
      mikiAiFeedback.push(`回復薬の消費率も平均${itemConsumptionRate}個と経済的循環が保たれています。`);
    } else if (winRate >= 50 && winRate < 80) {
      balanceRating = "SLIGHTLY_HARD";
      mikiAiFeedback.push(`⚔️ やや難易度が高めです（勝率${winRate}%）。ボス戦としては良好ですが、通常戦の場合は防具防御力の補正が望ましいです。`);
    } else if (winRate < 50) {
      balanceRating = "TOO_BRUTAL";
      mikiAiFeedback.push(`🚨 プレイヤー死亡率が過半数を超えています（勝率${winRate}%）。敵の攻撃力またはHPが高すぎます。`);
      mikiAiFeedback.push(`「スライム弱体化」または「武器強化」レシピの適用をおすすめします。`);
    } else {
      balanceRating = "SLIGHTLY_EASY";
      mikiAiFeedback.push(`💡 安定した攻略が可能です（勝率${winRate}%）。サクサク進めたいユーザー向けです。`);
    }

    const result: MikiAiTestRunResult = {
      id: `test_${Date.now()}`,
      timestamp: Date.now(),
      scenario: `${enemyName} vs ${weaponName} (${trials}戦)`,
      totalSimulations: trials,
      playerWinRate: winRate,
      avgDamageDealt,
      avgDamageTaken,
      avgTurns,
      itemConsumptionRate,
      balanceRating,
      mikiAiFeedback,
      logSnippet,
    };

    // Auto-record to Miki AI Long-term Memory
    MikiMemoryService.addMemory({
      type: "test_play",
      title: `ミキAI テストプレイ: ${result.scenario}`,
      description: `勝率: ${winRate}%, 平均ターン: ${avgTurns}, 評価: [${balanceRating}]`,
      importance: winRate < 50 || winRate > 98 ? 4 : 3,
      affectedFiles: [targetEnemy?.sourceFile || "enemy-data.js", targetWeapon?.sourceFile || "combat-equip-data.js"],
      testMetrics: {
        winRate,
        avgTurns,
        balanceScore: winRate >= 80 && winRate <= 95 ? 95 : 70,
      },
      tags: ["ミキAI", "戦闘テスト", balanceRating],
    });

    return result;
  }
}
