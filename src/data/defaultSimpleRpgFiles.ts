// Default SimpleRPG Source Files embedded for instant out-of-the-box development

import { SimpleRpgFile } from "../types";

export const DEFAULT_SIMPLE_RPG_FILES: SimpleRpgFile[] = [
  {
    path: "index.html",
    category: "ui",
    content: `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>しんぷるRPG</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="game-container">
    <header class="game-header">
      <h1 class="game-title">⚔️ しんぷるRPG</h1>
      <div id="playerStatus" class="status-bar">
        <div class="status-name">ゆうしゃ (Lv.1)</div>
        <div class="status-values">
          <span class="hp-val">❤️ HP: <strong id="valHp">80</strong> / 80</span>
          <span class="mp-val">✨ MP: <strong id="valMp">30</strong> / 30</span>
          <span class="gold-val">🪙 <strong id="valGold">120</strong> G</span>
        </div>
      </div>
    </header>

    <main class="battle-stage">
      <div id="enemyBox" class="enemy-card">
        <div class="enemy-header">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 0.8rem; color: #94a3b8;">敵選択:</span>
            <select id="selEnemy" style="background: #1e293b; color: #4ade80; border: 1px solid #334155; border-radius: 6px; font-weight: bold; font-size: 0.85rem; padding: 2px 6px;">
              <option value="slime">みどりスライム (HP 25)</option>
              <option value="goblin">ゴブリン戦士 (HP 55)</option>
              <option value="skeleton">スケルトンナイト (HP 95)</option>
              <option value="fire_drake">火竜ファイア・ドレイク (HP 280)</option>
              <option value="demon_king">冥王デスロード (HP 650)</option>
            </select>
          </div>
          <span class="enemy-hp-text">HP: <strong id="enemyHp">25</strong> / <span id="enemyMaxHp">25</span></span>
        </div>
        <div class="enemy-hp-bar">
          <div id="enemyHpGauge" class="enemy-hp-fill" style="width: 100%;"></div>
        </div>
        <div id="enemySprite" class="enemy-sprite">🟢</div>
      </div>

      <div id="messageLog" class="message-log">
        <div class="log-line">[冒険開始] みどりスライムがあらわれた！</div>
      </div>

      <div class="action-grid">
        <button id="btnAttack" class="act-btn btn-attack">⚔️ こうげき</button>
        <button id="btnHerb" class="act-btn btn-item">🧪 やくそう</button>
        <button id="btnMagic" class="act-btn btn-magic">✨ ギガデイン</button>
        <button id="btnReset" class="act-btn btn-sub">🔄 リセット</button>
      </div>
    </main>

    <div id="pageHelp" class="help-section">
      <div id="helpContentRoot">
        <h3>💡 あそびかた</h3>
        <p>「こうげき」でモンスターを倒そう！パッチでモンスターのHPや武器の強さをいつでも変更できます。</p>
      </div>
    </div>
  </div>

  <script src="game-ui.js"></script>
</body>
</html>`
  },
  {
    path: "style.css",
    category: "style",
    content: `/* しんぷるRPG モバイル最適化スタイルシート */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  -webkit-tap-highlight-color: transparent;
}

body {
  background-color: #090d16;
  color: #f1f5f9;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 12px;
}

.game-container {
  width: 100%;
  max-width: 440px;
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 16px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
}

.game-header {
  border-bottom: 1px solid #1e293b;
  padding-bottom: 10px;
}

.game-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: #38bdf8;
  text-align: center;
  margin-bottom: 8px;
}

.status-bar {
  background: #1e293b;
  border-radius: 10px;
  padding: 8px 12px;
}

.status-name {
  font-size: 0.8rem;
  font-weight: bold;
  color: #94a3b8;
}

.status-values {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 0.85rem;
}

.hp-val { color: #f43f5e; font-weight: bold; }
.mp-val { color: #38bdf8; font-weight: bold; }
.gold-val { color: #fbbf24; font-weight: bold; }

.battle-stage {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.enemy-card {
  background: #020617;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 12px;
  text-align: center;
}

.enemy-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  margin-bottom: 6px;
  font-weight: bold;
}

.enemy-name { color: #4ade80; }
.enemy-hp-text { color: #94a3b8; }

.enemy-hp-bar {
  width: 100%;
  height: 8px;
  background: #1e293b;
  border-radius: 9999px;
  overflow: hidden;
  margin-bottom: 12px;
}

.enemy-hp-fill {
  height: 100%;
  background: linear-gradient(90deg, #f43f5e, #fb7185);
  transition: width 0.25s ease;
}

.enemy-sprite {
  font-size: 3.5rem;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: float 2s infinite ease-in-out;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
}

.message-log {
  background: #020617;
  border: 1px solid #1e293b;
  border-radius: 10px;
  padding: 10px;
  height: 80px;
  overflow-y: auto;
  font-size: 0.8rem;
  color: #cbd5e1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.action-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.act-btn {
  padding: 12px;
  border-radius: 10px;
  border: none;
  font-size: 0.9rem;
  font-weight: bold;
  color: white;
  cursor: pointer;
  touch-action: manipulation;
  transition: transform 0.05s ease, opacity 0.15s ease;
}

.act-btn:active {
  transform: scale(0.97);
  opacity: 0.85;
}

.btn-attack { background: #e11d48; }
.btn-item { background: #059669; }
.btn-magic { background: #7c3aed; }
.btn-sub { background: #334155; }

.help-section {
  background: #1e293b/40;
  border: 1px dashed #334155;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 0.78rem;
  color: #94a3b8;
}`
  },
  {
    path: "game-ui.js",
    category: "ui",
    content: `// しんぷるRPG ゲームUIコントローラー
window.addEventListener("DOMContentLoaded", () => {
  // しんぷるRPG モンスター一覧
  const ENEMIES = [
    { id: "slime", name: "みどりスライム", hp: 25, maxHp: 25, atk: 6, def: 2, exp: 8, gold: 5, sprite: "🟢" },
    { id: "goblin", name: "ゴブリン戦士", hp: 55, maxHp: 55, atk: 14, def: 5, exp: 22, gold: 18, sprite: "👺" },
    { id: "skeleton", name: "スケルトンナイト", hp: 95, maxHp: 95, atk: 24, def: 12, exp: 48, gold: 40, sprite: "💀" },
    { id: "fire_drake", name: "火竜ファイア・ドレイク", hp: 280, maxHp: 280, atk: 52, def: 28, exp: 160, gold: 150, sprite: "🐲" },
    { id: "demon_king", name: "冥王デスロード", hp: 650, maxHp: 650, atk: 88, def: 45, exp: 500, gold: 800, sprite: "👑" },
  ];

  let currentEnemy = ENEMIES[0];
  let enemyName = "みどりスライム";
  let enemyHp = 25;
  let enemyMaxHp = 25;
  let enemyAtk = 6;
  let enemyGoldReward = 5;

  // 勇者ステータス・装備
  let playerHp = 80;
  let playerMaxHp = 80;
  let playerMp = 30;
  let gold = 120;
  let weaponAtk = 3;
  let weaponName = "ひのきの棒";

  const logBox = document.getElementById("messageLog");
  const hpElem = document.getElementById("valHp");
  const mpElem = document.getElementById("valMp");
  const goldElem = document.getElementById("valGold");
  const enemyHpElem = document.getElementById("enemyHp");
  const enemyMaxHpElem = document.getElementById("enemyMaxHp");
  const enemyGauge = document.getElementById("enemyHpGauge");
  const enemyNameElem = document.getElementById("enemyName");
  const enemySpriteElem = document.getElementById("enemySprite");
  const enemySelectElem = document.getElementById("selEnemy");

  function addLog(msg) {
    if (!logBox) return;
    const line = document.createElement("div");
    line.className = "log-line";
    line.textContent = msg;
    logBox.appendChild(line);
    logBox.scrollTop = logBox.scrollHeight;
  }

  function updateDisplay() {
    if (hpElem) hpElem.textContent = playerHp;
    if (mpElem) mpElem.textContent = playerMp;
    if (goldElem) goldElem.textContent = gold;
    if (enemyHpElem) enemyHpElem.textContent = Math.max(0, enemyHp);
    if (enemyMaxHpElem) enemyMaxHpElem.textContent = enemyMaxHp;
    if (enemyNameElem) enemyNameElem.textContent = enemyName;
    if (enemyGauge) {
      const pct = Math.max(0, Math.min(100, Math.round((enemyHp / enemyMaxHp) * 100)));
      enemyGauge.style.width = pct + "%";
    }
  }

  // 敵セレクター変更
  enemySelectElem?.addEventListener("change", (e) => {
    const selected = ENEMIES.find(m => m.id === e.target.value) || ENEMIES[0];
    currentEnemy = selected;
    enemyName = selected.name;
    enemyHp = selected.hp;
    enemyMaxHp = selected.maxHp;
    enemyAtk = selected.atk;
    enemyGoldReward = selected.gold;
    if (enemySpriteElem) enemySpriteElem.textContent = selected.sprite;
    addLog("[出現] " + enemyName + " (HP: " + enemyMaxHp + ") があらわれた！");
    updateDisplay();
  });

  document.getElementById("btnAttack")?.addEventListener("click", () => {
    if (enemyHp <= 0) {
      addLog("敵はすでに倒れている！「リセット」を押してください。");
      return;
    }
    const dmg = Math.max(1, Math.floor(weaponAtk * 2.5 + Math.random() * 4));
    enemyHp -= dmg;
    addLog("⚔️ ゆうしゃの攻撃！ " + enemyName + " に " + dmg + " のダメージ！");
    if (enemyHp <= 0) {
      enemyHp = 0;
      addLog("🎉 " + enemyName + " をたおした！ " + enemyGoldReward + "ゴールドと経験値を獲得！");
      gold += enemyGoldReward;
    } else {
      const eDmg = Math.max(1, Math.floor(enemyAtk * 0.7 + Math.random() * 3));
      playerHp = Math.max(0, playerHp - eDmg);
      addLog("💥 " + enemyName + " の反撃！ " + eDmg + " のダメージを受けた！");
    }
    updateDisplay();
  });

  document.getElementById("btnHerb")?.addEventListener("click", () => {
    if (playerHp >= playerMaxHp) {
      addLog("HPはすでに満タンです！");
      return;
    }
    playerHp = Math.min(playerMaxHp, playerHp + 35);
    addLog("🧪 やくそうを使った！ HPが35回復した！");
    updateDisplay();
  });

  document.getElementById("btnMagic")?.addEventListener("click", () => {
    if (playerMp < 10) {
      addLog("MPがたりない！");
      return;
    }
    playerMp -= 10;
    const dmg = 45;
    enemyHp -= dmg;
    addLog("⚡ ギガデインを唱えた！ " + enemyName + " に " + dmg + " の大ダメージ！");
    if (enemyHp <= 0) {
      enemyHp = 0;
      addLog("🎉 敵を粉砕した！");
    }
    updateDisplay();
  });

  document.getElementById("btnReset")?.addEventListener("click", () => {
    enemyHp = enemyMaxHp;
    playerHp = playerMaxHp;
    playerMp = 30;
    logBox.innerHTML = '<div class="log-line">[戦闘リセット] 新しい ' + enemyName + ' があらわれた！</div>';
    updateDisplay();
  });

  updateDisplay();
});`
  },
  {
    path: "enemy-data.js",
    category: "data",
    content: `// ==========================================
// 👾 しんぷるRPG: モンスター・エネミー設定データ
// ==========================================

export const ENEMY_DATABASE = [
  {
    id: "slime",
    name: "みどりスライム",
    hp: 25,
    maxHp: 25,
    atk: 6,
    def: 2,
    exp: 8,
    gold: 5,
    dropItem: "slime_gel",
    dropRate: 0.6,
    color: "#4ade80",
    description: "草原によく現れる弱小モンスター。ぷるぷるしている。"
  },
  {
    id: "goblin",
    name: "ゴブリン戦士",
    hp: 55,
    maxHp: 55,
    atk: 14,
    def: 5,
    exp: 22,
    gold: 18,
    dropItem: "rusted_dagger",
    dropRate: 0.35,
    color: "#f59e0b",
    description: "手製の粗末な短剣を持って群れる森の魔物。"
  },
  {
    id: "skeleton",
    name: "スケルトンナイト",
    hp: 95,
    maxHp: 95,
    atk: 24,
    def: 12,
    exp: 48,
    gold: 40,
    dropItem: "bone_fragment",
    dropRate: 0.5,
    color: "#cbd5e1",
    description: "かつての王国の兵士の亡骸。盾による防御を好む。"
  },
  {
    id: "fire_drake",
    name: "火竜ファイア・ドレイク",
    hp: 280,
    maxHp: 280,
    atk: 52,
    def: 28,
    exp: 160,
    gold: 150,
    dropItem: "dragon_scale",
    dropRate: 0.8,
    color: "#ef4444",
    description: "山頂の洞窟に潜む大型魔獣。灼熱の火炎ブレスを吐く。"
  },
  {
    id: "demon_king",
    name: "冥王デスロード (BOSS)",
    hp: 650,
    maxHp: 650,
    atk: 88,
    def: 45,
    exp: 500,
    gold: 800,
    dropItem: "demonic_core",
    dropRate: 1.0,
    color: "#8b5cf6",
    description: "魔界の深層より現れた支配者。全体暗黒魔法を操る。"
  }
];
`,
  },
  {
    path: "combat-equip-data.js",
    category: "data",
    content: `// ==========================================
// ⚔️ しんぷるRPG: 武具・装備品データ
// ==========================================

export const WEAPON_DATABASE = [
  {
    id: "wooden_stick",
    name: "ひのきの棒",
    type: "weapon",
    atk: 3,
    critRate: 0.05,
    price: 15,
    description: "道端で拾った木の棒。ないよりはマシ。"
  },
  {
    id: "copper_sword",
    name: "銅のつるぎ",
    type: "weapon",
    atk: 12,
    critRate: 0.08,
    price: 90,
    description: "鍛冶屋の見習いが打った標準的な金属剣。"
  },
  {
    id: "steel_claymore",
    name: "鋼鉄のクレイモア",
    type: "weapon",
    atk: 32,
    critRate: 0.12,
    price: 340,
    description: "両手で振るう重厚な大剣。敵の装甲を砕く。"
  },
  {
    id: "flame_katana",
    name: "業火の妖刀",
    type: "weapon",
    atk: 65,
    critRate: 0.22,
    price: 850,
    specialEffect: "fire_damage",
    description: "刀身に赤蓮の炎を宿した銘刀。攻撃時に追加熱傷。"
  },
  {
    id: "holy_excalibur",
    name: "聖剣エクスカリバー",
    type: "weapon",
    atk: 140,
    critRate: 0.35,
    price: 2400,
    specialEffect: "heal_on_hit",
    description: "光の神に祝福された伝説の武具。命中時にHP小回復。"
  }
];

export const ARMOR_DATABASE = [
  {
    id: "cloth_tunic",
    name: "布の服",
    type: "armor",
    def: 2,
    hpBonus: 5,
    price: 20
  },
  {
    id: "leather_armor",
    name: "革のよろい",
    type: "armor",
    def: 8,
    hpBonus: 20,
    price: 110
  },
  {
    id: "iron_plate",
    name: "鉄の胸当て",
    type: "armor",
    def: 24,
    hpBonus: 60,
    price: 400
  },
  {
    id: "dragon_mail",
    name: "竜鱗の重鎧",
    type: "armor",
    def: 58,
    hpBonus: 150,
    price: 1300,
    specialEffect: "fire_resist_50"
  }
];
`,
  },
  {
    path: "battle-items.js",
    category: "data",
    content: `// ==========================================
// 🧪 しんぷるRPG: 戦闘アイテム・消耗品データ
// ==========================================

export const BATTLE_ITEMS = [
  {
    id: "herb",
    name: "やくそう",
    healHp: 35,
    price: 12,
    description: "野山に自生する薬効植物。HPを35回復する。"
  },
  {
    id: "high_potion",
    name: "ハイポーション",
    healHp: 120,
    price: 65,
    description: "錬金術で抽出された上質な回復薬。HPを120回復。"
  },
  {
    id: "magic_water",
    name: "まほうのせいすい",
    healMp: 50,
    price: 80,
    description: "澄んだ聖なる霊水。MPを50回復する。"
  },
  {
    id: "bomb",
    name: "火炎グレネード",
    damage: 85,
    price: 90,
    description: "投擲すると炸裂する火薬玉。敵全体に85の定数ダメージ。"
  },
  {
    id: "elixir",
    name: "仙霊エリクサー",
    healHp: 999,
    healMp: 999,
    price: 500,
    description: "あらゆる傷と魔力を瞬時に全快させる奇跡の秘薬。"
  }
];
`,
  },
  {
    path: "craft-data.js",
    category: "data",
    content: `// ==========================================
// 🔨 しんぷるRPG: クラフト・調合レシピデータ
// ==========================================

export const CRAFT_RECIPES = [
  {
    id: "craft_high_potion",
    resultItem: "high_potion",
    resultCount: 1,
    materials: [
      { id: "herb", count: 3 },
      { id: "slime_gel", count: 2 }
    ],
    successRate: 0.95
  },
  {
    id: "craft_steel_claymore",
    resultItem: "steel_claymore",
    resultCount: 1,
    materials: [
      { id: "copper_sword", count: 1 },
      { id: "bone_fragment", count: 4 }
    ],
    successRate: 0.85
  },
  {
    id: "craft_elixir",
    resultItem: "elixir",
    resultCount: 1,
    materials: [
      { id: "high_potion", count: 2 },
      { id: "magic_water", count: 2 },
      { id: "dragon_scale", count: 1 }
    ],
    successRate: 0.75
  }
];
`,
  },
  {
    path: "game-core-1.js",
    category: "core",
    content: `// ==========================================
// ⚙️ しんぷるRPG: バトル・ダメージ計算エンジン
// ==========================================

export interface PlayerStats {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  atk: number;
  def: number;
  level: number;
  exp: number;
  gold: number;
}

export function calculateDamage(attackerAtk: number, defenderDef: number, isCrit: boolean = false): number {
  // ダメージ計算式: (攻撃力 * 1.5 - 防御力 * 0.7) * 乱数係数
  const base = Math.max(1, (attackerAtk * 1.5) - (defenderDef * 0.7));
  const variance = 0.9 + Math.random() * 0.2; // 0.9 - 1.1倍
  let dmg = Math.floor(base * variance);
  if (isCrit) {
    dmg = Math.floor(dmg * 1.8);
  }
  return Math.max(1, dmg);
}

export function checkLevelUp(currentLevel: number, totalExp: number): { leveledUp: boolean; newLevel: number } {
  const reqExp = currentLevel * currentLevel * 15;
  if (totalExp >= reqExp) {
    return { leveledUp: true, newLevel: currentLevel + 1 };
  }
  return { leveledUp: false, newLevel: currentLevel };
}
`,
  },
  {
    path: "save-system.js",
    category: "system",
    content: `// ==========================================
// 💾 しんぷるRPG: セーブ・ロードストレージ管理
// ==========================================

const SAVE_KEY = "simple_rpg_savedata_v1";

export function saveGame(saveData: any): boolean {
  try {
    const json = JSON.stringify({
      ...saveData,
      savedAt: Date.now(),
      version: "1.0.0"
    });
    localStorage.setItem(SAVE_KEY, json);
    return true;
  } catch (e) {
    console.error("Save failed:", e);
    return false;
  }
}

export function loadGame(): any | null {
  try {
    const data = localStorage.getItem(SAVE_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch (e) {
    console.error("Load failed:", e);
    return null;
  }
}
`,
  },
  {
    path: "miki-ai-test.js",
    category: "test",
    content: `// ==========================================
// 🤖 ミキAI: 自律テストプレイ＆戦闘バランス検証エージェント
// ==========================================

export function runMikiAiSimulation(enemyData: any, weaponData: any, trials = 100) {
  let playerWins = 0;
  let totalTurns = 0;
  let totalDmgTaken = 0;

  for (let i = 0; i < trials; i++) {
    let pHp = 100;
    let eHp = enemyData.hp;
    let turns = 0;

    while (pHp > 0 && eHp > 0 && turns < 50) {
      turns++;
      // プレイヤー行動
      const pDmg = Math.max(1, weaponData.atk * 1.5 - enemyData.def * 0.7);
      eHp -= pDmg;
      if (eHp <= 0) {
        playerWins++;
        break;
      }

      // 敵行動
      const eDmg = Math.max(1, enemyData.atk * 1.5 - 10);
      pHp -= eDmg;
      totalDmgTaken += eDmg;
    }
    totalTurns += turns;
  }

  return {
    trials,
    winRate: Math.round((playerWins / trials) * 100),
    avgTurns: +(totalTurns / trials).toFixed(1),
    avgDmgTaken: +(totalDmgTaken / trials).toFixed(1)
  };
}
`,
  }
];
