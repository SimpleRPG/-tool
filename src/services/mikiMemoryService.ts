// Miki AI Memory Layers Implementation for SimpleRPG Dev Studio
// Combines Long-Term Memory, Structural Graph Memory, Meta-Memory, and Brain Capsule Storage
// Backed by Capacitor Preferences & Filesystem with automatic browser dev fallback.

import {
  MikiLongTermMemory,
  MikiStructuralMemory,
  MikiMetaMemory,
  MikiBrainCapsule,
  MemoryGraphNode,
  SimpleRpgFile,
} from "../types";
import { nativeStorage } from "./nativeStorage";

const KEYS = {
  LONG_TERM: "miki_rpg_long_term_memory_v2",
  CAPSULE_INDEX: "miki_rpg_capsule_index_v2",
};

// Initial Long-Term Memories
const INITIAL_MEMORIES: MikiLongTermMemory[] = [
  {
    id: "mem_init_01",
    timestamp: Date.now() - 3600000 * 2,
    type: "snapshot_created",
    title: "しんぷるRPG 開発スタジオ初期化",
    description: "みきAI記憶層とSimpleRPGファイルツリー（enemy-data, combat-equip, items, craft）がマウントされました。",
    importance: 5,
    affectedFiles: ["enemy-data.js", "combat-equip-data.js", "battle-items.js", "craft-data.js"],
    tags: ["初期化", "システム", "コア"],
  },
  {
    id: "mem_init_02",
    timestamp: Date.now() - 3600000,
    type: "test_play",
    title: "ミキAI 初期戦闘バランステスト",
    description: "みどりスライムvsひのきの棒で100戦シミュレーションを実行。プレイヤー勝率98%、平均ターン3.2。",
    importance: 4,
    affectedFiles: ["enemy-data.js", "combat-equip-data.js"],
    testMetrics: {
      winRate: 98,
      avgTurns: 3.2,
      balanceScore: 92,
    },
    tags: ["ミキAI", "テストプレイ", "スライム"],
  },
];

type CapsuleMeta = Omit<MikiBrainCapsule, "files">;

export class MikiMemoryService {
  // ----------------------------------------------------
  // 1. Long-Term Memory (localStorage → Preferences化、非同期に変更)
  // ----------------------------------------------------
  static async getLongTermMemories(): Promise<MikiLongTermMemory[]> {
    return nativeStorage.getJSON(KEYS.LONG_TERM, INITIAL_MEMORIES);
  }

  static async addMemory(
    memory: Omit<MikiLongTermMemory, "id" | "timestamp">
  ): Promise<MikiLongTermMemory> {
    const list = await this.getLongTermMemories();
    const newEntry: MikiLongTermMemory = {
      ...memory,
      id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
    };
    const updated = [newEntry, ...list].slice(0, 300);
    await nativeStorage.setJSON(KEYS.LONG_TERM, updated);
    return newEntry;
  }

  static async clearMemories(): Promise<void> {
    await nativeStorage.setJSON(KEYS.LONG_TERM, []);
  }

