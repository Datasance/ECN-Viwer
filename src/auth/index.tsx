import React, {
  createContext,
  useContext,
  ReactNode,
  FC,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { UserManager } from "oidc-client-ts";
import { AuthProvider as OidcProvider, useAuth } from "react-oidc-context";
import { useControllerConfig } from "../contexts/ActiveContextProvider";
import { SESSION_KEY_CONTEXT_CHOSEN } from "../contexts/contextStore";

/** Decode JWT payload (no verify; for reading roles in Electron flow). */
function decodeJwtPayload(token: string): { realm_access?: { roles?: string[] } } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json) as { realm_access?: { roles?: string[] } };
  } catch {
    return null;
  }
}

type KeycloakAuthContextType = {
  keycloak: ReturnType<typeof useAuth> | null;
  initialized: boolean;
  token?: string;
  isAuthenticated: boolean;
  logout: () => void;
  hasRole: (role: string) => boolean;
};

const KeycloakAuthContext = createContext<KeycloakAuthContextType | null>(null);

/** Set when we just processed OIDC callback so popup-closed handler does not reload (Electron). */
let oidcCallbackProcessedRecently = false;

/** Fixed redirect URIs for the packaged Electron app. Keycloak client must have these configured. */
const ELECTRON_REDIRECT_URI = "com.datasance.ecn-viewer://callback";
const ELECTRON_SILENT_REDIRECT_URI = "com.datasance.ecn-viewer://silent-renew";

function isElectronPackaged(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof (window as Window & { __contextStore?: unknown }).__contextStore !== "undefined" &&
    window.location.protocol === "file:"
  );
}

function buildOidcConfig(controllerConfig: {
  keycloakUrl?: string;
  keycloakRealm?: string;
  keycloakClientId?: string;
} | null) {
  if (!controllerConfig?.keycloakUrl || !controllerConfig?.keycloakRealm || !controllerConfig?.keycloakClientId) {
    return null;
  }
  const base = controllerConfig.keycloakUrl.replace(/\/+$/, "");
  // Use path without hash for redirect_uri so Keycloak returns ?code=...&state=... in the query string.
  // oidc-client-ts does not parse callback params correctly when they end up in the hash (issue #734).
  // In packaged Electron (file://), use fixed custom scheme; in dev (localhost) or web use origin.
  const redirectUri = isElectronPackaged()
    ? ELECTRON_REDIRECT_URI
    : `${window.location.origin}/`;
  const silentRedirectUri = isElectronPackaged()
    ? ELECTRON_SILENT_REDIRECT_URI
    : `${window.location.origin}/silent-renew.html`;
  return {
    authority: `${base}/realms/${controllerConfig.keycloakRealm}`,
    client_id: controllerConfig.keycloakClientId,
    redirect_uri: redirectUri,
    response_type: "code" as const,
    response_mode: "query" as const,
    scope: "openid profile email",
    automaticSilentRenew: true,
    loadUserInfo: true,
    silent_redirect_uri: silentRedirectUri,
    onSigninCallback: () => {
      // Restore hash route after OIDC callback so HashRouter works.
      const hash = window.location.hash?.startsWith("#") ? window.location.hash : "#/";
      window.history.replaceState({}, document.title, window.location.origin + (hash || "#/"));
    },
  };
}

