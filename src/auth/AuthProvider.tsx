import React, { createContext, useContext, useEffect } from 'react';
import { AuthProvider as OidcProvider, useAuth } from 'react-oidc-context';
import { oidcConfig } from './oidcConfig';
import CustomLoadingModal from '../CustomComponent/CustomLoadingModal';

const KeycloakAuthContext = createContext<any>(null);

const TokenRefresh = () => {
  const auth = useAuth();

  useEffect(() => {
    const interval = setInterval(() => {
      if (auth?.user?.expires_in && auth?.signinSilent) {
        auth.signinSilent().catch((err:any) => {
          console.warn('Token refresh failed. Logging out.');
          auth.signoutRedirect();
        });
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [auth]);

  return null;
};

export const KeycloakAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <OidcProvider {...oidcConfig}>
      <KeycloakProviderContent>{children}</KeycloakProviderContent>
    </OidcProvider>
  );
};

const KeycloakProviderContent = ({ children }: { children: React.ReactNode }) => {
  const auth = useAuth();

  const authValue = {
    keycloak: auth,
    initialized: !auth.isLoading,
    token: auth.user?.access_token,
    isAuthenticated: auth.isAuthenticated,
    logout: () => auth.signoutRedirect(),
    hasRole: (role: string) => {
        const profile = auth?.user?.profile as {
          realm_access?: { roles?: string[] }
        };
      
        return Array.isArray(profile?.realm_access?.roles)
          ? profile.realm_access.roles.includes(role)
          : false;
      }
  };

  if (auth.isLoading) {
    return (
      <CustomLoadingModal
        open={true}
        message="Loading ECN-Viewer"
        spinnerSize="lg"
        spinnerColor="text-green-500"
        overlayOpacity={60}
      />
    );
  }

  return (
    <KeycloakAuthContext.Provider value={authValue}>
      <TokenRefresh />
      {children}
    </KeycloakAuthContext.Provider>
  );
};

export const useKeycloakAuth = () => {
  const context = useContext(KeycloakAuthContext);
  if (!context) {
    throw new Error('useKeycloakAuth must be used within a KeycloakAuthProvider');
  }
  return context;
};
