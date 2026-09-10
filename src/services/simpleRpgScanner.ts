// SimpleRPG Dynamic VFS Scanner & Mutator
// Deep-scans ANY SimpleRPG project (default or user-imported ZIP)
// Extracts enemies, weapons, armors, items, skills, and player stats,
// and provides direct code mutations back to the VFS.

import { SimpleRpgFile } from "../types";

export interface ScannedEnemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  exp: number;
  gold: number;
  sprite?: string;
  sourceFile: string;
  rawJsonSnippet?: string;
}

export interface ScannedWeapon {
  id: string;
  name: string;
  atk: number;
  critRate?: number;
  sourceFile: string;
}

export interface ScannedArmor {
  id: string;
  name: string;
  def: number;
  hpBonus?: number;
  sourceFile: string;
}

export interface ScannedItem {
  id: string;
  name: string;
  healHp?: number;
  healMp?: number;
  damage?: number;
  sourceFile: string;
}

export interface ScannedSkill {
  id: string;
  name: string;
  mpCost: number;
  damage: number;
  sourceFile: string;
}

export interface ScannedPlayerStatus {
  hp: number;
  maxHp: number;
  mp: number;
  gold: number;
  level: number;
  sourceFile: string;
}

export interface SimpleRpgScanReport {
  enemies: ScannedEnemy[];
  weapons: ScannedWeapon[];
  armors: ScannedArmor[];
  items: ScannedItem[];
  skills: ScannedSkill[];
  player: ScannedPlayerStatus | null;
  detectedFilesCount: number;
  detectionFlags: {
    enemiesDetected: boolean;
    weaponsDetected: boolean;
    armorsDetected: boolean;
    itemsDetected: boolean;
    skillsDetected: boolean;
    playerDetected: boolean;
  };
}