const KeycloakProviderContent: FC<{ children: ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const [initialized, setInitialized] = useState(false);
  const electronPackaged = isElectronPackaged();

  useEffect(() => {
    if (!auth.isLoading) {
      setInitialized(true);
      const params = new URLSearchParams(window.location.search);
      const isCallback = params.has("code") || params.has("state");
      const alreadyInPopup = auth.activeNavigator === "signinPopup";
      if (!auth.isAuthenticated && !isCallback && !alreadyInPopup) {
        if (electronPackaged) {
          auth.signinPopup();
        } else {
          auth.signinRedirect();
        }
      }
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.activeNavigator, auth, electronPackaged]);

  // When user closes the login popup without logging in (Electron), return to context page.
  useEffect(() => {
    if (!electronPackaged || !window.__subscribeOidcPopupClosed) return;
    window.__subscribeOidcPopupClosed(() => {
      if (auth.isAuthenticated || oidcCallbackProcessedRecently) return;
      sessionStorage.removeItem(SESSION_KEY_CONTEXT_CHOSEN);
      window.location.reload();
    });
  }, [electronPackaged, auth.isAuthenticated]);

  useEffect(() => {
    const handleTokenExpired = () => {
      auth.signoutRedirect();
    };
    auth.events.addAccessTokenExpired(handleTokenExpired);
    return () => {
      auth.events.removeAccessTokenExpired(handleTokenExpired);
    };
  }, [auth]);

  const profile = auth?.user?.profile as
    | { realm_access?: { roles?: string[] } }
    | undefined;

  const authValue: KeycloakAuthContextType = {
    keycloak: auth,
    initialized,
    token: auth.user?.access_token,
    isAuthenticated: auth.isAuthenticated,
    logout: () => auth.signoutRedirect(),
    hasRole: (role: string) =>
      Array.isArray(profile?.realm_access?.roles)
        ? profile.realm_access.roles.includes(role)
        : false,
  };

  return (
    <KeycloakAuthContext.Provider value={authValue}>
      {children}
    </KeycloakAuthContext.Provider>
  );
};

const NoAuthContext = createContext<KeycloakAuthContextType | null>(null);

const NoAuthProviderContent: FC<{ children: ReactNode }> = ({ children }) => {
  const value: KeycloakAuthContextType = {
    keycloak: null,
    initialized: true,
    token: undefined,
    isAuthenticated: true,
    logout: () => {},
    hasRole: () => false,
  };
  return (
    <NoAuthContext.Provider value={value}>
      {children}
    </NoAuthContext.Provider>
  );
};

/** Electron packaged: external-browser OIDC, token from main process via IPC. */
const ElectronKeycloakProviderContent: FC<{
  children: ReactNode;
  keycloakUrl: string;
  keycloakRealm: string;
  keycloakClientId: string;
}> = ({ children, keycloakUrl, keycloakRealm, keycloakClientId }) => {
  const [token, setToken] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const loginTriggeredRef = useRef(false);

  useEffect(() => {
    if (!window.__electronAuthGetAccessToken) return;
    window.__electronAuthGetAccessToken().then((t) => {
      setToken(t);
      setInitialized(true);
    });
  }, []);

  useEffect(() => {
    if (!window.__subscribeOidcLoginSuccess) return;
    window.__subscribeOidcLoginSuccess(() => {
      window.__electronAuthGetAccessToken?.().then((t) => setToken(t));
    });
  }, []);

  useEffect(() => {
    if (!initialized || token != null || loginTriggeredRef.current) return;
    if (!window.__electronAuthStartLogin) return;
    loginTriggeredRef.current = true;
    window.__electronAuthStartLogin({ keycloakUrl, keycloakRealm, keycloakClientId });
  }, [initialized, token, keycloakUrl, keycloakRealm, keycloakClientId]);

  const profile = token ? decodeJwtPayload(token) : null;
  const authValue: KeycloakAuthContextType = {
    keycloak: null,
    initialized,
    token: token ?? undefined,
    isAuthenticated: !!token,
    logout: () => {
      window.__electronAuthLogout?.();
      sessionStorage.removeItem(SESSION_KEY_CONTEXT_CHOSEN);
      window.location.reload();
    },
    hasRole: (role: string) =>
      Array.isArray(profile?.realm_access?.roles)
        ? profile.realm_access.roles.includes(role)
        : false,
  };
  return (
    <KeycloakAuthContext.Provider value={authValue}>
      {children}
    </KeycloakAuthContext.Provider>
  );
};

/**
 * Auth is scoped to the active context (config comes from useControllerConfig()).
 * Per-context token isolation: when the user switches context from the Contexts page,
 * we sign out first (onSignOutBeforeSwitch) then set the new context and reload, so
 * the new context gets a fresh login. Tokens are not shared across context switches.
 */
export const KeycloakAuthProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const controllerConfig = useControllerConfig();
  const oidcConfig = useMemo(
    () => buildOidcConfig(controllerConfig),
    [controllerConfig]
  );
  const electronPackaged = isElectronPackaged();
  const userManager = useMemo(() => {
    if (electronPackaged || !oidcConfig) return undefined;
    return new UserManager(oidcConfig);
  }, [electronPackaged, oidcConfig]);

  useEffect(() => {
    if (!userManager || !window.__subscribeOidcCallbackUrl) return;
    window.__subscribeOidcCallbackUrl((url) => {
      const completeSuccess = () => {
        oidcCallbackProcessedRecently = true;
        window.__notifyOidcCallbackProcessed?.();
        setTimeout(() => { oidcCallbackProcessedRecently = false; }, 1500);
        userManager.getUser();
      };
      userManager
        .signinPopupCallback(url)
        .then(completeSuccess)
        .catch((err) => {
          console.error("signinPopupCallback error:", err);
          userManager
            .getUser()
            .then((user) => {
              if (user) completeSuccess();
              else window.__notifyOidcCallbackProcessed?.();
            })
            .catch(() => window.__notifyOidcCallbackProcessed?.());
        });
    });
  }, [userManager]);

  if (oidcConfig && electronPackaged) {
    return (
      <ElectronKeycloakProviderContent
        keycloakUrl={controllerConfig?.keycloakUrl ?? ""}
        keycloakRealm={controllerConfig?.keycloakRealm ?? ""}
        keycloakClientId={controllerConfig?.keycloakClientId ?? ""}
      >
        {children}
      </ElectronKeycloakProviderContent>
    );
  }

  if (oidcConfig) {
    const providerProps = userManager
      ? { userManager, onSigninCallback: oidcConfig.onSigninCallback }
      : { ...oidcConfig };
    return (
      <OidcProvider {...providerProps}>
        <KeycloakProviderContent>{children}</KeycloakProviderContent>
      </OidcProvider>
    );
  }

  return <NoAuthProviderContent>{children}</NoAuthProviderContent>;
};

export const useKeycloakAuth = (): KeycloakAuthContextType => {
  const keycloakCtx = useContext(KeycloakAuthContext);
  const noAuthCtx = useContext(NoAuthContext);
  const context = keycloakCtx ?? noAuthCtx;
  if (!context) {
    throw new Error(
      "useKeycloakAuth must be used within KeycloakAuthProvider",
    );
  }
  return context;
};

export { useKeycloakAuth as useAuth };
