declare module "*.svg" {
  const content: string;
  export default content;
}

declare module "*.png" {
  const value: string;
  export default value;
}
declare module "*.jpg" {
  const value: string;
  export default value;
}
declare module "*.jpeg" {
  const value: string;
  export default value;
}
declare module "*.gif" {
  const value: string;
  export default value;
}

interface ControllerConfig {
  keycloakUrl?: string;
  keycloakRealm?: string;
  keycloakClientId?: string;
  port?: number;
  dev?: boolean;
  url?: string;
}

interface Window {
  controllerConfig?: ControllerConfig;
  __contextStore?: import("./contexts/contextStore").ContextStoreAPI;
  __controllerFetch?: (opts: {
    url: string;
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    controllerCA?: string;
  }) => Promise<{
    ok: boolean;
    status: number;
    statusText: string;
    headers?: Record<string, string>;
    body: string;
  }>;
  /** Electron only: subscribe to OIDC callback URL from protocol handler (popup flow). */
  __subscribeOidcCallbackUrl?: (callback: (url: string) => void) => void;
  /** Electron only: notify main process that OIDC callback was processed (so it can close the popup). */
  __notifyOidcCallbackProcessed?: () => void;
  /** Electron only: subscribe to login popup closed (e.g. user closed without logging in). */
  __subscribeOidcPopupClosed?: (callback: () => void) => void;
  /** Electron only (external-browser OIDC): start login in system browser. */
  __electronAuthStartLogin?: (config: { keycloakUrl: string; keycloakRealm: string; keycloakClientId: string }) => void;
  /** Electron only: get stored access token (null if none). */
  __electronAuthGetAccessToken?: () => Promise<string | null>;
  /** Electron only: clear stored tokens (logout). */
  __electronAuthLogout?: () => void;
  /** Electron only: subscribe to login success after token exchange. */
  __subscribeOidcLoginSuccess?: (callback: () => void) => void;
  /** Electron only: subscribe to login error (e.g. start-login failed). */
  __subscribeOidcLoginError?: (callback: (message: string) => void) => void;
}
