/**
 * ECN-Viewer context: one controller connection (project/namespace).
 * Used for YAML, store, and runtime config.
 */
export interface EcnViewerContext {
  id: string;
  name: string;
  controllerUrl: string;
  keycloakUrl?: string;
  keycloakRealm?: string;
  keycloakClientId?: string;
  controllerCA?: string; // base64-encoded PEM
  refresh?: number; // polling interval ms
}

/**
 * Shape used by existing app (ControllerProvider, auth, etc.).
 * Derived from EcnViewerContext for compatibility.
 */
export interface ControllerConfigShape {
  url: string;
  port?: string | number;
  keycloakUrl?: string;
  keycloakRealm?: string;
  keycloakClientId?: string;
  controllerCA?: string;
  refresh?: number;
  dev?: boolean;
}

export function contextToControllerConfig(ctx: EcnViewerContext): ControllerConfigShape {
  const u = new URL(ctx.controllerUrl);
  return {
    url: ctx.controllerUrl,
    port: u.port || (u.protocol === "https:" ? "443" : "80"),
    keycloakUrl: ctx.keycloakUrl,
    keycloakRealm: ctx.keycloakRealm,
    keycloakClientId: ctx.keycloakClientId,
    controllerCA: ctx.controllerCA,
    refresh: ctx.refresh,
  };
}

export function generateContextId(): string {
  return `ctx-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
