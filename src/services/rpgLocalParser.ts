// 0.001s Local Zero-Latency Parser & Recipe Registry for SimpleRPG
// 100% Offline Rule-Based AST Engine (NO LLM, Microsecond Execution)
// 100% Focused on SimpleRPG Game Mechanics (Enemy, Weapon, Armor, Items, Skills, Stats)

import { RpgPatchRecipe, RpgParseResult, CodeDiffBlock, SimpleRpgFile } from "../types";
import { DynamicPatchGenerator } from "./dynamicPatchGenerator";

export const RPG_BUILTIN_RECIPES: RpgPatchRecipe[] = [
  // ========================================================
  // 👾 しんぷるRPG モンスター・エネミー関連
  // ========================================================
  {
    id: "recipe_slime_hp_10",
    title: "スライム初心者向け緩和 (HP 25 -> 10)",
    category: "enemy",
    description: "みどりスライムのHPを25から10に下げ、序盤をサクサク攻略できるようにします。",
    triggerKeywords: ["スライム弱体化", "スライム半分", "スライムのhp", "初心者向けスライム", "スライムhp10", "スライム10"],
    targetFile: "game-ui.js",
    codeDiff: {
      file: "game-ui.js",
      before: `let enemyHp = 25;\n  let enemyMaxHp = 25;`,
      after: `let enemyHp = 10;\n  let enemyMaxHp = 10;`,
    },
    previewSnippet: "みどりスライム HP: 25 -> 10",
    tags: ["スライム", "敵HP", "バランス"],
  },
  {
    id: "recipe_slime_boss",
    title: "スライム暴走・ボス化 (HP 25 -> 150)",
    category: "enemy",
    description: "みどりスライムを序盤の強敵ボス化させ、HPを150に大幅強化します。",
    triggerKeywords: ["スライム強化", "強いスライム", "ギガスライム", "スライムボス化", "スライムhp150"],
    targetFile: "game-ui.js",
    codeDiff: {
      file: "game-ui.js",
      before: `let enemyHp = 25;\n  let enemyMaxHp = 25;`,
      after: `let enemyHp = 150;\n  let enemyMaxHp = 150;`,
    },
    previewSnippet: "みどりスライム HP: 25 -> 150",
    tags: ["スライム", "ハードモード", "強敵"],
  },
  {
    id: "recipe_enemy_counter_1",
    title: "敵の反撃ダメージ1固定 (初心者モード)",
    category: "enemy",
    description: "敵からの反撃被ダメージを1に固定し、ゲームオーバーを防止します。",
    triggerKeywords: ["反撃1", "被ダメ1", "ダメージ1", "敵弱体化", "敵の攻撃弱く"],
    targetFile: "game-ui.js",
    codeDiff: {
      file: "game-ui.js",
      before: `const eDmg = Math.max(1, Math.floor(4 + Math.random() * 3));`,
      after: `const eDmg = 1; // 初心者保護: 被ダメージ1固定`,
    },
    previewSnippet: "敵の反撃ダメージ: 4~6 -> 1固定",
    tags: ["反撃", "初心者", "防御"],
  },
  {
    id: "recipe_enemy_counter_heavy",
    title: "敵の反撃激化 (被ダメージ 15~20)",
    category: "enemy",
    description: "敵の反撃火力を引き上げ、緊迫した死闘を演出します。",
    triggerKeywords: ["反撃痛い", "敵強く", "敵攻撃力アップ", "ハードモード敵"],
    targetFile: "game-ui.js",
    codeDiff: {
      file: "game-ui.js",
      before: `const eDmg = Math.max(1, Math.floor(4 + Math.random() * 3));`,
      after: `const eDmg = Math.max(1, Math.floor(15 + Math.random() * 6)); // 激化反撃`,
    },
    previewSnippet: "敵の反撃ダメージ: 4~6 -> 15~20",
    tags: ["敵攻撃", "ハードモード"],
  },
  {
    id: "recipe_switch_goblin",
    title: "敵切り替え: ゴブリン戦士 (HP 55 / 報酬18G)",
    category: "enemy",
    description: "出現モンスターを森の魔物「ゴブリン戦士」に切り替えます。",
    triggerKeywords: ["ゴブリン", "ゴブリン戦士", "敵変更ゴブリン", "ゴブリン出現"],
    targetFile: "game-ui.js",
    codeDiff: {
      file: "game-ui.js",
      before: `let enemyName = "みどりスライム";\n  let enemyHp = 25;\n  let enemyMaxHp = 25;`,
      after: `let enemyName = "ゴブリン戦士";\n  let enemyHp = 55;\n  let enemyMaxHp = 55;`,
    },
    previewSnippet: "出現敵: ゴブリン戦士 (HP: 55)",
    tags: ["敵切り替え", "ゴブリン"],
  },
  {
    id: "recipe_switch_skeleton",
    title: "敵切り替え: スケルトンナイト (HP 95 / 報酬40G)",
    category: "enemy",
    description: "出現モンスターを盾を持つ亡骸兵士「スケルトンナイト」に切り替えます。",
    triggerKeywords: ["スケルトン", "スケルトンナイト", "ガイコツ", "敵変更スケルトン"],
    targetFile: "game-ui.js",
    codeDiff: {
      file: "game-ui.js",
      before: `let enemyName = "みどりスライム";\n  let enemyHp = 25;\n  let enemyMaxHp = 25;`,
      after: `let enemyName = "スケルトンナイト";\n  let enemyHp = 95;\n  let enemyMaxHp = 95;`,
    },
    previewSnippet: "出現敵: スケルトンナイト (HP: 95)",
    tags: ["敵切り替え", "スケルトン"],
  },
  {
    id: "recipe_switch_dragon",
    title: "敵切り替え: 火竜ファイア・ドレイク (HP 280 / 中ボス)",
    category: "enemy",
    description: "中ボスクラスの大型魔獣「火竜ファイア・ドレイク」を出現させます。",
    triggerKeywords: ["火竜", "ドラゴン", "中ボス出現", "ドレイク"],
    targetFile: "game-ui.js",
    codeDiff: {
      file: "game-ui.js",
      before: `let enemyName = "みどりスライム";\n  let enemyHp = 25;\n  let enemyMaxHp = 25;`,
      after: `let enemyName = "火竜ファイア・ドレイク";\n  let enemyHp = 280;\n  let enemyMaxHp = 280;`,
    },
    previewSnippet: "出現敵: 火竜ファイア・ドレイク (HP: 280)",
    tags: ["中ボス", "火竜"],
  },
  {
    id: "recipe_switch_demon_king",
    title: "敵切り替え: 冥王デスロード (HP 650 / 最終ボス)",
    category: "enemy",
    description: "しんぷるRPGの最終支配者「冥王デスロード」を直ちに出現させます。",
    triggerKeywords: ["冥王", "ラスボス出現", "デスロード", "ボスバトル"],
    targetFile: "game-ui.js",
    codeDiff: {
      file: "game-ui.js",
      before: `let enemyName = "みどりスライム";\n  let enemyHp = 25;\n  let enemyMaxHp = 25;`,
      after: `let enemyName = "冥王デスロード (BOSS)";\n  let enemyHp = 650;\n  let enemyMaxHp = 650;`,
    },
    previewSnippet: "出現敵: 冥王デスロード (HP: 650)",
    tags: ["最終ボス", "冥王"],
  },
  {
    id: "recipe_gold_reward_50",
    title: "敵撃破ゴールド10倍化 (5G -> 50G)",
    category: "drop",
    description: "モンスター討伐時の獲得ゴールドを10倍に増やし、アイテム購入を快適にします。",
    triggerKeywords: ["ゴールド10倍", "お金10倍", "獲得ゴールド", "報酬アップ", "金策"],
    targetFile: "game-ui.js",
    codeDiff: {
      file: "game-ui.js",
      before: `gold += 5;`,
      after: `gold += 50; // 10倍ゴールド獲得`,
    },
    previewSnippet: "討伐報酬ゴールド: 5G -> 50G",
    tags: ["ゴールド", "報酬", "経済"],
  },

  // ========================================================
  // ⚔️ しんぷるRPG 武器・こうげき関連
  // ========================================================
  {
    id: "recipe_weapon_atk_10",
    title: "武器こうげき力UP (weaponAtk 3 -> 10)",
    category: "weapon",
    description: "基本攻撃力を3から10に引き上げ、通常攻撃で約25〜30ダメージを与えられるようにします。",
    triggerKeywords: ["攻撃力10", "武器強化", "こうげき強く", "攻撃力アップ"],
    targetFile: "game-ui.js",
    codeDiff: {
      file: "game-ui.js",
      before: `let weaponAtk = 3;`,
      after: `let weaponAtk = 10; // 武器攻撃力ブースト`,
    },
    previewSnippet: "weaponAtk: 3 -> 10",
    tags: ["武器", "攻撃力"],
  },
  {
    id: "recipe_weapon_atk_35",
    title: "ひのきの棒・超覚醒 (weaponAtk 3 -> 35)",
    category: "weapon",
    description: "初期武器ひのきの棒を聖剣級に超強化し、一撃で約90ダメージを叩き出します。",
    triggerKeywords: ["ひのきの棒", "ひのき強化", "棒超覚醒", "武器35", "攻撃力35"],
    targetFile: "game-ui.js",
    codeDiff: {
      file: "game-ui.js",
      before: `let weaponAtk = 3;`,
      after: `let weaponAtk = 35; // ひのきの棒・超覚醒`,
    },
    previewSnippet: "weaponAtk: 3 -> 35 (超覚醒)",
    tags: ["ひのきの棒", "大ダメージ"],
  },
  {
    id: "recipe_weapon_one_shot",
    title: "一撃必殺モード (weaponAtk = 999)",
    category: "weapon",
    description: "攻撃力をカンスト値999に設定し、どんなモンスターも通常攻撃1発で粉砕します。",
    triggerKeywords: ["一撃必殺", "ワンパン", "攻撃力カンスト", "999ダメージ", "無双"],
    targetFile: "game-ui.js",
    codeDiff: {
      file: "game-ui.js",
      before: `let weaponAtk = 3;`,
      after: `let weaponAtk = 999; // 一撃必殺モード`,
    },
    previewSnippet: "weaponAtk: 999 (一撃必殺)",
    tags: ["チート", "一撃必殺", "無双"],
  },
  {
    id: "recipe_crit_strike",
    title: "こうげきに「会心の一撃」を追加 (3倍ダメージ)",
    category: "weapon",
    description: "通常こうげき時、25%の確率で「会心の一撃！」が発生して3倍のダメージを与える判定を追加します。",
    triggerKeywords: ["会心の一撃", "クリティカル", "会心追加", "かいしん"],
    targetFile: "game-ui.js",
    codeDiff: {
      file: "game-ui.js",
      before: `const dmg = Math.max(1, Math.floor(weaponAtk * 2.5 + Math.random() * 4));\n    enemyHp -= dmg;\n    addLog("⚔️ ゆうしゃの攻撃！ " + enemyName + " に " + dmg + " のダメージ！");`,
      after: `let isCrit = Math.random() < 0.25;\n    let dmg = Math.max(1, Math.floor(weaponAtk * 2.5 + Math.random() * 4));\n    if (isCrit) {\n      dmg = Math.floor(dmg * 3);\n      addLog("💥💥 会心の一撃！！！ " + enemyName + " に " + dmg + " の痛恨打！");\n    } else {\n      addLog("⚔️ ゆうしゃの攻撃！ " + enemyName + " に " + dmg + " のダメージ！");\n    }\n    enemyHp -= dmg;`,
    },
    previewSnippet: "会心の一撃(25%で3倍ダメージ)を実装",
    tags: ["クリティカル", "戦闘システム"],
  },
  {
    id: "recipe_double_slash",
    title: "こうげき2連撃化 (はやぶさ斬り)",
    category: "weapon",
    description: "通常こうげきを押すと瞬時に2回連続で切り裂く連撃仕様へと変更します。",
    triggerKeywords: ["2回攻撃", "2連撃", "はやぶさの剣", "連撃"],
    targetFile: "game-ui.js",
    codeDiff: {
      file: "game-ui.js",
      before: `const dmg = Math.max(1, Math.floor(weaponAtk * 2.5 + Math.random() * 4));\n    enemyHp -= dmg;\n    addLog("⚔️ ゆうしゃの攻撃！ " + enemyName + " に " + dmg + " のダメージ！");`,
      after: `const dmg1 = Math.max(1, Math.floor(weaponAtk * 2.0 + Math.random() * 3));\n    const dmg2 = Math.max(1, Math.floor(weaponAtk * 2.0 + Math.random() * 3));\n    const totalDmg = dmg1 + dmg2;\n    enemyHp -= totalDmg;\n    addLog("⚔️ はやぶさ2連撃！ (" + dmg1 + " + " + dmg2 + " = " + totalDmg + " ダメージ！)");`,
    },
    previewSnippet: "通常こうげきが2回攻撃に進化",
    tags: ["連撃", "戦闘"],
  },

  // ========================================================
  // 🧪 しんぷるRPG 持ち物・やくそう関連
  // ========================================================
  {
    id: "recipe_herb_heal_80",
    title: "やくそう回復量UP (35 -> 80回復)",
    category: "item",
    description: "やくそうのHP回復量を35から80に増やし、初期HP80なら一発で全快できるようにします。",
    triggerKeywords: ["やくそう強化", "薬草回復", "やくそう80", "回復量アップ"],
    targetFile: "game-ui.js",
    codeDiff: {
      file: "game-ui.js",
      before: `playerHp = Math.min(playerMaxHp, playerHp + 35);\n    addLog("🧪 やくそうを使った！ HPが35回復した！");`,
      after: `playerHp = Math.min(playerMaxHp, playerHp + 80);\n    addLog("🧪 特製やくそうを使った！ HPが80回復した！");`,
    },
    previewSnippet: "やくそうHP回復: 35 -> 80",
    tags: ["やくそう", "アイテム", "HP回復"],
  },
  {
    id: "recipe_herb_full_heal",
    title: "やくそう全回復化 (HP全快・エリクサー化)",
    category: "item",
    description: "やくそうを使うと減ったHPが最大HPまで完全に回復するよう変更します。",
    triggerKeywords: ["やくそう全快", "HP全回復", "やくそう全快エリクサー", "全回復やくそう"],
    targetFile: "game-ui.js",
    codeDiff: {
      file: "game-ui.js",
      before: `playerHp = Math.min(playerMaxHp, playerHp + 35);\n    addLog("🧪 やくそうを使った！ HPが35回復した！");`,
      after: `playerHp = playerMaxHp;\n    addLog("🧪 仙霊やくそうを使った！ HPが全回復した！");`,
    },
    previewSnippet: "やくそう効果: HP完全回復",
    tags: ["全回復", "やくそう"],
  },
  {
    id: "recipe_herb_mp_regen",
    title: "やくそうに「MP+15回復」効果を付加",
    category: "item",
    description: "やくそう使用時にHPだけでなくMPも+15同時に回復するようにします。",
    triggerKeywords: ["やくそうMP", "MP回復", "やくそう魔力", "せいすい効果"],
    targetFile: "game-ui.js",
    codeDiff: {
      file: "game-ui.js",
      before: `playerHp = Math.min(playerMaxHp, playerHp + 35);\n    addLog("🧪 やくそうを使った！ HPが35回復した！");`,
      after: `playerHp = Math.min(playerMaxHp, playerHp + 35);\n    playerMp = Math.min(30, playerMp + 15);\n    addLog("🧪 聖水やくそうを使った！ HP35 & MP15回復！");`,
    },
    previewSnippet: "やくそう効果: HP+35 & MP+15",
    tags: ["MP回復", "やくそう"],
  },

  // ========================================================
  // ✨ しんぷるRPG スキル・ギガデイン関連
  // ========================================================
  {
    id: "recipe_gigadein_mp_zero",
    title: "ギガデイン消費MPゼロ化 (撃ち放題)",
    category: "skill",
    description: "大魔法ギガデインのMPコストを撤廃し、MP0でも連発可能にします。",
    triggerKeywords: ["ギガデインmp0", "ギガデイン消費なし", "ギガデイン連発", "mpゼロ"],
    targetFile: "game-ui.js",
    codeDiff: {
      file: "game-ui.js",
      before: `if (playerMp < 10) {\n      addLog("MPがたりない！");\n      return;\n    }\n    playerMp -= 10;`,
      after: `// ギガデイン消費MPゼロ化 (無消費詠唱)\n    // playerMp -= 0;`,
    },
    previewSnippet: "ギガデイン消費MP: 10 -> 0 (撃ち放題)",
    tags: ["ギガデイン", "スキル", "MP0"],
  },
  {
    id: "recipe_gigadein_dmg_150",
    title: "ギガデイン威力強化 (45 -> 150ダメージ)",
    category: "skill",
    description: "ギガデインの固定ダメージを45から150に大幅強化し、中盤モンスターも一掃します。",
    triggerKeywords: ["ギガデイン強化", "ギガデイン150", "ギガデイン威力", "強いギガデイン"],
    targetFile: "game-ui.js",
    codeDiff: {
      file: "game-ui.js",
      before: `const dmg = 45;`,
      after: `const dmg = 150; // ギガデイン極大雷撃`,
    },
    previewSnippet: "ギガデインダメージ: 45 -> 150",
    tags: ["ギガデイン", "魔法威力"],
  },
  {
    id: "recipe_gigadein_extinction",
    title: "ギガデイン極大消滅 (999固定ダメージ)",
    category: "skill",
    description: "神の雷撃を呼び起こし、999固定ダメージで全敵を消滅させます。",
    triggerKeywords: ["ギガデイン999", "ギガデイン即死", "神の雷", "最強魔法"],
    targetFile: "game-ui.js",
    codeDiff: {
      file: "game-ui.js",
      before: `const dmg = 45;`,
      after: `const dmg = 999; // 神威ギガデイン (999ダメージ)`,
    },
    previewSnippet: "ギガデインダメージ: 45 -> 999",
    tags: ["ギガデイン", "999ダメージ"],
  },
  {
    id: "recipe_gigadein_drain",
    title: "ギガデインHP吸収化 (敵に大打撃＋HP全快)",
    category: "skill",
    description: "ギガデイン発動時に敵へダメージを与えると同時に、術者のHPを満タンまで吸収回復します。",
    triggerKeywords: ["ギガデインドレイン", "HP吸収", "ギガデイン回復", "ドレイン魔法"],
    targetFile: "game-ui.js",
    codeDiff: {
      file: "game-ui.js",
      before: `playerMp -= 10;\n    const dmg = 45;\n    enemyHp -= dmg;\n    addLog("⚡ ギガデインを唱えた！ " + enemyName + " に " + dmg + " の大ダメージ！");`,
      after: `playerMp -= 10;\n    const dmg = 60;\n    enemyHp -= dmg;\n    playerHp = playerMaxHp; // ドレイン全快\n    addLog("⚡ 吸魔ギガデイン！ " + enemyName + " に " + dmg + " ダメージを与え、HPが全回復した！");`,
    },
    previewSnippet: "ギガデイン: 敵に60ダメ + 自身HP全快",
    tags: ["HP吸収", "ギガデイン"],
  },

  // ========================================================
  // 🛡️ しんぷるRPG 勇者初期ステータス関連
  // ========================================================
  {
    id: "recipe_player_hp_200",
    title: "勇者初期HP倍増 (80 -> 200)",
    category: "system",
    description: "勇者の初期HPと最大HPを80から200に引き上げ、耐久力を底上げします。",
    triggerKeywords: ["hp200", "初期hp", "最大hp", "hp増やす", "体力強化"],
    targetFile: "game-ui.js",
    codeDiff: {
      file: "game-ui.js",
      before: `let playerHp = 80;\n  let playerMaxHp = 80;`,
      after: `let playerHp = 200;\n  let playerMaxHp = 200; // 初期HPブースト`,
    },
    previewSnippet: "勇者HP: 80/80 -> 200/200",
    tags: ["勇者HP", "ステータス"],
  },
  {
    id: "recipe_player_mp_100",
    title: "勇者初期MP強化 (30 -> 100)",
    category: "system",
    description: "勇者の初期MPを30から100に増やし、ギガデインを連続10回撃てるようにします。",
    triggerKeywords: ["mp100", "初期mp", "mp増やす", "魔力強化"],
    targetFile: "game-ui.js",
    codeDiff: {
      file: "game-ui.js",
      before: `let playerMp = 30;`,
      after: `let playerMp = 100; // 初期MPブースト`,
    },
    previewSnippet: "勇者MP: 30 -> 100",
    tags: ["勇者MP", "ステータス"],
  },
  {
    id: "recipe_player_millionaire",
    title: "初期所持金大富豪化 (120G -> 99,999G)",
    category: "system",
    description: "勇者の開始時所持ゴールドを99,999Gにし、大富豪として冒険をスタートします。",
    triggerKeywords: ["大富豪", "所持金マックス", "お金max", "99999g", "ゴールドmax"],
    targetFile: "game-ui.js",
    codeDiff: {
      file: "game-ui.js",
      before: `let gold = 120;`,
      after: `let gold = 99999; // 大富豪スタート`,
    },
    previewSnippet: "所持金: 120G -> 99,999G",
    tags: ["ゴールド", "ステータス"],
  },
  {
    id: "recipe_auto_regen",
    title: "自動リジェネ追加 (毎ターンHP+10自動回復)",
    category: "system",
    description: "こうげきボタンを押すたびに自動的にHPが+10回復するリジェネレーション体質を付加します。",
    triggerKeywords: ["リジェネ", "自動回復", "毎ターン回復", "自然治癒"],
    targetFile: "game-ui.js",
    codeDiff: {
      file: "game-ui.js",
      before: `document.getElementById("btnAttack")?.addEventListener("click", () => {`,
      after: `document.getElementById("btnAttack")?.addEventListener("click", () => {\n    // 自動リジェネ\n    playerHp = Math.min(playerMaxHp, playerHp + 10);`,
    },
    previewSnippet: "攻撃毎にHP+10自動回復 (リジェネ)",
    tags: ["リジェネ", "回復"],
  },
];

