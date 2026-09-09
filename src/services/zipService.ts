// ZIP Import / Export Service & Android APK Kit Generator for SimpleRPG
// Uses JSZip purely in-browser (Client-side, 100% offline, zero latency)

import JSZip from "jszip";
import { SimpleRpgFile, ApkExportConfig } from "../types";

export class SimpleRpgZipService {
  /**
   * Import SimpleRPG ZIP file and extract all text assets into SimpleRpgFile[]
   */
  static async importZip(file: File): Promise<SimpleRpgFile[]> {
    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(file);
    const resultFiles: SimpleRpgFile[] = [];

    const fileEntries = Object.keys(loadedZip.files);

    for (const rawPath of fileEntries) {
      const entry = loadedZip.files[rawPath];
      if (entry.dir) continue;

      // Ignore macOS and hidden meta files
      if (rawPath.startsWith("__MACOSX/") || rawPath.includes("/.") || rawPath.startsWith(".")) continue;

      const relativePath = rawPath.replace(/\\/g, "/");

      // Filter text-based code files
      const isCodeFile =
        relativePath.endsWith(".js") ||
        relativePath.endsWith(".ts") ||
        relativePath.endsWith(".json") ||
        relativePath.endsWith(".html") ||
        relativePath.endsWith(".css");

      if (isCodeFile) {
        try {
          const content = await entry.async("string");
          // Determine category
          let category: SimpleRpgFile["category"] = "system";
          if (relativePath.includes("enemy") || relativePath.includes("equip") || relativePath.includes("item") || relativePath.includes("craft")) {
            category = "data";
          } else if (relativePath.includes("core")) {
            category = "core";
          } else if (relativePath.includes("ui") || relativePath.includes("html")) {
            category = "ui";
          } else if (relativePath.includes("style")) {
            category = "style";
          } else if (relativePath.includes("test") || relativePath.includes("miki")) {
            category = "test";
          }

          resultFiles.push({
            path: relativePath,
            content,
            category,
            modified: false,
            size: content.length,
          });
        } catch (e) {
          console.warn(`Could not read ${relativePath} as text:`, e);
        }
      }
    }

    // If all files share a common root directory (e.g. "SimpleRPG-main/"), strip it for clean execution
    if (resultFiles.length > 0) {
      const firstSlash = resultFiles[0].path.indexOf("/");
      if (firstSlash > 0) {
        const rootFolder = resultFiles[0].path.substring(0, firstSlash + 1);
        const allShare = resultFiles.every((f) => f.path.startsWith(rootFolder));
        if (allShare) {
          resultFiles.forEach((f) => {
            f.path = f.path.substring(rootFolder.length);
          });
        }
      }
    }

    return resultFiles;
  }

  /**
   * Export current SimpleRPG files into a clean ZIP archive
   */
  static async exportZip(files: SimpleRpgFile[], zipFileName = "SimpleRPG_custom.zip"): Promise<void> {
    const zip = new JSZip();

    files.forEach((file) => {
      zip.file(file.path, file.content);
    });

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = zipFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Export an Android APK-ready Capacitor Kit for SimpleRPG
   */
  static async exportApkKit(
    files: SimpleRpgFile[],
    config: ApkExportConfig = {
      appId: "com.simplerpg.app",
      appName: "しんぷるRPG",
      versionName: "1.0.0",
      versionCode: 1,
      orientation: "portrait",
      permissions: ["android.permission.INTERNET"],
    }
  ): Promise<void> {
    const zip = new JSZip();

    // 1. Add all game files into www/ directory
    const wwwFolder = zip.folder("www");
    if (wwwFolder) {
      files.forEach((f) => {
        wwwFolder.file(f.path, f.content);
      });
    }

    // 2. capacitor.config.json
    const capacitorConfig = {
      appId: config.appId,
      appName: config.appName,
      webDir: "www",
      bundledWebRuntime: false,
      android: {
        allowMixedContent: true,
      },
    };
    zip.file("capacitor.config.json", JSON.stringify(capacitorConfig, null, 2));

    // 3. package.json for build
    const packageJson = {
      name: "simple-rpg-android-apk",
      version: config.versionName,
      private: true,
      scripts: {
        "build:apk": "npx cap sync android && cd android && ./gradlew assembleDebug",
        "open:android": "npx cap open android",
      },
      dependencies: {
        "@capacitor/android": "^6.0.0",
        "@capacitor/cli": "^6.0.0",
        "@capacitor/core": "^6.0.0",
      },
    };
    zip.file("package.json", JSON.stringify(packageJson, null, 2));

    // 4. Android Build Instructions README
    const readme = `# 📱 しんぷるRPG Android APK ビルド手順書

このZIPキットは、しんぷるRPGをAndroid端末（Galaxy S25など）で直接動作するAPKファイルにパッケージングするための構成一式です。

## 🚀 1ステップでAPKを作成する方法 (Capacitor利用)

1. このZIPを展開します。
\`\`\`bash
unzip simple-rpg-apk-kit.zip
cd simple-rpg-apk-kit
\`\`\`

2. 依存関係をインストールし、Androidプロジェクトを生成します:
\`\`\`bash
npm install
npx cap add android
npx cap sync android
\`\`\`

3. APKをビルドします:
\`\`\`bash
cd android
./gradlew assembleDebug
\`\`\`
※ 生成されたAPKは \`android/app/build/outputs/apk/debug/app-debug.apk\` に出力されます！

4. スマホに転送してインストールすれば、完全オフラインのネイティブRPGアプリとして遊べます！
`;
    zip.file("APK_BUILD_GUIDE.md", readme);

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "simple-rpg-apk-kit.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
