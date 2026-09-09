// HTML5 Live Game Engine for SimpleRPG
// Dynamically resolves HTML, scripts, CSS, and assets from the Virtual File System (VFS)
// Runs 100% client-side inside an isolated sandboxed iframe

import { SimpleRpgFile } from "../types";

export class HtmlRunnerService {
  /**
   * Find the entry HTML file from the VFS.
   * Priority:
   * 1. Direct "index.html"
   * 2. Any path ending with "index.html" (e.g. "SimpleRPG-main/index.html")
   * 3. Any "*.html" file
   */
  static findEntryHtmlFile(files: SimpleRpgFile[]): SimpleRpgFile | null {
    // 1. Exact index.html
    const exactIndex = files.find((f) => f.path === "index.html");
    if (exactIndex) return exactIndex;

    // 2. Subfolder index.html
    const subIndex = files.find((f) => f.path.endsWith("/index.html") || f.path.endsWith("\\index.html"));
    if (subIndex) return subIndex;

    // 3. Any html file
    const anyHtml = files.find((f) => f.path.endsWith(".html"));
    if (anyHtml) return anyHtml;

    return null;
  }

  /**
   * Normalize path for matching (converts backslashes, removes leading ./)
   */
  private static normalizePath(p: string): string {
    return p.replace(/\\/g, "/").replace(/^\.\//, "").trim();
  }

  /**
   * Find matching file from VFS by checking relative or filename matches
   */
  private static findFileInVfs(
    files: SimpleRpgFile[],
    targetPath: string,
    baseDir: string
  ): SimpleRpgFile | undefined {
    const cleanTarget = this.normalizePath(targetPath);

    // 1. Check exact path with baseDir
    const combined = baseDir ? this.normalizePath(`${baseDir}/${cleanTarget}`) : cleanTarget;
    let found = files.find((f) => this.normalizePath(f.path) === combined);
    if (found) return found;

    // 2. Check exact path as is
    found = files.find((f) => this.normalizePath(f.path) === cleanTarget);
    if (found) return found;

    // 3. Check filename only (e.g., "game-ui.js" matches "SimpleRPG-main/game-ui.js")
    const fileName = cleanTarget.split("/").pop();
    if (fileName) {
      found = files.find((f) => f.path.split("/").pop() === fileName || f.path.split("\\").pop() === fileName);
      if (found) return found;
    }

    return undefined;
  }

  /**
   * Compile a full standalone executable HTML string from the given files.
   * Inlines CSS and JS scripts seamlessly.
   */
  static compileGameHtml(files: SimpleRpgFile[]): { html: string; entryFile: string | null } {
    const entryHtmlFile = this.findEntryHtmlFile(files);

    // Base directory of the entry HTML (e.g. "SimpleRPG-main" or "")
    let baseDir = "";
    let htmlContent = "";

    if (entryHtmlFile) {
      const parts = this.normalizePath(entryHtmlFile.path).split("/");
      parts.pop(); // remove file name
      baseDir = parts.join("/");
      htmlContent = entryHtmlFile.content;
    } else {
      // Fallback: Generate a clean SimpleRPG HTML shell if no index.html exists in ZIP
      htmlContent = this.generateFallbackShell(files);
      baseDir = "";
    }

    // 1. Replace <link rel="stylesheet" href="..."> with inline <style>
    const linkRegex = /<link\b[^>]*?\brel=["']stylesheet["'][^>]*?>|<link\b[^>]*?\bhref=["']([^"']+\.css)["'][^>]*?>/gi;
    htmlContent = htmlContent.replace(linkRegex, (match) => {
      const hrefMatch = match.match(/href=["']([^"']+)["']/i);
      if (!hrefMatch) return match;
      const href = hrefMatch[1];
      const cssFile = this.findFileInVfs(files, href, baseDir);
      if (cssFile) {
        return `<style data-inlined-from="${cssFile.path}">\n${cssFile.content}\n</style>`;
      }
      return match;
    });

    // Also look for any other CSS files in files that weren't linked, and inject them
    const existingStyles = files.filter((f) => f.path.endsWith(".css"));

    // 2. Replace <script src="..."> with inline scripts
    const scriptSrcRegex = /<script\b([^>]*?)\bsrc=["']([^"']+)["']([^>]*)>[\s\S]*?<\/script>/gi;
    const injectedScriptPaths = new Set<string>();

    htmlContent = htmlContent.replace(scriptSrcRegex, (match, before, src, after) => {
      const jsFile = this.findFileInVfs(files, src, baseDir);
      if (jsFile) {
        injectedScriptPaths.add(jsFile.path);
        // Remove type="module" if necessary, or preserve based on content
        const isModule = before.includes('type="module"') || after.includes('type="module"');
        return `<script ${isModule ? 'type="module"' : ""} data-inlined-from="${jsFile.path}">
// === Inlined: ${jsFile.path} ===
${jsFile.content}
</script>`;
      }
      return match;
    });

    // 3. Inject any helper JS data/core files that might not have been in script tags but are critical
    // (like enemy-data.js, combat-equip-data.js if they export globals or window objects)
    const extraScripts = files.filter(
      (f) =>
        f.path.endsWith(".js") &&
        !injectedScriptPaths.has(f.path) &&
        !f.path.includes("test") &&
        (f.path.includes("data") || f.path.includes("core") || f.path.includes("ui") || f.path.includes("save"))
    );

    let helperScriptsHtml = "";
    if (extraScripts.length > 0 && !entryHtmlFile) {
      helperScriptsHtml = extraScripts
        .map(
          (s) => `\n<!-- VFS Auto-Injected: ${s.path} -->\n<script>\n${s.content}\n</script>`
        )
        .join("\n");
    }

    // 4. Inject mobile viewport & touch optimization styles if not present
    const mobileHeaderPatch = `
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
<style id="simplerpg-mobile-viewport-enhancements">
  /* Mobile touch & responsive enhancements */
  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow-x: hidden;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
  }
  button, input, select {
    font-size: 16px; /* prevent iOS/Android zoom on focus */
    touch-action: manipulation;
  }
</style>
`;

    if (htmlContent.includes("<head>")) {
      htmlContent = htmlContent.replace("<head>", `<head>${mobileHeaderPatch}`);
    } else if (htmlContent.includes("<html>")) {
      htmlContent = htmlContent.replace("<html>", `<html><head>${mobileHeaderPatch}</head>`);
    } else {
      htmlContent = `<!DOCTYPE html><html><head>${mobileHeaderPatch}</head><body>${htmlContent}</body></html>`;
    }

    if (helperScriptsHtml && htmlContent.includes("</body>")) {
      htmlContent = htmlContent.replace("</body>", `${helperScriptsHtml}</body>`);
    }

    return {
      html: htmlContent,
      entryFile: entryHtmlFile ? entryHtmlFile.path : "auto-generated-shell.html",
    };
  }

  /**
   * Fallback Shell for when ZIP has no index.html or before any ZIP is loaded
   */
  private static generateFallbackShell(files: SimpleRpgFile[]): string {
    const enemyFile = files.find((f) => f.path.includes("enemy"));
    const equipFile = files.find((f) => f.path.includes("equip"));
    const uiFile = files.find((f) => f.path.includes("ui"));
    const cssFile = files.find((f) => f.path.endsWith(".css"));

    const cssContent = cssFile ? cssFile.content : `
      body {
        background: #090d16;
        color: #e2e8f0;
        font-family: system-ui, -apple-system, sans-serif;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        padding: 16px;
        box-sizing: border-box;
      }
      .rpg-card {
        background: #111827;
        border: 1px solid #1f2937;
        border-radius: 12px;
        padding: 16px;
        width: 100%;
        max-width: 420px;
        margin-bottom: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      }
      .rpg-title {
        font-size: 18px;
        font-weight: bold;
        color: #38bdf8;
        margin-top: 0;
        margin-bottom: 8px;
        text-align: center;
      }
      .rpg-btn {
        background: #0284c7;
        color: white;
        border: none;
        padding: 10px 16px;
        border-radius: 8px;
        font-weight: bold;
        cursor: pointer;
        width: 100%;
        margin-top: 6px;
        touch-action: manipulation;
      }
      .rpg-btn:active {
        background: #0369a1;
      }
    `;

    return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>しんぷるRPG</title>
  <style>${cssContent}</style>
</head>
<body>
  <div id="pageMain" class="rpg-card">
    <h1 class="rpg-title">⚔️ しんぷるRPG</h1>
    <div id="statusRoot" style="margin-bottom: 12px;">
      <div style="font-size: 14px; color: #94a3b8;">冒険者: ゆうしゃ (Lv.1)</div>
      <div style="display: flex; justify-content: space-between; margin-top: 4px; font-weight: bold;">
        <span style="color: #f43f5e;">HP: 80 / 80</span>
        <span style="color: #38bdf8;">MP: 30 / 30</span>
        <span style="color: #fbbf24;">120 G</span>
      </div>
    </div>
    <div id="gameScreen" style="background: #030712; border: 1px solid #1e293b; border-radius: 8px; padding: 14px; min-height: 120px; text-align: center;">
      <div style="font-size: 36px; margin-bottom: 6px;">🟢</div>
      <div style="font-size: 15px; font-weight: bold; color: #4ade80;">みどりスライム が あらわれた！</div>
      <div style="font-size: 12px; color: #64748b; margin-top: 4px;">HP: 25 / 25</div>
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px;">
      <button class="rpg-btn" style="background: #e11d48;" onclick="alert('こうげき！ 12のダメージ！')">⚔️ こうげき</button>
      <button class="rpg-btn" style="background: #059669;" onclick="alert('やくそうを使用！ HPが35回復！')">🧪 やくそう</button>
    </div>
    <button class="rpg-btn" style="background: #334155; margin-top: 8px;" onclick="location.reload()">🔄 逃げる / 再読み込み</button>
  </div>
  <div id="pageHelp" class="rpg-card" style="font-size: 13px; color: #cbd5e1;">
    <div id="helpContentRoot">
      <b>💡 ZIP読み込み機能:</b><br>
      「ZIP読込」ボタンからお持ちの <code>SimpleRPG-main.zip</code> などを選択すると、ZIP内の実ゲーム画面がこの枠内にそのまま完全に表示されます！
    </div>
  </div>
</body>
</html>`;
  }
}