export class SimpleRpgScanner {
  /**
   * Deep scan all files in VFS to discover game entities
   */
  static scanProject(files: SimpleRpgFile[]): SimpleRpgScanReport {
    const enemies: ScannedEnemy[] = [];
    const weapons: ScannedWeapon[] = [];
    const armors: ScannedArmor[] = [];
    const items: ScannedItem[] = [];
    const skills: ScannedSkill[] = [];
    let player: ScannedPlayerStatus | null = null;
    let playerFound = false;

    // Filter code files
    const codeFiles = files.filter(
      (f) =>
        f.path.endsWith(".js") ||
        f.path.endsWith(".ts") ||
        f.path.endsWith(".html") ||
        f.path.endsWith(".json")
    );

    // ========================================================
    // 1. Scan for Enemies
    // ========================================================
    for (const file of codeFiles) {
      const content = file.content;

      // Pattern A: Array of enemy objects (e.g. ENEMIES = [...], ENEMY_DATABASE = [...], monsters = [...])
      const arrayMatch = content.match(/(?:ENEMY_DATABASE|ENEMIES|monsters|enemyList|bosses)\s*=\s*(\[[\s\S]*?\]);/);
      if (arrayMatch) {
        try {
          const evalFn = new Function(`return ${arrayMatch[1]};`);
          const arr = evalFn();
          if (Array.isArray(arr) && arr.length > 0) {
            arr.forEach((item: any, idx: number) => {
              if (item && (item.name || item.id)) {
                enemies.push({
                  id: item.id || `enemy_${idx}`,
                  name: item.name || `モンスター ${idx + 1}`,
                  hp: Number(item.hp) || 25,
                  maxHp: Number(item.maxHp || item.hp) || 25,
                  atk: Number(item.atk) || 6,
                  def: Number(item.def) || 2,
                  exp: Number(item.exp) || 8,
                  gold: Number(item.gold) || 5,
                  sprite: item.sprite || (item.color ? "🟢" : "👾"),
                  sourceFile: file.path,
                });
              }
            });
          }
        } catch {
          // ignore eval fail
        }
      }

      // Pattern B: Variables in script (e.g. let enemyName = "みどりスライム"; let enemyHp = 25;)
      if (enemies.length === 0) {
        const nameMatch = content.match(/(?:let|var|const)\s+enemyName\s*=\s*["'`]([^"'`]+)["'`]/);
        const hpMatch = content.match(/(?:let|var|const)\s+enemyHp\s*=\s*(\d+)/);
        const maxHpMatch = content.match(/(?:let|var|const)\s+enemyMaxHp\s*=\s*(\d+)/);
        const atkMatch = content.match(/(?:let|var|const)\s+enemyAtk\s*=\s*(\d+)/) || content.match(/Math\.floor\((\d+)\s*\+\s*Math\.random/);

        if (nameMatch || hpMatch) {
          const eName = nameMatch ? nameMatch[1] : "みどりスライム";
          const eHp = hpMatch ? parseInt(hpMatch[1], 10) : 25;
          const eMaxHp = maxHpMatch ? parseInt(maxHpMatch[1], 10) : eHp;
          const eAtk = atkMatch ? parseInt(atkMatch[1], 10) : 6;

          enemies.push({
            id: "current_enemy",
            name: eName,
            hp: eHp,
            maxHp: eMaxHp,
            atk: eAtk,
            def: 2,
            exp: 10,
            gold: 5,
            sprite: "🟢",
            sourceFile: file.path,
          });
        }
      }
    }

    // ========================================================
    // 2. Scan for Weapons & Armors
    // ========================================================
    for (const file of codeFiles) {
      const content = file.content;

      // Weapons Array
      const wMatch = content.match(/(?:WEAPON_DATABASE|weapons|swords)\s*=\s*(\[[\s\S]*?\]);/);
      if (wMatch) {
        try {
          const evalFn = new Function(`return ${wMatch[1]};`);
          const arr = evalFn();
          if (Array.isArray(arr)) {
            arr.forEach((w: any, idx: number) => {
              if (w && w.name) {
                weapons.push({
                  id: w.id || `weapon_${idx}`,
                  name: w.name,
                  atk: Number(w.atk) || 3,
                  critRate: Number(w.critRate) || 0.05,
                  sourceFile: file.path,
                });
              }
            });
          }
        } catch {}
      }

      // Single Weapon Variable: let weaponAtk = 3
      const singleWpnMatch = content.match(/(?:let|var|const)\s+weaponAtk\s*=\s*(\d+)/);
      const wpnNameMatch = content.match(/(?:let|var|const)\s+weaponName\s*=\s*["'`]([^"'`]+)["'`]/);
      if (singleWpnMatch && weapons.length === 0) {
        weapons.push({
          id: "weapon_current",
          name: wpnNameMatch ? wpnNameMatch[1] : "ひのきの棒 (装備武器)",
          atk: parseInt(singleWpnMatch[1], 10),
          critRate: 0.05,
          sourceFile: file.path,
        });
      }

      // Armors Array
      const aMatch = content.match(/(?:ARMOR_DATABASE|armors|shields)\s*=\s*(\[[\s\S]*?\]);/);
      if (aMatch) {
        try {
          const evalFn = new Function(`return ${aMatch[1]};`);
          const arr = evalFn();
          if (Array.isArray(arr)) {
            arr.forEach((a: any, idx: number) => {
              if (a && a.name) {
                armors.push({
                  id: a.id || `armor_${idx}`,
                  name: a.name,
                  def: Number(a.def) || 2,
                  hpBonus: Number(a.hpBonus) || 0,
                  sourceFile: file.path,
                });
              }
            });
          }
        } catch {}
      }

      // Single Armor Variable: let armorDef = 2
      const singleArmorMatch = content.match(/(?:let|var|const)\s+armorDef\s*=\s*(\d+)/);
      const armorNameMatch = content.match(/(?:let|var|const)\s+armorName\s*=\s*["'`]([^"'`]+)["'`]/);
      if (singleArmorMatch && armors.length === 0) {
        armors.push({
          id: "armor_current",
          name: armorNameMatch ? armorNameMatch[1] : "布の服 (装備防具)",
          def: parseInt(singleArmorMatch[1], 10),
          hpBonus: 5,
          sourceFile: file.path,
        });
      }
    }

    // ========================================================
    // 3. Scan for Items (持ち物)
    // ========================================================
    for (const file of codeFiles) {
      const content = file.content;

      // Array of Items
      const itemMatch = content.match(/(?:BATTLE_ITEMS|items|inventory)\s*=\s*(\[[\s\S]*?\]);/);
      if (itemMatch) {
        try {
          const evalFn = new Function(`return ${itemMatch[1]};`);
          const arr = evalFn();
          if (Array.isArray(arr)) {
            arr.forEach((it: any, idx: number) => {
              if (it && it.name) {
                items.push({
                  id: it.id || `item_${idx}`,
                  name: it.name,
                  healHp: it.healHp,
                  healMp: it.healMp,
                  damage: it.damage,
                  sourceFile: file.path,
                });
              }
            });
          }
        } catch {}
      }

      // Inline Item: やくそう heal
      const herbMatch = content.match(/playerHp\s*\+\s*(\d+)/) || content.match(/(?:let|var|const)\s+herbHeal\s*=\s*(\d+)/);
      if (herbMatch && items.length === 0) {
        items.push({
          id: "herb",
          name: "やくそう",
          healHp: parseInt(herbMatch[1], 10),
          sourceFile: file.path,
        });
      }
    }

    // ========================================================
    // 4. Scan for Skills & Magic (スキル・魔法)
    // ========================================================
    for (const file of codeFiles) {
      const content = file.content;

      // Magic inline check (e.g. ギガデイン mp 10, dmg 45)
      const mpCostMatch = content.match(/playerMp\s*(?:-=|<)\s*(\d+)/);
      const magicDmgMatch = content.match(/(?:let|var|const)\s+dmg\s*=\s*(\d+);[\s\S]*?ギガデイン/) || content.match(/const\s+dmg\s*=\s*(\d+);/);

      if (content.includes("ギガデイン") || mpCostMatch) {
        skills.push({
          id: "gigadein",
          name: "ギガデイン (雷撃魔法)",
          mpCost: mpCostMatch ? parseInt(mpCostMatch[1], 10) : 10,
          damage: magicDmgMatch ? parseInt(magicDmgMatch[1], 10) : 45,
          sourceFile: file.path,
        });
      }
    }

    // ========================================================
    // 5. Scan for Player Status
    // ========================================================
    for (const file of codeFiles) {
      const content = file.content;

      const hpMatch = content.match(/(?:let|var|const)\s+playerHp\s*=\s*(\d+)/);
      const maxHpMatch = content.match(/(?:let|var|const)\s+playerMaxHp\s*=\s*(\d+)/);
      const mpMatch = content.match(/(?:let|var|const)\s+playerMp\s*=\s*(\d+)/);
      const goldMatch = content.match(/(?:let|var|const)\s+gold\s*=\s*(\d+)/);

      if (hpMatch || maxHpMatch || mpMatch || goldMatch) {
        player = {
          hp: hpMatch ? parseInt(hpMatch[1], 10) : 80,
          maxHp: maxHpMatch ? parseInt(maxHpMatch[1], 10) : 80,
          mp: mpMatch ? parseInt(mpMatch[1], 10) : 30,
          gold: goldMatch ? parseInt(goldMatch[1], 10) : 120,
          level: 1,
          sourceFile: file.path,
        };
        playerFound = true;
        break;
      }
    }

    // Deduplicate entities across all scanned files to ensure unique IDs and clean UI rendering
    const dedupedEnemies: ScannedEnemy[] = [];
    const enemyMap = new Map<string, number>();
    for (const e of enemies) {
      const key = e.id || e.name;
      if (!enemyMap.has(key)) {
        enemyMap.set(key, dedupedEnemies.length);
        dedupedEnemies.push(e);
      } else {
        const existingIdx = enemyMap.get(key)!;
        const existing = dedupedEnemies[existingIdx];
        // Prefer dedicated database file or richer entity data
        if (e.sourceFile.includes("enemy") && !existing.sourceFile.includes("enemy")) {
          dedupedEnemies[existingIdx] = { ...existing, ...e };
        } else {
          dedupedEnemies[existingIdx] = { ...e, ...existing };
        }
      }
    }

    const dedupedWeapons: ScannedWeapon[] = [];
    const weaponMap = new Map<string, number>();
    for (const w of weapons) {
      const key = w.id || w.name;
      if (!weaponMap.has(key)) {
        weaponMap.set(key, dedupedWeapons.length);
        dedupedWeapons.push(w);
      } else {
        const existingIdx = weaponMap.get(key)!;
        const existing = dedupedWeapons[existingIdx];
        if (w.sourceFile.includes("equip") || w.sourceFile.includes("combat") || w.sourceFile.includes("weapon")) {
          dedupedWeapons[existingIdx] = { ...existing, ...w };
        }
      }
    }

    const dedupedArmors: ScannedArmor[] = [];
    const armorMap = new Map<string, number>();
    for (const a of armors) {
      const key = a.id || a.name;
      if (!armorMap.has(key)) {
        armorMap.set(key, dedupedArmors.length);
        dedupedArmors.push(a);
      }
    }

    const dedupedItems: ScannedItem[] = [];
    const itemMap = new Map<string, number>();
    for (const it of items) {
      const key = it.id || it.name;
      if (!itemMap.has(key)) {
        itemMap.set(key, dedupedItems.length);
        dedupedItems.push(it);
      }
    }

    const dedupedSkills: ScannedSkill[] = [];
    const skillMap = new Map<string, number>();
    for (const sk of skills) {
      const key = sk.id || sk.name;
      if (!skillMap.has(key)) {
        skillMap.set(key, dedupedSkills.length);
        dedupedSkills.push(sk);
      }
    }

    const detectionFlags = {
      enemiesDetected: dedupedEnemies.length > 0,
      weaponsDetected: dedupedWeapons.length > 0,
      armorsDetected: dedupedArmors.length > 0,
      itemsDetected: dedupedItems.length > 0,
      skillsDetected: dedupedSkills.length > 0,
      playerDetected: playerFound,
    };

    return {
      enemies: dedupedEnemies,
      weapons: dedupedWeapons,
      armors: dedupedArmors,
      items: dedupedItems,
      skills: dedupedSkills,
      player,
      detectedFilesCount: files.length,
      detectionFlags,
    };
  }

  /**
   * Directly update an Enemy's stats in the project VFS files
   */
  static updateEnemyInFiles(
    files: SimpleRpgFile[],
    targetEnemyName: string,
    updates: { hp?: number; maxHp?: number; atk?: number; def?: number; gold?: number; name?: string }
  ): SimpleRpgFile[] {
    return files.map((file) => {
      let content = file.content;
      let touched = false;

      // 1. Check if file has ENEMIES / ENEMY_DATABASE array
      const escapedName = targetEnemyName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const objRegex = new RegExp(`(\\{[^{}]*?name\\s*:\\s*["'\`]${escapedName}["'\`][^{}]*?\\})`, "g");

      if (objRegex.test(content)) {
        content = content.replace(objRegex, (block) => {
          let updatedBlock = block;
          if (updates.hp !== undefined) {
            updatedBlock = updatedBlock.replace(/hp\s*:\s*\d+/, `hp: ${updates.hp}`);
          }
          if (updates.maxHp !== undefined) {
            updatedBlock = updatedBlock.replace(/maxHp\s*:\s*\d+/, `maxHp: ${updates.maxHp}`);
          }
          if (updates.atk !== undefined) {
            updatedBlock = updatedBlock.replace(/atk\s*:\s*\d+/, `atk: ${updates.atk}`);
          }
          if (updates.def !== undefined) {
            updatedBlock = updatedBlock.replace(/def\s*:\s*\d+/, `def: ${updates.def}`);
          }
          if (updates.gold !== undefined) {
            updatedBlock = updatedBlock.replace(/gold\s*:\s*\d+/, `gold: ${updates.gold}`);
          }
          return updatedBlock;
        });
        touched = true;
      }

      // 2. Check if file has direct variables (like in game-ui.js)
      if (content.includes(`enemyName = "${targetEnemyName}"`) || content.includes(`enemyName = '${targetEnemyName}'`) || content.includes("let enemyHp")) {
        if (updates.hp !== undefined) {
          content = content.replace(/(let\s+enemyHp\s*=\s*)\d+;/, `$1${updates.hp};`);
          content = content.replace(/(var\s+enemyHp\s*=\s*)\d+;/, `$1${updates.hp};`);
        }
        if (updates.maxHp !== undefined) {
          content = content.replace(/(let\s+enemyMaxHp\s*=\s*)\d+;/, `$1${updates.maxHp};`);
          content = content.replace(/(var\s+enemyMaxHp\s*=\s*)\d+;/, `$1${updates.maxHp};`);
        }
        if (updates.name !== undefined) {
          content = content.replace(/(let\s+enemyName\s*=\s*["'`])[^"'`]+(["'`];)/, `$1${updates.name}$2`);
        }
        touched = true;
      }

      if (touched) {
        return {
          ...file,
          content,
          modified: true,
          size: content.length,
        };
      }
      return file;
    });
  }

  /**
   * Set the active enemy fighting in game-ui.js or live game script
   */
  static setActiveEnemyInGame(files: SimpleRpgFile[], enemy: ScannedEnemy): SimpleRpgFile[] {
    return files.map((file) => {
      if (!file.path.endsWith(".js") && !file.path.endsWith(".html")) return file;

      let content = file.content;
      let touched = false;

      // If game has let enemyName = "..." and let enemyHp = ...
      if (content.includes("enemyName") && content.includes("enemyHp")) {
        content = content.replace(/(let\s+enemyName\s*=\s*["'`])[^"'`]+(["'`];)/, `$1${enemy.name}$2`);
        content = content.replace(/(let\s+enemyHp\s*=\s*)\d+;/, `$1${enemy.hp};`);
        content = content.replace(/(let\s+enemyMaxHp\s*=\s*)\d+;/, `$1${enemy.maxHp};`);
        touched = true;
      }

      // Also replace in HTML default text if present
      if (file.path.endsWith(".html") && content.includes('id="enemyName"')) {
        content = content.replace(/(<span[^>]*?id="enemyName"[^>]*?>)[^<]+(<\/span>)/, `$1${enemy.name}$2`);
        content = content.replace(/(<strong[^>]*?id="enemyHp"[^>]*?>)\d+(<\/strong>)/, `$1${enemy.hp}$2`);
        content = content.replace(/(<span[^>]*?id="enemyMaxHp"[^>]*?>)\d+(<\/span>)/, `$1${enemy.maxHp}$2`);
        touched = true;
      }

      if (touched) {
        return { ...file, content, modified: true, size: content.length };
      }
      return file;
    });
  }

  /**
   * Update Weapon Attack in files
   */
  static updateWeaponInFiles(files: SimpleRpgFile[], weaponId: string, newAtk: number): SimpleRpgFile[] {
    return files.map((file) => {
      let content = file.content;
      let touched = false;

      // In script: let weaponAtk = 3
      if (content.includes("weaponAtk")) {
        content = content.replace(/(let\s+weaponAtk\s*=\s*)\d+;/, `$1${newAtk};`);
        content = content.replace(/(var\s+weaponAtk\s*=\s*)\d+;/, `$1${newAtk};`);
        touched = true;
      }

      // In array: id: "wooden_stick", atk: 3
      const idRegex = new RegExp(`(id\\s*:\\s*["'\`]${weaponId}["'\`][\\s\\S]*?atk\\s*:\\s*)\\d+`);
      if (idRegex.test(content)) {
        content = content.replace(idRegex, `$1${newAtk}`);
        touched = true;
      }

      if (touched) {
        return { ...file, content, modified: true, size: content.length };
      }
      return file;
    });
  }

  /**
   * Update Item Heal in files
   */
  static updateItemInFiles(files: SimpleRpgFile[], itemId: string, newHeal: number): SimpleRpgFile[] {
    return files.map((file) => {
      let content = file.content;
      let touched = false;

      // In script: playerHp + 35
      if (content.includes("playerHp + ") || content.includes("herbHeal")) {
        content = content.replace(/(playerHp\s*\+\s*)\d+/, `$1${newHeal}`);
        content = content.replace(/(let\s+herbHeal\s*=\s*)\d+;/, `$1${newHeal};`);
        touched = true;
      }

      // In array: id: "herb", healHp: 35
      const idRegex = new RegExp(`(id\\s*:\\s*["'\`]${itemId}["'\`][\\s\\S]*?healHp\\s*:\\s*)\\d+`);
      if (idRegex.test(content)) {
        content = content.replace(idRegex, `$1${newHeal}`);
        touched = true;
      }

      if (touched) {
        return { ...file, content, modified: true, size: content.length };
      }
      return file;
    });
  }

  /**
   * Update Skill (e.g. Gigadein) MP cost & damage in files
   */
  static updateSkillInFiles(files: SimpleRpgFile[], skillId: string, newMpCost: number, newDamage: number): SimpleRpgFile[] {
    return files.map((file) => {
      let content = file.content;
      let touched = false;

      // In script: playerMp < 10, playerMp -= 10, const dmg = 45;
      if (content.includes("ギガデイン") || content.includes("btnMagic")) {
        content = content.replace(/(playerMp\s*<\s*)\d+/, `$1${newMpCost}`);
        content = content.replace(/(playerMp\s*-=\s*)\d+/, `$1${newMpCost}`);
        content = content.replace(/(const\s+dmg\s*=\s*)\d+;/, `$1${newDamage};`);
        touched = true;
      }

      if (touched) {
        return { ...file, content, modified: true, size: content.length };
      }
      return file;
    });
  }

  /**
   * Update Player initial status (HP, MP, Gold) in files
   */
  static updatePlayerStatusInFiles(
    files: SimpleRpgFile[],
    newStats: { hp?: number; maxHp?: number; mp?: number; gold?: number }
  ): SimpleRpgFile[] {
    return files.map((file) => {
      let content = file.content;
      let touched = false;

      if (newStats.hp !== undefined) {
        content = content.replace(/(let\s+playerHp\s*=\s*)\d+;/, `$1${newStats.hp};`);
        touched = true;
      }
      if (newStats.maxHp !== undefined) {
        content = content.replace(/(let\s+playerMaxHp\s*=\s*)\d+;/, `$1${newStats.maxHp};`);
        touched = true;
      }
      if (newStats.mp !== undefined) {
        content = content.replace(/(let\s+playerMp\s*=\s*)\d+;/, `$1${newStats.mp};`);
        touched = true;
      }
      if (newStats.gold !== undefined) {
        content = content.replace(/(let\s+gold\s*=\s*)\d+;/, `$1${newStats.gold};`);
        touched = true;
      }

      // Also in HTML defaults
      if (file.path.endsWith(".html")) {
        if (newStats.hp !== undefined) {
          content = content.replace(/(<strong[^>]*?id="valHp"[^>]*?>)\d+(<\/strong>)/, `$1${newStats.hp}$2`);
          touched = true;
        }
        if (newStats.mp !== undefined) {
          content = content.replace(/(<strong[^>]*?id="valMp"[^>]*?>)\d+(<\/strong>)/, `$1${newStats.mp}$2`);
          touched = true;
        }
        if (newStats.gold !== undefined) {
          content = content.replace(/(<strong[^>]*?id="valGold"[^>]*?>)\d+(<\/strong>)/, `$1${newStats.gold}$2`);
          touched = true;
        }
      }

      if (touched) {
        return { ...file, content, modified: true, size: content.length };
      }
      return file;
    });
  }
}
