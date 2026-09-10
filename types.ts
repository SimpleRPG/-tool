// Types for SimpleRPG Dev Studio with Miki Brain Architecture

export interface SimpleRpgFile {
  path: string;
  content: string;
  category: "core" | "data" | "ui" | "system" | "test" | "style";
  modified?: boolean;
  size?: number;
}

export interface CodeDiffBlock {
  file: string;
  before: string;
  after: string;
  lineStart?: number;
  lineEnd?: number;
}

// ========================================================
// Miki AI Memory Layers (みきAI 記憶層)
// ========================================================

export interface MikiLongTermMemory {
  id: string;
  timestamp: number;
  type:
    | "patch_applied"
    | "test_play"
    | "test_result"
    | "snapshot_created"
    | "snapshot_restored"
    | "recipe_learned"
    | "rollback"
    | "code_edit"
    | "manual_edit"
    | "file_reset"
    | "factory_reset";
  title: string;
  description: string;
  importance: number; // 1 to 5
  affectedFiles: string[];
  codeDiff?: CodeDiffBlock[];
  testMetrics?: {
    winRate: number;
    avgTurns: number;
    balanceScore: number;
  };
  tags: string[];
}

export interface MemoryGraphNode {
  id: string;
  label: string;
  category: "enemy" | "weapon" | "item" | "skill" | "system" | "craft";
  file: string;
  dependencies: string[]; // ids of connected nodes
  properties: Record<string, any>;
}

export interface MikiStructuralMemory {
  nodes: MemoryGraphNode[];
  lastIndexed: number;
}

export interface MikiMetaMemory {
  totalFiles: number;
  totalModifications: number;
  untestedPatches: number;
  healthScore: number; // 0 - 100
  stabilityRating: "STABLE" | "TESTING_NEEDED" | "CRITICAL_DRIFT";
  knownIssues: string[];
  recommendations: string[];
}

export interface MikiBrainCapsule {
  id: string;
  label: string;
  timestamp: number;
  description: string;
  files: Record<string, string>; // path -> content
  memoryCount: number;
  tags: string[];
}

// ========================================================
// Miki AI Test Runner (ミキAI テストプレイ)
// ========================================================

export interface MikiAiTestRunResult {
  id: string;
  timestamp: number;
  scenario: string; // e.g., "序盤スライム100戦シミュレーション" | "ボス戦バランス測定"
  totalSimulations: number;
  playerWinRate: number; // 0 - 100
  avgDamageDealt: number;
  avgDamageTaken: number;
  avgTurns: number;
  itemConsumptionRate: number;
  balanceRating: "PERFECT" | "SLIGHTLY_HARD" | "SLIGHTLY_EASY" | "TOO_BRUTAL" | "TOO_TRIVIAL";
  mikiAiFeedback: string[];
  logSnippet: string[];
}

// ========================================================
// Recipe & Parser (0.001s Local Zero-Latency Engine)
// ========================================================

export interface RpgPatchRecipe {
  id: string;
  title: string;
  category: "enemy" | "weapon" | "armor" | "item" | "skill" | "craft" | "drop" | "system";
  description: string;
  triggerKeywords: string[];
  targetFile: string;
  codeDiff: CodeDiffBlock;
  previewSnippet: string;
  tags: string[];
}

export interface RpgParseResult {
  rawInput: string;
  matchedRecipes: RpgPatchRecipe[];
  diffs: CodeDiffBlock[];
  parseTimeMs: number;
  log: string;
  matchedKeywords: string[];
  isCustomNumericPatch?: boolean;
}

// ========================================================
// Export & APK Configuration
// ========================================================

export interface ApkExportConfig {
  appId: string;
  appName: string;
  versionName: string;
  versionCode: number;
  orientation: "portrait" | "sensor" | "landscape";
  permissions: string[];
}

// ========================================================
// Schema Detection (スキーマ解析)
// ========================================================

export interface DetectedArraySchema {
  variableName: string;        // 例: "WEAPON_DATABASE"
  sourceFile: string;          // 例: "weapons.js"
  itemShape: Record<string, string>; // 例: { id: "string", name: "string", atk: "number" }
  arrayPath: string;           // 例: "WEAPON_DATABASE[*]"
}

export interface DetectedSchema {
  weapons: DetectedArraySchema | null;
  enemies: DetectedArraySchema | null;
  armors: DetectedArraySchema | null;
  items: DetectedArraySchema | null;
  skills: DetectedArraySchema | null;
  analyzerVersion: "gemini" | "local-regex" | "none";
  analyzedAt: number;
}
