// src/services/schemaAnalyzer.ts
// ローカル正規表現だけでスキーマを解析する。Geminiは呼ばない。

import { SimpleRpgFile, DetectedSchema, DetectedArraySchema } from "../types";

export class SchemaAnalyzer {

  static analyzeSchema(files: SimpleRpgFile[]): DetectedSchema {
    const codeFiles = files.filter(
      (f) => f.path.endsWith(".js") || f.path.endsWith(".ts")
    );

    return {
      weapons: this.findArray(codeFiles, ["WEAPON_DATABASE", "weapons", "swords"]),
      enemies: this.findArray(codeFiles, ["ENEMY_DATABASE", "ENEMIES", "monsters", "enemyList"]),
      armors:  this.findArray(codeFiles, ["ARMOR_DATABASE", "armors", "shields"]),
      items:   this.findArray(codeFiles, ["BATTLE_ITEMS", "items", "inventory"]),
      skills:  this.findArray(codeFiles, ["SKILL_DATABASE", "skills", "magics"]),
      analyzerVersion: "local-regex",
      analyzedAt: Date.now(),
    };
  }

  private static findArray(
    files: SimpleRpgFile[],
    varNames: string[]
  ): DetectedArraySchema | null {
    for (const file of files) {
      for (const varName of varNames) {
        const regex = new RegExp(
          `(?:const|let|var)\\s+${varName}\\s*=\\s*(\\[[\\s\\S]*?\\]);`,
          "m"
        );
        const match = file.content.match(regex);
        if (!match) continue;

        // 配列の最初の要素からitemShapeを推定する
        const itemShape = this.inferItemShape(match[1]);
        if (Object.keys(itemShape).length === 0) continue;

        return {
          variableName: varName,
          sourceFile: file.path,
          itemShape,
          arrayPath: `${varName}[*]`,
        };
      }
    }
    return null;
  }

  private static inferItemShape(arrayStr: string): Record<string, string> {
    // 最初の { ... } を取り出す
    const objMatch = arrayStr.match(/\{([^{}]+)\}/);
    if (!objMatch) return {};

    const shape: Record<string, string> = {};
    // key: value のペアを全部抽出
    const pairs = objMatch[1].matchAll(/(\w+)\s*:\s*([^,}\n]+)/g);
    for (const pair of pairs) {
      const key = pair[1].trim();
      const rawVal = pair[2].trim();
      // 数値かどうか判定
      if (/^-?\d+(\.\d+)?$/.test(rawVal)) {
        shape[key] = "number";
      } else {
        shape[key] = "string";
      }
    }
    return shape;
  }

  // VFSの配列末尾に新しいエントリを挿入する
  static insertEntityIntoVfs(
    files: SimpleRpgFile[],
    schema: DetectedArraySchema,
    newEntry: Record<string, any>
  ): SimpleRpgFile[] {
    return files.map((file) => {
      if (file.path !== schema.sourceFile) return file;

      const varName = schema.variableName;
      const insertionRegex = new RegExp(
        `((?:const|let|var)\\s+${varName}\\s*=\\s*\\[[\\s\\S]*?)(\\s*\\];)`,
        "m"
      );

      if (!insertionRegex.test(file.content)) return file;

      const newEntryStr =
        "\n  " +
        JSON.stringify(newEntry, null, 2).replace(/\n/g, "\n  ") +
        ",";

      const updated = file.content.replace(
        insertionRegex,
        `$1${newEntryStr}$2`
      );

      return { ...file, content: updated, modified: true, size: updated.length };
    });
  }
}
