import { GameConfig, PatchRecipe, ParseResult } from "../types";

/**
 * 高速ローカル・ルールベースパーサー (Rule-Based Intent Parser)
 * - LLM呼び出しゼロ（ネットワーク通信ゼロ・APIトークン消費ゼロ）
 * - 0.001秒（1ミリ秒未満）で自然言語から意図・パラメータを抽出してレシピを適用
 * - Galaxy S25等のスマートフォンでも一切CPU負荷や発熱を起こさない完全クライアント駆動
 */
export function parseLocalCommand(
  input: string,
  allRecipes: PatchRecipe[],
  currentConfig: GameConfig
): ParseResult {
  const startTime = performance.now();
  const normalized = input.trim().toLowerCase();

  const matchedRecipes: PatchRecipe[] = [];
  const extractedParams: Partial<GameConfig> = {};
  const matchedKeywords: string[] = [];

  // 1. 各レシピのキーワード・シノニムとのマッチング (あいまい検索・部分一致)
  for (const recipe of allRecipes) {
    let matched = false;
    for (const kw of recipe.triggerKeywords) {
      const lowerKw = kw.toLowerCase();
      if (normalized.includes(lowerKw)) {
        matched = true;
        matchedKeywords.push(kw);
        break;
      }
    }

    if (matched) {
      matchedRecipes.push(recipe);
      Object.assign(extractedParams, recipe.params);
    }
  }

  // 2. 数値倍率・修飾語の抽出 (Slot Filling / Modifier Extraction)
  // 例: 「2倍」「3倍」「1.5倍」「半分」「超速」「ちょっと速く」
  const multiplierMatch = normalized.match(/(\d+(\.\d+)?)倍/);
  if (multiplierMatch) {
    const factor = parseFloat(multiplierMatch[1]);
    if (!isNaN(factor) && factor > 0) {
      if (normalized.includes("スピード") || normalized.includes("速") || normalized.includes("自機")) {
        extractedParams.playerSpeed = Math.round(currentConfig.playerSpeed * factor * 10) / 10;
        matchedKeywords.push(`${factor}倍速`);
      }
      if (normalized.includes("弾") || normalized.includes("ショット")) {
        extractedParams.bulletSpeed = Math.round(currentConfig.bulletSpeed * factor * 10) / 10;
        matchedKeywords.push(`弾速${factor}倍`);
      }
      if (normalized.includes("スコア")) {
        extractedParams.scoreMultiplier = Math.round(factor);
        matchedKeywords.push(`スコア${factor}倍`);
      }
    }
  }

  // 「3連射」「5方向」「8発」などの直接数値指定
  const countMatch = normalized.match(/(\d+)(連射|方向|発|way)/);
  if (countMatch) {
    const count = parseInt(countMatch[1], 10);
    if (count >= 1 && count <= 36) {
      extractedParams.bulletCount = count;
      extractedParams.bulletType = count > 1 ? "spread" : "normal";
      extractedParams.bulletSpread = count >= 8 ? Math.PI * 2 : 0.15 * count;
      matchedKeywords.push(`${count}連射/方向`);
    }
  }

  // 「赤」「青」「緑」「黄色」「紫」の色変更
  if (normalized.includes("赤") || normalized.includes("red")) {
    extractedParams.playerColor = "#ef4444";
    extractedParams.bulletColor = "#f87171";
    matchedKeywords.push("カラー: 赤");
  } else if (normalized.includes("青") || normalized.includes("blue")) {
    extractedParams.playerColor = "#38bdf8";
    extractedParams.bulletColor = "#60a5fa";
    matchedKeywords.push("カラー: 青");
  } else if (normalized.includes("緑") || normalized.includes("green")) {
    extractedParams.playerColor = "#22c55e";
    extractedParams.bulletColor = "#4ade80";
    matchedKeywords.push("カラー: 緑");
  } else if (normalized.includes("黄") || normalized.includes("gold") || normalized.includes("yellow")) {
    extractedParams.playerColor = "#eab308";
    extractedParams.bulletColor = "#fde047";
    matchedKeywords.push("カラー: 黄");
  } else if (normalized.includes("紫") || normalized.includes("purple")) {
    extractedParams.playerColor = "#a855f7";
    extractedParams.bulletColor = "#c084fc";
    matchedKeywords.push("カラー: 紫");
  }

  // 3. 直接パラメータ変更のフォールバック判定
  let isCustomFormula = false;
  if (matchedRecipes.length === 0 && Object.keys(extractedParams).length === 0) {
    // 汎用キーワード抽出
    if (normalized.includes("速く") || normalized.includes("スピードアップ")) {
      extractedParams.playerSpeed = Math.min(12, currentConfig.playerSpeed + 2);
      matchedKeywords.push("自機スピード+2");
      isCustomFormula = true;
    } else if (normalized.includes("遅く")) {
      extractedParams.playerSpeed = Math.max(2, currentConfig.playerSpeed - 1.5);
      matchedKeywords.push("自機スピード-1.5");
      isCustomFormula = true;
    } else if (normalized.includes("強く") || normalized.includes("パワーアップ")) {
      extractedParams.bulletDamage = currentConfig.bulletDamage * 2;
      extractedParams.bulletCount = Math.max(3, currentConfig.bulletCount + 1);
      matchedKeywords.push("火力&弾数アップ");
      isCustomFormula = true;
    } else if (normalized.includes("無敵") || normalized.includes("シールド")) {
      extractedParams.playerShield = true;
      matchedKeywords.push("シールド有効化");
      isCustomFormula = true;
    }
  }

  const endTime = performance.now();
  const parseTimeMs = Math.round((endTime - startTime) * 100) / 100; // 0.05ms単位

  let log = "";
  if (matchedRecipes.length > 0) {
    const names = matchedRecipes.map((r) => r.title).join(" + ");
    log = `⚡ 即時パッチ適用: [${names}] (${parseTimeMs}ms で解析完了 / トークン消費: 0 / オフライン)`;
  } else if (Object.keys(extractedParams).length > 0) {
    log = `⚡ パラメータ直接置換: [${matchedKeywords.join(", ")}] (${parseTimeMs}ms で適用)`;
  } else {
    log = `ℹ️ 一致するレシピが見つかりませんでした。「3連射」「追尾」「2倍速」「レーザー」「凍結」などのキーワードをお試しください。`;
  }

  return {
    rawInput: input,
    matchedRecipes,
    extractedParams,
    parseTimeMs: Math.max(0.01, parseTimeMs),
    log,
    matchedKeywords,
    isCustomFormula,
  };
}
