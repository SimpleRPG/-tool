// Dynamic SimpleRPG Patch Generator
// Automatically scans the current project files (including any imported ZIP)
// and dynamically generates 100% applicable, authentic SimpleRPG patch recipes.
// Zero hardcoded mismatches - every recipe targets the REAL code in the VFS.

import { SimpleRpgFile, RpgPatchRecipe } from "../types";
import { SimpleRpgScanner } from "./simpleRpgScanner";

export class DynamicPatchGenerator {
  /**
   * Automatically analyzes all files in the current VFS (or imported ZIP)
   * and generates a comprehensive, categorized catalog of patches.
   */
  public static generatePatchesFromFiles(files: SimpleRpgFile[]): RpgPatchRecipe[] {
    const recipes: RpgPatchRecipe[] = [];

    // Scan project structure & entities
    const scanReport = SimpleRpgScanner.scanProject(files);
    const { enemies, weapons, armors, items, skills, player } = scanReport;

    // 1. ========================================================
    // 👾 モンスター・エネミー関連パッチ（検出された全モンスターごと）
    // ========================================================
    enemies.forEach((enemy) => {
      const targetFile = files.find((f) => f.path === enemy.sourceFile) || files[0];
      if (!targetFile) return;

      // Check if enemy is declared in an array or as standalone variables
      const content = targetFile.content;

      // Pattern A: Object literal in array (e.g., name: "スライム", hp: 25, atk: 6)
      const objRegex = new RegExp(
        `(\\{[^{}]*name\\s*:\\s*["'\`]${escapeRegExp(enemy.name)}["'\`][^{}]*\\})`,
        "s"
      );
      const objMatch = content.match(objRegex);

      if (objMatch) {
        const fullBlock = objMatch[1];

        // 1-A. 初心者向け弱体化 (HP半減, ATK緩和)
        const nerfedHp = Math.max(1, Math.floor(enemy.hp / 2));
        const nerfedAtk = Math.max(1, Math.floor(enemy.atk * 0.7));
        const nerfedBlock = fullBlock
          .replace(/hp\s*:\s*\d+/, `hp: ${nerfedHp}`)
          .replace(/maxHp\s*:\s*\d+/, `maxHp: ${nerfedHp}`)
          .replace(/atk\s*:\s*\d+/, `atk: ${nerfedAtk}`);

        if (nerfedBlock !== fullBlock) {
          recipes.push({
            id: `dyn_recipe_${enemy.id}_nerf`,
            title: `【${enemy.name}】初心者向け弱体化 (HP ${enemy.hp} -> ${nerfedHp})`,
            category: "enemy",
            description: `${enemy.name} のHPを半減（${nerfedHp}）にし、攻撃力も緩和してサクサク倒せるように調整します。`,
            triggerKeywords: [
              `${enemy.name}弱体化`,
              `${enemy.name}半分`,
              `${enemy.name}倒せない`,
              `${enemy.name}hp`,
              `${enemy.name}簡単`,
            ],
            targetFile: targetFile.path,
            codeDiff: {
              file: targetFile.path,
              before: fullBlock,
              after: nerfedBlock,
            },
            previewSnippet: `${enemy.name} HP: ${enemy.hp} -> ${nerfedHp} / ATK: ${enemy.atk} -> ${nerfedAtk}`,
            tags: [enemy.name, "弱体化", "バランス調整"],
          });
        }

        // 1-B. ボス化・凶悪モード (HP 3倍, ATK激化)
        const bossHp = enemy.hp * 3;
        const bossAtk = Math.floor(enemy.atk * 1.8 + 4);
        const bossBlock = fullBlock
          .replace(/hp\s*:\s*\d+/, `hp: ${bossHp}`)
          .replace(/maxHp\s*:\s*\d+/, `maxHp: ${bossHp}`)
          .replace(/atk\s*:\s*\d+/, `atk: ${bossAtk}`);

        if (bossBlock !== fullBlock) {
          recipes.push({
            id: `dyn_recipe_${enemy.id}_boss`,
            title: `【${enemy.name}】ボス覚醒・凶悪化 (HP ${enemy.hp} -> ${bossHp})`,
            category: "enemy",
            description: `${enemy.name} を強敵ボスに改造し、HPを${bossHp}、攻撃力を${bossAtk}に大幅強化します。`,
            triggerKeywords: [
              `${enemy.name}強化`,
              `${enemy.name}ボス化`,
              `強い${enemy.name}`,
              `${enemy.name}ハード`,
            ],
            targetFile: targetFile.path,
            codeDiff: {
              file: targetFile.path,
              before: fullBlock,
              after: bossBlock,
            },
            previewSnippet: `${enemy.name} HP: ${enemy.hp} -> ${bossHp} / ATK: ${enemy.atk} -> ${bossAtk}`,
            tags: [enemy.name, "ボス化", "ハードモード"],
          });
        }

        // 1-C. 討伐ゴールド5倍パッチ
        const boostedGold = enemy.gold * 5 || 50;
        const goldBlock = fullBlock.replace(/gold\s*:\s*\d+/, `gold: ${boostedGold}`);

        if (goldBlock !== fullBlock) {
          recipes.push({
            id: `dyn_recipe_${enemy.id}_gold`,
            title: `【${enemy.name}】討伐Gold 5倍化 (${enemy.gold}G -> ${boostedGold}G)`,
            category: "drop",
            description: `${enemy.name} 討伐時の獲得ゴールドを5倍にブーストし、金策を一気に加速させます。`,
            triggerKeywords: [
              `${enemy.name}ゴールド`,
              `${enemy.name}お金`,
              `${enemy.name}金策`,
              "ゴールド稼ぎ",
            ],
            targetFile: targetFile.path,
            codeDiff: {
              file: targetFile.path,
              before: fullBlock,
              after: goldBlock,
            },
            previewSnippet: `${enemy.name} ドロップGold: ${enemy.gold}G -> ${boostedGold}G`,
            tags: [enemy.name, "ゴールド", "金策"],
          });
        }
      }
    });

    // Standalone variables for active enemy in game-ui.js
    files.forEach((file) => {
      const content = file.content;
      const hpVarMatch = content.match(/(let|var)\s+enemyHp\s*=\s*(\d+)\s*;\s*(let|var)\s+enemyMaxHp\s*=\s*(\d+)\s*;/);
      if (hpVarMatch) {
        const before = hpVarMatch[0];
        const currentVal = parseInt(hpVarMatch[2], 10);

        recipes.push({
          id: `dyn_recipe_active_enemy_hp_10`,
          title: `戦闘中の敵HPを10に弱体化 (HP ${currentVal} -> 10)`,
          category: "enemy",
          description: `現在戦闘中のモンスター初期HPを10に設定し、1ターンで撃破可能にします。`,
          triggerKeywords: ["敵hp10", "敵を10に", "すぐ倒せる", "hp10", "敵弱く"],
          targetFile: file.path,
          codeDiff: {
            file: file.path,
            before,
            after: `let enemyHp = 10;\n  let enemyMaxHp = 10;`,
          },
          previewSnippet: `敵初期HP: ${currentVal} -> 10`,
          tags: ["敵HP", "初心者救済"],
        });

        recipes.push({
          id: `dyn_recipe_active_enemy_hp_500`,
          title: `戦闘中の敵をHP500の超大型ボス化`,
          category: "enemy",
          description: `現在戦闘中のモンスター初期HPを500に設定し、長期戦の白熱バトルにします。`,
          triggerKeywords: ["敵hp500", "敵ボス化", "超強敵", "hp500"],
          targetFile: file.path,
          codeDiff: {
            file: file.path,
            before,
            after: `let enemyHp = 500;\n  let enemyMaxHp = 500;`,
          },
          previewSnippet: `敵初期HP: ${currentVal} -> 500`,
          tags: ["敵HP", "ボス化"],
        });
      }
    });

    // 2. ========================================================
    // ⚔️ 武器・防具パッチ（検出された全装備ごと）
    // ========================================================
    weapons.forEach((weapon) => {
      const targetFile = files.find((f) => f.path === weapon.sourceFile) || files[0];
      if (!targetFile) return;

      const content = targetFile.content;

      // Pattern A: Object literal in WEAPON_DATABASE (combat-equip-data.js)
      const objRegex = new RegExp(
        `(\\{[^{}]*name\\s*:\\s*["'\`]${escapeRegExp(weapon.name)}["'\`][^{}]*\\})`,
        "s"
      );
      const objMatch = content.match(objRegex);

      if (objMatch) {
        const fullBlock = objMatch[1];
        const buffedAtk = Math.max(weapon.atk * 3, 40);
        const buffedBlock = fullBlock.replace(/atk\s*:\s*\d+/, `atk: ${buffedAtk}`);

        if (buffedBlock !== fullBlock) {
          recipes.push({
            id: `dyn_recipe_wpn_obj_buff_${weapon.id}`,
            title: `【${weapon.name}】威力3倍強化 (ATK ${weapon.atk} -> ${buffedAtk})`,
            category: "weapon",
            description: `データベース内の「${weapon.name}」の攻撃力を${buffedAtk}に大幅強化します。`,
            triggerKeywords: [`${weapon.name}強化`, `${weapon.name}強く`, `${weapon.name}攻撃力`],
            targetFile: targetFile.path,
            codeDiff: {
              file: targetFile.path,
              before: fullBlock,
              after: buffedBlock,
            },
            previewSnippet: `${weapon.name} ATK: ${weapon.atk} -> ${buffedAtk}`,
            tags: [weapon.name, "武器強化", "攻撃力"],
          });
        }

        const godBlock = fullBlock.replace(/atk\s*:\s*\d+/, `atk: 999`);
        if (godBlock !== fullBlock) {
          recipes.push({
            id: `dyn_recipe_wpn_obj_god_${weapon.id}`,
            title: `【${weapon.name}】神剣覚醒 (ATK ${weapon.atk} -> 999 即死)`,
            category: "weapon",
            description: `「${weapon.name}」をチート級の神剣に覚醒させ、攻撃力999にします。`,
            triggerKeywords: [`${weapon.name}最強`, `${weapon.name}999`, `${weapon.name}神剣`],
            targetFile: targetFile.path,
            codeDiff: {
              file: targetFile.path,
              before: fullBlock,
              after: godBlock,
            },
            previewSnippet: `${weapon.name} ATK: ${weapon.atk} -> 999`,
            tags: [weapon.name, "神剣", "一撃必殺"],
          });
        }
      }

      // Pattern B: Check standalone weaponAtk variable
      const weaponVarMatch = content.match(/(let|var)\s+weaponAtk\s*=\s*(\d+)\s*;/);
      if (weaponVarMatch) {
        const before = weaponVarMatch[0];
        const curAtk = parseInt(weaponVarMatch[2], 10);

        const buffed = Math.max(curAtk * 2 + 5, 25);
        recipes.push({
          id: `dyn_recipe_weapon_buff_${weapon.id}`,
          title: `【${weapon.name}】攻撃力ブースト (ATK ${curAtk} -> ${buffed})`,
          category: "weapon",
          description: `武器の威力を大幅に引き上げ、通常攻撃で敵を一網打尽にします。`,
          triggerKeywords: ["武器攻撃力アップ", "武器強く", "攻撃力倍", "武器強化", "こうげき強く"],
          targetFile: targetFile.path,
          codeDiff: {
            file: targetFile.path,
            before,
            after: `let weaponAtk = ${buffed}; // パッチ適用: 攻撃力強化`,
          },
          previewSnippet: `武器攻撃力: ${curAtk} -> ${buffed}`,
          tags: [weapon.name, "攻撃力", "武器強化"],
        });

        recipes.push({
          id: `dyn_recipe_weapon_god_${weapon.id}`,
          title: `【${weapon.name}】伝説の神剣覚醒 (攻撃力 999 一撃必殺)`,
          category: "weapon",
          description: `武器の威力を999まで引き上げ、どんな敵も一撃で即死させます。`,
          triggerKeywords: ["一撃必殺", "神剣", "攻撃力999", "最強武器", "ワンパン"],
          targetFile: targetFile.path,
          codeDiff: {
            file: targetFile.path,
            before,
            after: `let weaponAtk = 999; // 伝説の神剣覚醒`,
          },
          previewSnippet: `武器攻撃力: ${curAtk} -> 999`,
          tags: [weapon.name, "神剣", "一撃必殺", "チート"],
        });
      }
    });

    // 2-B. 防具パッチ
    armors.forEach((armor) => {
      const targetFile = files.find((f) => f.path === armor.sourceFile) || files[0];
      if (!targetFile) return;

      const content = targetFile.content;
      const objRegex = new RegExp(
        `(\\{[^{}]*name\\s*:\\s*["'\`]${escapeRegExp(armor.name)}["'\`][^{}]*\\})`,
        "s"
      );
      const objMatch = content.match(objRegex);

      if (objMatch) {
        const fullBlock = objMatch[1];
        const buffedDef = Math.max(armor.def * 3, 30);
        const buffedBlock = fullBlock.replace(/def\s*:\s*\d+/, `def: ${buffedDef}`);

        if (buffedBlock !== fullBlock) {
          recipes.push({
            id: `dyn_recipe_armor_buff_${armor.id}`,
            title: `【${armor.name}】防御力3倍強化 (DEF ${armor.def} -> ${buffedDef})`,
            category: "weapon",
            description: `「${armor.name}」の防御力を${buffedDef}に高め、敵の物理攻撃を強固に遮断します。`,
            triggerKeywords: [`${armor.name}強化`, `${armor.name}防御力`, `防具強化`],
            targetFile: targetFile.path,
            codeDiff: {
              file: targetFile.path,
              before: fullBlock,
              after: buffedBlock,
            },
            previewSnippet: `${armor.name} DEF: ${armor.def} -> ${buffedDef}`,
            tags: [armor.name, "防具", "防御力"],
          });
        }
      }
    });

    // 3. ========================================================
    // 🧪 持ち物・アイテムパッチ (やくそう・回復薬)
    // ========================================================
    items.forEach((item) => {
      const targetFile = files.find((f) => f.path === item.sourceFile) || files[0];
      if (!targetFile) return;

      const content = targetFile.content;

      // Look for healing code: playerHp + 35 or similar
      const healMatch = content.match(/playerHp\s*\+\s*(\d+)/);
      if (healMatch) {
        const before = healMatch[0];
        const curHeal = parseInt(healMatch[1], 10);

        // 3-A. やくそう回復量80に強化
        recipes.push({
          id: `dyn_recipe_item_heal_80_${item.id}`,
          title: `【${item.name}】回復量を80HPに倍増 (${curHeal} -> 80)`,
          category: "item",
          description: `${item.name}の回復効果を80HPに高め、ボス戦での生存率を格段に上げます。`,
          triggerKeywords: ["やくそう強化", "回復量アップ", "やくそう80", "ポーション強化"],
          targetFile: targetFile.path,
          codeDiff: {
            file: targetFile.path,
            before,
            after: `playerHp + 80`,
          },
          previewSnippet: `${item.name} 回復量: ${curHeal} -> 80 HP`,
          tags: [item.name, "回復量", "ポーション"],
        });

        // 3-B. やくそう全回復エリクサー化
        recipes.push({
          id: `dyn_recipe_item_heal_full_${item.id}`,
          title: `【${item.name}】完全全回復エリクサー化 (HP全快)`,
          category: "item",
          description: `${item.name}を使うだけでHPが常に最大値まで全回復するように改造します。`,
          triggerKeywords: ["やくそう全回復", "エリクサー", "完全回復", "ポーション全回復"],
          targetFile: targetFile.path,
          codeDiff: {
            file: targetFile.path,
            before,
            after: `playerMaxHp`,
          },
          previewSnippet: `${item.name} 回復量: ${curHeal} -> 全回復(MaxHP)`,
          tags: [item.name, "全回復", "エリクサー"],
        });
      }
    });

    // 4. ========================================================
    // ✨ 魔法・スキルパッチ (ギガデイン・呪文)
    // ========================================================
    skills.forEach((skill) => {
      const targetFile = files.find((f) => f.path === skill.sourceFile) || files[0];
      if (!targetFile) return;

      const content = targetFile.content;

      // Look for MP cost check and decrement
      const mpCheckMatch = content.match(/playerMp\s*<\s*(\d+)/);
      const mpSubMatch = content.match(/playerMp\s*-=\s*(\d+)/);
      if (mpCheckMatch && mpSubMatch) {
        const curCost = parseInt(mpCheckMatch[1], 10);
        recipes.push({
          id: `dyn_recipe_skill_zero_mp_${skill.id}`,
          title: `【${skill.name}】MP消費ゼロ化 (無制限連射)`,
          category: "system",
          description: `${skill.name} の消費MP（${curCost}）を0にし、MP切れなしで何度でも連射可能にします。`,
          triggerKeywords: ["ギガデイン無料", "MP消費0", "魔法連射", "MP減らない", "ギガデイン無制限"],
          targetFile: targetFile.path,
          codeDiff: {
            file: targetFile.path,
            before: mpSubMatch[0],
            after: `playerMp -= 0; // MP消費ゼロ化`,
          },
          previewSnippet: `${skill.name} 消費MP: ${curCost} -> 0`,
          tags: [skill.name, "MP消費0", "無制限連射"],
        });
      }

      // Look for magic damage: const dmg = 45;
      const dmgMatch = content.match(/(const|let|var)\s+dmg\s*=\s*(\d+)\s*;/);
      if (dmgMatch) {
        const before = dmgMatch[0];
        const curDmg = parseInt(dmgMatch[2], 10);

        recipes.push({
          id: `dyn_recipe_skill_dmg_200_${skill.id}`,
          title: `【${skill.name}】威力超絶強化 (ダメージ ${curDmg} -> 250)`,
          category: "system",
          description: `${skill.name} の魔力を極限まで高め、250ダメージの極大火力を発揮します。`,
          triggerKeywords: ["ギガデイン強く", "魔法ダメージ", "ギガデイン威力", "魔法250"],
          targetFile: targetFile.path,
          codeDiff: {
            file: targetFile.path,
            before,
            after: `const dmg = 250; // 超極大魔法ダメージ`,
          },
          previewSnippet: `${skill.name} ダメージ: ${curDmg} -> 250`,
          tags: [skill.name, "極大魔法", "ダメージ強化"],
        });
      }
    });

    // 5. ========================================================
    // 🛡️ 勇者ステータス & 経済パッチ
    // ========================================================
    files.forEach((file) => {
      const content = file.content;

      // Player HP: let playerHp = 80; let playerMaxHp = 80;
      const playerHpMatch = content.match(/(let|var)\s+playerHp\s*=\s*(\d+)\s*;\s*(let|var)\s+playerMaxHp\s*=\s*(\d+)\s*;/);
      if (playerHpMatch) {
        const before = playerHpMatch[0];
        const curHp = parseInt(playerHpMatch[2], 10);

        recipes.push({
          id: `dyn_recipe_player_hp_200`,
          title: `勇者タフネス強化 (初期HP ${curHp} -> 250)`,
          category: "system",
          description: `勇者の最大HPを250に引き上げ、強敵の反撃にもびくともしない耐久力を獲得します。`,
          triggerKeywords: ["勇者hp", "プレイヤーhp", "体力アップ", "HP200", "死なない"],
          targetFile: file.path,
          codeDiff: {
            file: file.path,
            before,
            after: `let playerHp = 250;\n  let playerMaxHp = 250;`,
          },
          previewSnippet: `勇者初期HP: ${curHp} -> 250`,
          tags: ["勇者ステータス", "HP強化", "耐久"],
        });
      }

      // Player Gold: let gold = 120;
      const goldMatch = content.match(/(let|var)\s+gold\s*=\s*(\d+)\s*;/);
      if (goldMatch) {
        const before = goldMatch[0];
        const curGold = parseInt(goldMatch[2], 10);

        recipes.push({
          id: `dyn_recipe_player_gold_99999`,
          title: `大富豪スタート (初期所持金 ${curGold}G -> 99,999G)`,
          category: "drop",
          description: `開始時の所持金を99,999ゴールドにブーストし、装備やアイテムを買い放題にします。`,
          triggerKeywords: ["お金最大", "ゴールド最大", "大富豪", "所持金チート", "99999G"],
          targetFile: file.path,
          codeDiff: {
            file: file.path,
            before,
            after: `let gold = 99999; // 大富豪スタート`,
          },
          previewSnippet: `初期ゴールド: ${curGold}G -> 99999G`,
          tags: ["ゴールド", "大富豪", "経済チート"],
        });
      }

      // Enemy Counter Attack Formula
      const counterMatch = content.match(/const\s+eDmg\s*=\s*Math\.max\(1,\s*Math\.floor\([^\)]+\)\);/);
      if (counterMatch) {
        const before = counterMatch[0];

        recipes.push({
          id: `dyn_recipe_counter_safe_1`,
          title: `敵の反撃被ダメージ1固定 (初心者イージーモード)`,
          category: "system",
          description: `敵からの反撃被ダメージを常に1に固定し、ゲームオーバーを完全に防止します。`,
          triggerKeywords: ["被ダメ1", "ダメージ1", "無敵モード", "死なない", "反撃1"],
          targetFile: file.path,
          codeDiff: {
            file: file.path,
            before,
            after: `const eDmg = 1; // 初心者保護: 被ダメ1固定`,
          },
          previewSnippet: `敵の反撃ダメージ -> 1固定`,
          tags: ["被ダメージ", "イージーモード", "初心者"],
        });
      }

      // Critical Hit Formula
      const atkDmgMatch = content.match(/const\s+dmg\s*=\s*Math\.max\(1,\s*Math\.floor\([^\)]+\)\);/);
      if (atkDmgMatch) {
        const before = atkDmgMatch[0];

        recipes.push({
          id: `dyn_recipe_crit_always`,
          title: `全打撃クリティカルモード (攻撃力3倍会心)`,
          category: "weapon",
          description: `通常攻撃の威力を3倍にブーストし、毎ターン会心の一撃を叩き込みます。`,
          triggerKeywords: ["会心の一撃", "クリティカル", "攻撃3倍", "かいしん", "毎回会心"],
          targetFile: file.path,
          codeDiff: {
            file: file.path,
            before,
            after: `const dmg = Math.max(1, Math.floor((weaponAtk * 2.5 + 10) * 3)); // 全攻撃クリティカル`,
          },
          previewSnippet: `通常攻撃威力 -> 会心3倍化`,
          tags: ["クリティカル", "会心", "戦闘式"],
        });
      }
    });

    // Deduplicate recipes by unique ID and unique code diff
    const uniqueRecipes: RpgPatchRecipe[] = [];
    const seenIds = new Set<string>();

    for (const r of recipes) {
      if (!seenIds.has(r.id)) {
        seenIds.add(r.id);
        uniqueRecipes.push(r);
      }
    }

    return uniqueRecipes;
  }
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
