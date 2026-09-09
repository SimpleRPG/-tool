import React, { useState } from "react";
import { SimpleRpgFile, ApkExportConfig } from "../types";
import { SimpleRpgZipService } from "../services/zipService";
import { SimpleRpgScanner } from "../services/simpleRpgScanner";
import { Upload, Download, Smartphone, X, Check, Loader2, FileArchive, ArrowRight } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  files: SimpleRpgFile[];
  onImportFiles: (newFiles: SimpleRpgFile[]) => void;
}

export const ZipImportExportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  files,
  onImportFiles,
}) => {
  const [activeTab, setActiveTab] = useState<"import" | "export_zip" | "apk">("import");
  const [isProcessing, setIsProcessing] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // APK config state
  const [apkConfig, setApkConfig] = useState<ApkExportConfig>({
    appId: "com.simplerpg.miki",
    appName: "しんぷるRPG",
    versionName: "1.0.0",
    versionCode: 1,
    orientation: "portrait",
    permissions: ["android.permission.INTERNET"],
  });

  if (!isOpen) return null;

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processZipFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processZipFile(e.target.files[0]);
    }
  };

  const processZipFile = async (file: File) => {
    if (!file.name.endsWith(".zip")) {
      setImportMessage("⚠️ .zip 形式のアーカイブファイルを選択してください。");
      return;
    }

    setIsProcessing(true);
    setImportMessage(null);
    try {
      const extractedFiles = await SimpleRpgZipService.importZip(file);
      if (extractedFiles.length === 0) {
        throw new Error("ZIP内に有効なしんぷるRPGコードファイル（.js, .html, .css）が見つかりませんでした。");
      }
      onImportFiles(extractedFiles);
      const scan = SimpleRpgScanner.scanProject(extractedFiles);
      const enemyNames = scan.enemies.map((e) => e.name).slice(0, 3).join(", ");
      setImportMessage(
        `✅ 読み込み成功: ${extractedFiles.length} 個のファイルをマウントしました！\n` +
        `👾 検出敵: ${enemyNames}${scan.enemies.length > 3 ? " 他" : ""} (${scan.enemies.length}種)\n` +
        `⚔️ 武器: ${scan.weapons.length}種 / 🧪 持ち物: ${scan.items.length}種\n` +
        `プレビュー画面および戦闘ラボに即時反映されています。`
      );
    } catch (err: any) {
      console.error(err);
      setImportMessage(`❌ エラー: ${err.message || "ZIPの解凍・読み込みに失敗しました。"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportZip = async () => {
    setIsProcessing(true);
    try {
      await SimpleRpgZipService.exportZip(files, "SimpleRPG_patched.zip");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportApkKit = async () => {
    setIsProcessing(true);
    try {
      await SimpleRpgZipService.exportApkKit(files, apkConfig);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md font-sans">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/30">
              <FileArchive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                しんぷるRPG ZIP入出力 & APK化キット
              </h2>
              <p className="text-xs text-slate-400">
                手元のゲームZIPを読み込んだり、改造版をZIP・Android APK用として出力できます
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-5 pt-3 pb-0 border-b border-slate-800 bg-slate-950/60 flex items-center gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("import")}
            className={`pb-2.5 px-2 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === "import"
                ? "border-sky-500 text-sky-400 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            ZIPの読み込み
          </button>

          <button
            onClick={() => setActiveTab("export_zip")}
            className={`pb-2.5 px-2 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === "export_zip"
                ? "border-sky-500 text-sky-400 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            ZIPで書き出し
          </button>

          <button
            onClick={() => setActiveTab("apk")}
            className={`pb-2.5 px-2 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === "apk"
                ? "border-sky-500 text-sky-400 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Android APK化キット
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* ==================================================== */}
          {/* 1. Import ZIP Tab */}
          {/* ==================================================== */}
          {activeTab === "import" && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
                className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                  dragOver
                    ? "border-sky-400 bg-sky-950/30"
                    : "border-slate-700 hover:border-slate-600 bg-slate-950/60"
                }`}
                onClick={() => document.getElementById("zip-file-input")?.click()}
              >
                <Upload className="w-10 h-10 text-sky-400 mb-2" />
                <p className="font-bold text-sm text-slate-200">
                  「しんぷるRPG」のZIPファイルを選択
                </p>
                <p className="text-xs text-slate-400 mt-1">PCはドラッグ＆ドロップ、スマホはタップで選択</p>
                
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    document.getElementById("zip-file-input")?.click();
                  }}
                  className="mt-3 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-bold text-xs shadow-md shadow-sky-600/30 flex items-center gap-2 cursor-pointer"
                >
                  <FileArchive className="w-4 h-4" />
                  端末内のZIPファイルを開く
                </button>

                <input
                  id="zip-file-input"
                  type="file"
                  accept=".zip"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {isProcessing && (
                <div className="flex items-center justify-center gap-2 text-xs text-slate-400 py-3 font-mono">
                  <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                  ブラウザ内でZIPを展開中...
                </div>
              )}

              {importMessage && (
                <div
                  className={`p-3 rounded-xl text-xs ${
                    importMessage.startsWith("✅")
                      ? "bg-emerald-950/40 border border-emerald-800/60 text-emerald-300"
                      : "bg-rose-950/40 border border-rose-800/60 text-rose-300"
                  }`}
                >
                  {importMessage}
                </div>
              )}

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
                <span className="font-bold text-slate-300">💡 ヒント:</span>
                <p>
                  しんぷるRPGのアーカイブ（`.js`, `index.html` などが含まれるzip）を投入すると、現在のスタジオのファイル群が一瞬で入れ替わり、即座に改造やミキAIによるテストが可能になります。
                </p>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* 2. Export ZIP Tab */}
          {/* ==================================================== */}
          {activeTab === "export_zip" && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-200">現在の開発状態</span>
                  <span className="text-xs font-mono text-sky-400">{files.length} ファイル</span>
                </div>
                <div className="text-xs text-slate-400 leading-relaxed">
                  スタジオ内でパッチ・改造を加えたしんぷるRPGの全ソースコードを一括アーカイブ（ZIP）としてダウンロードします。ダウンロードしたZIPはそのままブラウザや各種サーバーで動作可能です。
                </div>

                <button
                  onClick={handleExportZip}
                  disabled={isProcessing}
                  className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>SimpleRPG_patched.zip をダウンロード</span>
                </button>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* 3. Android APK Kit Tab */}
          {/* ==================================================== */}
          {activeTab === "apk" && (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-sky-400" />
                  Android APK化パッケージ設定 (Capacitor)
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400">パッケージID (App ID)</label>
                    <input
                      type="text"
                      value={apkConfig.appId}
                      onChange={(e) => setApkConfig({ ...apkConfig, appId: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-slate-200 font-mono mt-0.5 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">アプリ表示名 (App Name)</label>
                    <input
                      type="text"
                      value={apkConfig.appName}
                      onChange={(e) => setApkConfig({ ...apkConfig, appName: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-slate-200 mt-0.5 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-slate-300 leading-relaxed">
                <div className="font-bold text-slate-200 text-xs">📱 APK作成のながれ (Galaxy S25等へ)</div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400">
                  <li>下のボタンから「APK化キット (.zip)」をダウンロード</li>
                  <li>解凍して <code className="text-sky-300 font-mono">npm install && npx cap add android</code> を実行</li>
                  <li><code className="text-sky-300 font-mono">./gradlew assembleDebug</code> でAPKをワンコマンド生成</li>
                  <li>スマホにインストールすれば完全オフラインのネイティブゲームとして動作！</li>
                </ol>
              </div>

              <button
                onClick={handleExportApkKit}
                disabled={isProcessing}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>APK化キット (simple-rpg-apk-kit.zip) を出力</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <span>💡 すべてブラウザ内で高速に圧縮・展開されるためプライバシーも安全です</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
