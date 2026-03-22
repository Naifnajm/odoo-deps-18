import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// MMKV for native, localStorage fallback for web
let mmkvInstance: any = null;
if (Platform.OS !== "web") {
  try {
    const { MMKV } = require("react-native-mmkv");
    mmkvInstance = new MMKV({ id: "odoo-mobile-cache" });
  } catch {
    mmkvInstance = null;
  }
}

// --- Secure Store (credentials, tokens) ---

const SECURE_KEYS = {
  SERVER_URL: "odoo_server_url",
  DATABASE: "odoo_database",
  USERNAME: "odoo_username",
  PASSWORD: "odoo_password",
  SESSION_ID: "odoo_session_id",
  BIOMETRIC_ENABLED: "odoo_biometric_enabled",
  REMEMBER_ME: "odoo_remember_me",
} as const;

export const secureStorage = {
  async set(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  },

  async get(key: string): Promise<string | null> {
    return SecureStore.getItemAsync(key);
  },

  async remove(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  },

  async getServerUrl(): Promise<string | null> {
    return this.get(SECURE_KEYS.SERVER_URL);
  },

  async setServerUrl(url: string): Promise<void> {
    return this.set(SECURE_KEYS.SERVER_URL, url);
  },

  async getDatabase(): Promise<string | null> {
    return this.get(SECURE_KEYS.DATABASE);
  },

  async setDatabase(db: string): Promise<void> {
    return this.set(SECURE_KEYS.DATABASE, db);
  },

  async getCredentials(): Promise<{ username: string; password: string } | null> {
    const username = await this.get(SECURE_KEYS.USERNAME);
    const password = await this.get(SECURE_KEYS.PASSWORD);
    if (username && password) {
      return { username, password };
    }
    return null;
  },

  async setCredentials(username: string, password: string): Promise<void> {
    await this.set(SECURE_KEYS.USERNAME, username);
    await this.set(SECURE_KEYS.PASSWORD, password);
  },

  async getSessionId(): Promise<string | null> {
    return this.get(SECURE_KEYS.SESSION_ID);
  },

  async setSessionId(sessionId: string): Promise<void> {
    return this.set(SECURE_KEYS.SESSION_ID, sessionId);
  },

  async isBiometricEnabled(): Promise<boolean> {
    const val = await this.get(SECURE_KEYS.BIOMETRIC_ENABLED);
    return val === "true";
  },

  async setBiometricEnabled(enabled: boolean): Promise<void> {
    return this.set(SECURE_KEYS.BIOMETRIC_ENABLED, String(enabled));
  },

  async isRememberMe(): Promise<boolean> {
    const val = await this.get(SECURE_KEYS.REMEMBER_ME);
    return val === "true";
  },

  async setRememberMe(remember: boolean): Promise<void> {
    return this.set(SECURE_KEYS.REMEMBER_ME, String(remember));
  },

  async clearAll(): Promise<void> {
    const keys = Object.values(SECURE_KEYS);
    await Promise.all(keys.map((key) => this.remove(key)));
  },
};

// --- Cache storage (MMKV on native, localStorage on web) ---

export const mmkvStorage = mmkvInstance;

export const cacheStorage = {
  set(key: string, value: unknown): void {
    const str = JSON.stringify(value);
    if (mmkvInstance) {
      mmkvInstance.set(key, str);
    } else if (typeof localStorage !== "undefined") {
      localStorage.setItem(key, str);
    }
  },

  get<T>(key: string): T | null {
    let raw: string | null | undefined;
    if (mmkvInstance) {
      raw = mmkvInstance.getString(key);
    } else if (typeof localStorage !== "undefined") {
      raw = localStorage.getItem(key);
    }
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  remove(key: string): void {
    if (mmkvInstance) {
      mmkvInstance.delete(key);
    } else if (typeof localStorage !== "undefined") {
      localStorage.removeItem(key);
    }
  },

  clearAll(): void {
    if (mmkvInstance) {
      mmkvInstance.clearAll();
    } else if (typeof localStorage !== "undefined") {
      localStorage.clear();
    }
  },

  getCacheKey(model: string, method: string, args: unknown[]): string {
    const hash = JSON.stringify({ model, method, args });
    return `cache:${hash}`;
  },
};
