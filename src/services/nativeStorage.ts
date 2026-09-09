// ネイティブ端末ストレージへの統一アクセス層。
// ネイティブ実行時は Capacitor Preferences / Filesystem を使い、
// ブラウザ開発時(npm run dev)は localStorage にフォールバックする。

import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";

const isNative = () => Capacitor.isNativePlatform();
const CAPSULE_DIR = "miki_capsules";

export const nativeStorage = {
  async getJSON<T>(key: string, fallback: T): Promise<T> {
    try {
      if (isNative()) {
        const { value } = await Preferences.get({ key });
        return value ? (JSON.parse(value) as T) : fallback;
      }
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch (e) {
      console.warn(`nativeStorage.getJSON(${key}) failed`, e);
      return fallback;
    }
  },

  async setJSON(key: string, value: unknown): Promise<void> {
    const json = JSON.stringify(value);
    try {
      if (isNative()) {
        await Preferences.set({ key, value: json });
      } else {
        localStorage.setItem(key, json);
      }
    } catch (e) {
      console.warn(`nativeStorage.setJSON(${key}) failed`, e);
    }
  },

  async writeLargeFile(fileName: string, contentJson: unknown): Promise<void> {
    const json = JSON.stringify(contentJson);
    try {
      if (isNative()) {
        await Filesystem.writeFile({
          path: `${CAPSULE_DIR}/${fileName}.json`,
          data: json,
          directory: Directory.Data,
          encoding: Encoding.UTF8,
          recursive: true,
        });
      } else {
        localStorage.setItem(`fs_fallback_${fileName}`, json);
      }
    } catch (e) {
      console.warn(`nativeStorage.writeLargeFile(${fileName}) failed`, e);
    }
  },

  async readLargeFile<T>(fileName: string): Promise<T | null> {
    try {
      if (isNative()) {
        const res = await Filesystem.readFile({
          path: `${CAPSULE_DIR}/${fileName}.json`,
          directory: Directory.Data,
          encoding: Encoding.UTF8,
        });
        return JSON.parse(res.data as string) as T;
      }
      const raw = localStorage.getItem(`fs_fallback_${fileName}`);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },

  async deleteLargeFile(fileName: string): Promise<void> {
    try {
      if (isNative()) {
        await Filesystem.deleteFile({
          path: `${CAPSULE_DIR}/${fileName}.json`,
          directory: Directory.Data,
        });
      } else {
        localStorage.removeItem(`fs_fallback_${fileName}`);
      }
    } catch {
      // 既に無い場合は無視
    }
  },

  /** ダッシュボード表示用: 指定キー群の推定使用バイト数 */
  async estimateUsageBytes(keys: string[]): Promise<number> {
    let total = 0;
    for (const key of keys) {
      try {
        const raw = isNative()
          ? (await Preferences.get({ key })).value
          : localStorage.getItem(key);
        if (raw) total += new Blob([raw]).size;
      } catch {
        /* skip */
      }
    }
    return total;
  },
};