/**
 * Intelligent file target finder:
 * If targetFile doesn't match or pattern is in another file (e.g. game.js, script.js, index.html),
 * finds which file actually contains `diff.before`.
 */
export function resolveTargetFile(files: SimpleRpgFile[], diff: CodeDiffBlock): SimpleRpgFile | null {
  // 1. Try exact or partial filename match
  const directMatch = files.find((f) => f.path.includes(diff.file));
  if (directMatch && directMatch.content.includes(diff.before)) {
    return directMatch;
  }

  // 2. Search all JS/HTML code files for the pattern
  const candidate = files.find(
    (f) =>
      (f.path.endsWith(".js") || f.path.endsWith(".html") || f.path.endsWith(".ts")) &&
      f.content.includes(diff.before)
  );

  return candidate || directMatch || null;
}

export function parseRpgCommand(
  rawInput: string,
  files: SimpleRpgFile[],
  customRecipes: RpgPatchRecipe[] = []
): RpgParseResult {
  const startTime = performance.now();
  const input = rawInput.trim().toLowerCase();
  
  // Prioritize dynamically generated recipes from current files / ZIP
  const dynamicRecipes = DynamicPatchGenerator.generatePatchesFromFiles(files);
  const allRecipes = [...customRecipes, ...dynamicRecipes, ...RPG_BUILTIN_RECIPES];

  const matchedRecipes: RpgPatchRecipe[] = [];
  const matchedKeywords: string[] = [];
  const diffs: CodeDiffBlock[] = [];

  // 1. Match from recipes
  allRecipes.forEach((recipe) => {
    const hits = recipe.triggerKeywords.filter((kw) => input.includes(kw.toLowerCase()));
    if (hits.length > 0) {
      matchedRecipes.push(recipe);
      matchedKeywords.push(...hits);

      // Resolve the actual file that contains the code
      const resolvedFile = resolveTargetFile(files, recipe.codeDiff);
      diffs.push({
        ...recipe.codeDiff,
        file: resolvedFile ? resolvedFile.path : recipe.codeDiff.file,
      });
    }
  });

  // 2. Dynamic numeric extractor (e.g. "スライムのHPを10に", "攻撃力を50に", "やくそう回復量を100に")
  let isCustomNumeric = false;
  let customLog = "";

  // Enemy HP custom numeric
  const hpMatch = input.match(/(?:スライム|モンスター|敵).*?(?:hp|体力).*?(\d+)/i) || input.match(/(?:hp|体力).*?(\d+)/i);
  if (hpMatch && matchedRecipes.length === 0) {
    const newHp = parseInt(hpMatch[1], 10);
    const targetFile = files.find(
      (f) =>
        f.content.includes("let enemyHp") ||
        f.content.includes("var enemyHp") ||
        f.content.includes("enemyHp =")
    );
    if (targetFile) {
      const matchPattern = targetFile.content.match(/(?:let|var)\s+enemyHp\s*=\s*(\d+);/);
      if (matchPattern) {
        diffs.push({
          file: targetFile.path,
          before: matchPattern[0],
          after: `let enemyHp = ${newHp}; // 動的パッチ`,
        });
        isCustomNumeric = true;
        customLog = `敵HP設定値を ${newHp} に直接書き換えました`;
      }
    }
  }

  // Weapon ATK custom numeric
  const atkMatch = input.match(/(?:攻撃力|atk|こうげき).*?(\d+)/i);
  if (atkMatch && matchedRecipes.length === 0) {
    const newAtk = parseInt(atkMatch[1], 10);
    const targetFile = files.find(
      (f) =>
        f.content.includes("let weaponAtk") ||
        f.content.includes("var weaponAtk") ||
        f.content.includes("weaponAtk =")
    );
    if (targetFile) {
      const matchPattern = targetFile.content.match(/(?:let|var)\s+weaponAtk\s*=\s*(\d+);/);
      if (matchPattern) {
        diffs.push({
          file: targetFile.path,
          before: matchPattern[0],
          after: `let weaponAtk = ${newAtk}; // 動的パッチ`,
        });
        isCustomNumeric = true;
        customLog = `武器攻撃力を ${newAtk} に直接書き換えました`;
      }
    }
  }

  const endTime = performance.now();
  const parseTimeMs = +(endTime - startTime).toFixed(3);

  let log = "";
  if (matchedRecipes.length > 0) {
    log = `⚡ 0.001秒で反映: [${matchedRecipes.map((r) => r.title).join(", ")}]`;
  } else if (isCustomNumeric) {
    log = `⚡ 0.001秒で数値パッチ反映: ${customLog}`;
  } else {
    log = `「${rawInput}」に一致するしんぷるRPG変更定義が見つかりませんでした。ワンタップレシピを試してください。`;
  }

  return {
    rawInput,
    matchedRecipes,
    diffs,
    parseTimeMs,
    log,
    matchedKeywords,
    isCustomNumericPatch: isCustomNumeric,
  };
}

export function applyDiffsToFile(fileContent: string, diffs: CodeDiffBlock[]): string {
  let updated = fileContent;
  diffs.forEach((d) => {
    if (updated.includes(d.before)) {
      updated = updated.replace(d.before, d.after);
    }
  });
  return updated;
}
