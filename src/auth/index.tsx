import React, { createContext, useContext, ReactNode, FC, useEffect } from 'react';
import { AuthProvider as OidcProvider, useAuth } from 'react-oidc-context';

const controllerConfig = window.controllerConfig || {};

const oidcConfig = {
  authority: `${controllerConfig.keycloakURL!}realms/${controllerConfig.keycloakRealm!}`,
  client_id: controllerConfig.keycloakClientid,
  redirect_uri: window.location.origin,
  response_type: 'code',
  scope: 'openid profile email',
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

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      auth.signinRedirect();
    }
  }, [auth.isLoading, auth.isAuthenticated]);

  const profile = auth?.user?.profile as { realm_access?: { roles?: string[] } } | undefined;

  const authValue: KeycloakAuthContextType = {
    keycloak: auth,
    initialized: !auth.isLoading,
    token: auth.user?.access_token,
    isAuthenticated: auth.isAuthenticated,
    logout: () => auth.signoutRedirect(),
    hasRole: (role: string) =>
      Array.isArray(profile?.realm_access?.roles)
        ? profile.realm_access.roles.includes(role)
        : false,
  };

  // Element eklemiyoruz, loading ya da login yönlendirme olayı direk yönetiliyor

  return (
    <KeycloakAuthContext.Provider value={authValue}>
      {children}
    </KeycloakAuthContext.Provider>
  );
};

export const KeycloakAuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <OidcProvider {...oidcConfig}>
      <KeycloakProviderContent>{children}</KeycloakProviderContent>
    </OidcProvider>
  );
};

export const useKeycloakAuth = (): KeycloakAuthContextType => {
  const context = useContext(KeycloakAuthContext);
  if (!context) {
    throw new Error('useKeycloakAuth must be used within a KeycloakAuthProvider');
  }
  return context;
};

export { useKeycloakAuth as useAuth };
