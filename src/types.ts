export type BulletType =
  | "normal"
  | "spread"
  | "homing"
  | "laser"
  | "bouncing"
  | "orbital"
  | "piercing";

export type GameTheme = "cyberpunk" | "retro" | "matrix" | "synthwave" | "solar";

export interface GameConfig {
  // Player settings
  playerSpeed: number;
  playerSize: number;
  playerColor: string;
  playerMaxHp: number;
  playerShield: boolean;
  playerGhostTrail: boolean;
  playerMagnetRadius: number;

  // Bullet / Weapon settings
  bulletType: BulletType;
  bulletCount: number;
  bulletSpeed: number;
  bulletSpread: number;
  bulletSize: number;
  bulletColor: string;
  bulletDamage: number;
  bulletCooldown: number; // ms
  autoFire: boolean;
  piercing: boolean;
  bounces: number;

  // Enemy settings
  enemySpeed: number;
  enemySpawnRate: number; // multiplier
  enemyHp: number;
  enemyColor: string;
  enemyFreezeEffect: number; // 0 = none, >0 = speed reduction
  enemySplitOnDeath: boolean;
  bossChance: number;

  // World / FX settings
  scoreMultiplier: number;
  screenShakeIntensity: number;
  timeScale: number;
  theme: GameTheme;
  neonGlow: boolean;
  showGrid: boolean;
}

export interface CodeDiff {
  file: string;
  lineRange?: string;
  before: string;
  after: string;
}

export interface PatchRecipe {
  id: string;
  title: string;
  category: "player" | "weapon" | "enemy" | "item" | "fx" | "custom";
  description: string;
  triggerKeywords: string[];
  params: Partial<GameConfig>;
  codeDiff: CodeDiff;
  source: "builtin" | "web_search" | "user";
  tags: string[];
  active?: boolean;
}

export interface ParseResult {
  rawInput: string;
  matchedRecipes: PatchRecipe[];
  extractedParams: Partial<GameConfig>;
  parseTimeMs: number;
  log: string;
  matchedKeywords: string[];
  isCustomFormula?: boolean;
}

export interface WebCitation {
  title: string;
  url: string;
}

export interface WebHarvestResponse {
  summary: string;
  searchCitations: WebCitation[];
  recipes: PatchRecipe[];
}
