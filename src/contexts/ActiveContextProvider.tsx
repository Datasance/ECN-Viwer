import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import type { EcnViewerContext, ControllerConfigShape } from "./types";
import { contextToControllerConfig } from "./types";
import { getContextStore } from "./contextStore";

export type { ControllerConfigShape };

type ActiveContextValue = {
  /** All saved contexts */
  contexts: EcnViewerContext[];
  /** Currently selected context or null */
  activeContext: EcnViewerContext | null;
  /** Config shape for ControllerProvider/auth (null when no active context) */
  controllerConfig: ControllerConfigShape | null;
  /** Set active context by id; null to disconnect */
  setActiveContextId: (id: string | null) => Promise<void>;
  /** Refresh list from store */
  refreshContexts: () => Promise<void>;
  /** Whether we're using legacy window.controllerConfig (embedded mode) */
  isLegacyMode: boolean;
  /** Default context from controller-config.js when present; not set as active until user selects it */
  implicitContext: EcnViewerContext | null;
};

const ActiveContextContext = createContext<ActiveContextValue | null>(null);

export function useActiveContext(): ActiveContextValue {
  const ctx = useContext(ActiveContextContext);
  if (!ctx) {
    throw new Error("useActiveContext must be used within ActiveContextProvider");
  }
  return ctx;
}

/** Hook that returns controller config only; for gradual migration from window.controllerConfig */
export function useControllerConfig(): ControllerConfigShape | null {
  return useActiveContext().controllerConfig;
}

function buildImplicitContextFromWindow(): EcnViewerContext | null {
  const w = typeof window !== "undefined" ? (window as unknown as { controllerConfig?: Record<string, unknown> }).controllerConfig : undefined;
  if (!w || !w.url) return null;
  const url = typeof w.url === "string" ? w.url : "";
  const keycloakUrl = typeof w.keycloakUrl === "string" ? w.keycloakUrl : undefined;
  const keycloakRealm = typeof w.keycloakRealm === "string" ? w.keycloakRealm : undefined;
  const keycloakClientId = typeof w.keycloakClientId === "string" ? w.keycloakClientId : undefined;
  const refresh = typeof w.refresh === "number" ? w.refresh : undefined;
  return {
    id: "legacy",
    name: "Controller (embedded)",
    controllerUrl: url,
    keycloakUrl: keycloakUrl,
    keycloakRealm: keycloakRealm,
    keycloakClientId: keycloakClientId,
    refresh,
  };
}

export function ActiveContextProvider({ children }: { children: ReactNode }) {
  const [contexts, setContexts] = useState<EcnViewerContext[]>([]);
  const [activeContext, setActiveContextState] = useState<EcnViewerContext | null>(null);
  const [isLegacyMode, setIsLegacyMode] = useState(false);

  const store = getContextStore();

  const refreshContexts = useCallback(async () => {
    const list = await store.getContexts();
    setContexts(list);
    const activeId = await store.getActiveContextId();
    if (activeId) {
      const ctx = list.find((c) => c.id === activeId) ?? (await store.getContext(activeId));
      setActiveContextState(ctx ?? null);
    } else {
      setActiveContextState(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const list = await store.getContexts();
      const activeId = await store.getActiveContextId();
      if (mounted) setContexts(list);

      // When controller-config.js is present and no saved contexts, do NOT auto-set activeContext.
      // Show Contexts page first; user selects the implicit context to connect.
      if (list.length === 0 && !activeId) {
        // Leave activeContext null so App shows ContextsPage; implicitContext is exposed for display.
        if (mounted) setActiveContextState(null);
        return;
      }

      if (activeId) {
        const ctx = list.find((c) => c.id === activeId) ?? (await store.getContext(activeId));
        if (mounted) setActiveContextState(ctx ?? null);
      } else if (mounted) {
        setActiveContextState(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const setActiveContextId = useCallback(async (id: string | null) => {
    await store.setActiveContextId(id);
    setIsLegacyMode(false);
    await refreshContexts();
  }, [refreshContexts]);

  const controllerConfig =
    activeContext ? contextToControllerConfig(activeContext) : null;

  const implicitContext =
    typeof window !== "undefined" ? buildImplicitContextFromWindow() : null;

  const value: ActiveContextValue = {
    contexts,
    activeContext,
    controllerConfig,
    setActiveContextId,
    refreshContexts,
    isLegacyMode,
    implicitContext,
  };

  return (
    <ActiveContextContext.Provider value={value}>
      {children}
    </ActiveContextContext.Provider>
  );
}