  // ----------------------------------------------------
  // 2. Structural Memory: 既存の buildStructuralGraph (純粋関数)
  // ----------------------------------------------------
  static buildStructuralGraph(files: SimpleRpgFile[]): MikiStructuralMemory {
    const nodes: MemoryGraphNode[] = [];

    files.forEach((file) => {
      if (file.path.includes("enemy-data")) {
        // Parse enemies
        const enemyMatches = file.content.match(/name:\s*["']([^"']+)["']/g) || [];
        const hpMatches = file.content.match(/hp:\s*(\d+)/g) || [];
        const atkMatches = file.content.match(/atk:\s*(\d+)/g) || [];
        const dropMatches = file.content.match(/dropItem:\s*["']([^"']+)["']/g) || [];

        enemyMatches.forEach((m, idx) => {
          const name = m.replace(/name:\s*["']|["']/g, "");
          const hp = hpMatches[idx] ? parseInt(hpMatches[idx].replace(/hp:\s*/, ""), 10) : 30;
          const atk = atkMatches[idx] ? parseInt(atkMatches[idx].replace(/atk:\s*/, ""), 10) : 10;
          const drop = dropMatches[idx] ? dropMatches[idx].replace(/dropItem:\s*["']|["']/g, "") : "none";

          nodes.push({
            id: `enemy_${name}`,
            label: name,
            category: "enemy",
            file: file.path,
            dependencies: drop !== "none" ? [`item_${drop}`] : [],
            properties: { hp, atk, drop },
          });
        });
      } else if (file.path.includes("combat-equip")) {
        // Parse weapons & armor
        const weaponMatches = file.content.match(/name:\s*["']([^"']+)["']/g) || [];
        const atkMatches = file.content.match(/atk:\s*(\d+)/g) || [];

        weaponMatches.forEach((m, idx) => {
          const name = m.replace(/name:\s*["']|["']/g, "");
          const atk = atkMatches[idx] ? parseInt(atkMatches[idx].replace(/atk:\s*/, ""), 10) : 5;
          nodes.push({
            id: `weapon_${name}`,
            label: name,
            category: "weapon",
            file: file.path,
            dependencies: ["game-core-1.js"],
            properties: { atk },
          });
        });
      } else if (file.path.includes("battle-items")) {
        // Parse items
        const itemMatches = file.content.match(/name:\s*["']([^"']+)["']/g) || [];
        const healMatches = file.content.match(/healHp:\s*(\d+)/g) || [];

        itemMatches.forEach((m, idx) => {
          const name = m.replace(/name:\s*["']|["']/g, "");
          const heal = healMatches[idx] ? parseInt(healMatches[idx].replace(/healHp:\s*/, ""), 10) : 30;
          nodes.push({
            id: `item_${name}`,
            label: name,
            category: "item",
            file: file.path,
            dependencies: [],
            properties: { healHp: heal },
          });
        });
      } else if (file.path.includes("craft-data")) {
        // Parse craft recipes
        const craftMatches = file.content.match(/resultItem:\s*["']([^"']+)["']/g) || [];
        craftMatches.forEach((m) => {
          const res = m.replace(/resultItem:\s*["']|["']/g, "");
          nodes.push({
            id: `craft_${res}`,
            label: `合成[${res}]`,
            category: "craft",
            file: file.path,
            dependencies: [`item_${res}`],
            properties: { result: res },
          });
        });
      } else {
        nodes.push({
          id: `module_${file.path}`,
          label: file.path,
          category: "system",
          file: file.path,
          dependencies: [],
          properties: { size: file.content.length },
        });
      }
    });

    return {
      nodes,
      lastIndexed: Date.now(),
    };
  }

  // ----------------------------------------------------
  // 3. Meta-Memory (メタ記憶・確信度・健全性評価)
  // ----------------------------------------------------
  static evaluateMetaMemory(files: SimpleRpgFile[], memories: MikiLongTermMemory[]): MikiMetaMemory {
    const totalFiles = files.length;
    const modifiedCount = files.filter((f) => f.modified).length;

    // Check untested patches since last test_play
    const lastTestIndex = memories.findIndex((m) => m.type === "test_play");
    const untestedPatches = lastTestIndex === -1 ? memories.length : lastTestIndex;

    const knownIssues: string[] = [];
    const recommendations: string[] = [];

    // Health score calculation
    let healthScore = 100;

    if (untestedPatches > 3) {
      healthScore -= 15;
      knownIssues.push(`直近で${untestedPatches}件のコード改変が未テストのまま蓄積されています。`);
      recommendations.push("ミキAIの戦闘シミュレーションを実行してバランスを検証してください。");
    }

    // Check enemy HP sanity
    const enemyFile = files.find((f) => f.path.includes("enemy-data"));
    if (enemyFile && enemyFile.content.includes("hp: 0")) {
      healthScore -= 30;
      knownIssues.push("enemy-data.js 内にHPが0以下のモンスターが存在する可能性があります。");
      recommendations.push("モンスターのHP設定値を見直してください。");
    }

    if (modifiedCount > 0) {
      recommendations.push(`変更中のファイルが${modifiedCount}件あります。必要に応じてブレインカプセル（スナップショット）を作成してください。`);
    }

    let stabilityRating: "STABLE" | "TESTING_NEEDED" | "CRITICAL_DRIFT" = "STABLE";
    if (healthScore < 70) {
      stabilityRating = "CRITICAL_DRIFT";
    } else if (untestedPatches > 2 || healthScore < 90) {
      stabilityRating = "TESTING_NEEDED";
    }

    return {
      totalFiles,
      totalModifications: modifiedCount,
      untestedPatches,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      stabilityRating,
      knownIssues,
      recommendations,
    };
  }

  // ----------------------------------------------------
  // 4. Brain Capsule: メタ情報は Preferences、ファイル実体は Filesystem
  // ----------------------------------------------------
  static async getBrainCapsules(): Promise<MikiBrainCapsule[]> {
    const index = await nativeStorage.getJSON<CapsuleMeta[]>(KEYS.CAPSULE_INDEX, []);
    return Promise.all(
      index.map(async (meta) => {
        const files =
          (await nativeStorage.readLargeFile<Record<string, string>>(meta.id)) || {};
        return { ...meta, files };
      })
    );
  }

  static async createBrainCapsule(
    label: string,
    files: SimpleRpgFile[],
    description?: string
  ): Promise<MikiBrainCapsule> {
    const index = await nativeStorage.getJSON<CapsuleMeta[]>(KEYS.CAPSULE_INDEX, []);
    const filesDict: Record<string, string> = {};
    files.forEach((f) => {
      filesDict[f.path] = f.content;
    });

    const id = `capsule_${Date.now()}`;
    const meta: CapsuleMeta = {
      id,
      label,
      timestamp: Date.now(),
      description: description || `スナップショット (${files.length}ファイル保存)`,
      memoryCount: (await this.getLongTermMemories()).length,
      tags: ["スナップショット", "ロールバック可能"],
    };

    await nativeStorage.writeLargeFile(id, filesDict);

    const MAX_CAPSULES = 50;
    const updatedIndex = [meta, ...index].slice(0, MAX_CAPSULES);
    const overflow = index.slice(MAX_CAPSULES - 1);
    for (const old of overflow) {
      await nativeStorage.deleteLargeFile(old.id);
    }
    await nativeStorage.setJSON(KEYS.CAPSULE_INDEX, updatedIndex);

    await this.addMemory({
      type: "snapshot_created",
      title: `カプセル保存: ${label}`,
      description: `全${files.length}個のしんぷるRPGファイルをスナップショットとして退避しました。`,
      importance: 3,
      affectedFiles: Object.keys(filesDict),
      tags: ["カプセル", "安全バックアップ"],
    });

    return { ...meta, files: filesDict };
  }

  static async deleteCapsule(id: string): Promise<void> {
    const index = await nativeStorage.getJSON<CapsuleMeta[]>(KEYS.CAPSULE_INDEX, []);
    await nativeStorage.setJSON(
      KEYS.CAPSULE_INDEX,
      index.filter((c) => c.id !== id)
    );
    await nativeStorage.deleteLargeFile(id);
  }
}
