import type { EcnViewerContext } from "./types";
import { generateContextId } from "./types";

const STORAGE_KEY_CONTEXTS = "ecn-viewer-contexts";
const STORAGE_KEY_ACTIVE_ID = "ecn-viewer-active-context-id";

/** Session-only: set when user chooses a context (Connect). App uses this to avoid using stored context for initial view. */
export const SESSION_KEY_CONTEXT_CHOSEN = "ecn-viewer-context-chosen-this-session";

export interface ContextStoreAPI {
  getContexts: () => Promise<EcnViewerContext[]>;
  getActiveContextId: () => Promise<string | null>;
  setActiveContextId: (id: string | null) => Promise<void>;
  saveContext: (context: EcnViewerContext) => Promise<void>;
  deleteContext: (id: string) => Promise<void>;
  getContext: (id: string) => Promise<EcnViewerContext | null>;
}

/**
 * localStorage-based store for web/Docker. Electron will use IPC to main and file/userData.
 */
function getLocalStorage(): Storage {
  if (typeof window === "undefined" || !window.localStorage) {
    throw new Error("localStorage not available");
  }
  return window.localStorage;
}

export const contextStore: ContextStoreAPI = {
  async getContexts(): Promise<EcnViewerContext[]> {
    try {
      const raw = getLocalStorage().getItem(STORAGE_KEY_CONTEXTS);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  async getActiveContextId(): Promise<string | null> {
    try {
      return getLocalStorage().getItem(STORAGE_KEY_ACTIVE_ID);
    } catch {
      return null;
    }
  },

  async setActiveContextId(id: string | null): Promise<void> {
    if (id === null) {
      getLocalStorage().removeItem(STORAGE_KEY_ACTIVE_ID);
    } else {
      getLocalStorage().setItem(STORAGE_KEY_ACTIVE_ID, id);
    }
  },

  async saveContext(context: EcnViewerContext): Promise<void> {
    const list = await this.getContexts();
    const next = { ...context };
    if (!next.id) next.id = generateContextId();
    const idx = list.findIndex((c) => c.id === next.id);
    const newList =
      idx >= 0
        ? list.map((c, i) => (i === idx ? next : c))
        : [...list, next];
    getLocalStorage().setItem(STORAGE_KEY_CONTEXTS, JSON.stringify(newList));
  },

  async deleteContext(id: string): Promise<void> {
    const list = await this.getContexts();
    const newList = list.filter((c) => c.id !== id);
    getLocalStorage().setItem(STORAGE_KEY_CONTEXTS, JSON.stringify(newList));
    const activeId = await this.getActiveContextId();
    if (activeId === id) {
      await this.setActiveContextId(null);
    }
  },

  async getContext(id: string): Promise<EcnViewerContext | null> {
    const list = await this.getContexts();
    return list.find((c) => c.id === id) ?? null;
  },
};

/**
 * When running in Electron, the renderer will use a bridge that calls main process.
 * For now we use contextStore (localStorage). Electron preload will override window.__contextStore later.
 */
declare global {
  interface Window {
    __contextStore?: ContextStoreAPI;
  }
}

export function getContextStore(): ContextStoreAPI {
  return typeof window !== "undefined" && window.__contextStore
    ? window.__contextStore
    : contextStore;
}
