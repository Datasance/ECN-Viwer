import React, {
  createContext,
  useContext,
  ReactNode,
  FC,
  useEffect,
  useState,
} from "react";
import { AuthProvider as OidcProvider, useAuth } from "react-oidc-context";

const controllerConfig = window.controllerConfig || {};

const oidcConfig = {
  authority: `${controllerConfig.keycloakUrl!}realms/${controllerConfig.keycloakRealm!}`,
  client_id: controllerConfig.keycloakClientId,
  redirect_uri: window.location.origin,
  response_type: "code",
  scope: "openid profile email",
  automaticSilentRenew: true,
  loadUserInfo: true,
  silent_redirect_uri: `${window.location.origin}/silent-renew.html`,
};

type KeycloakAuthContextType = {
  keycloak: ReturnType<typeof useAuth>;
  initialized: boolean;
  token?: string;
  isAuthenticated: boolean;
  logout: () => void;
  hasRole: (role: string) => boolean;
};

const KeycloakAuthContext = createContext<KeycloakAuthContextType | null>(null);

const KeycloakProviderContent: FC<{ children: ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!auth.isLoading) {
      setInitialized(true);
      if (!auth.isAuthenticated) {
        auth.signinRedirect();
      }
    }
  }, [auth.isLoading, auth.isAuthenticated, auth]);

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

export const KeycloakAuthProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  return (
    <OidcProvider {...oidcConfig}>
      <KeycloakProviderContent>{children}</KeycloakProviderContent>
    </OidcProvider>
  );
};

export const useKeycloakAuth = (): KeycloakAuthContextType => {
  const context = useContext(KeycloakAuthContext);
  if (!context) {
    throw new Error(
      "useKeycloakAuth must be used within a KeycloakAuthProvider",
    );
  }
  return context;
};

export { useKeycloakAuth as useAuth };
