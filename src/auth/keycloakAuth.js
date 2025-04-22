import React, { createContext, useContext } from 'react'
import { ReactKeycloakProvider, useKeycloak } from '@react-keycloak/web'
import keycloak from '../Keycloak/keycloakConfig'

// Create the auth context
const KeycloakAuthContext = createContext(null)

// Provider component that wraps app with Keycloak
export const KeycloakAuthProvider = ({ children }) => {
  return (
    <ReactKeycloakProvider
      authClient={keycloak}
      initOptions={{
        onLoad: 'login-required',
        KeycloakResponseType: 'code',
        pkceMethod: 'S256',
        inAppBrowserOptions: {}
      }}
      LoadingComponent={<div>Loading...</div>}
    >
      <KeycloakProviderContent>
        {children}
      </KeycloakProviderContent>
    </ReactKeycloakProvider>
  )
}

// Component that provides the auth context
const KeycloakProviderContent = ({ children }) => {
  const { keycloak, initialized } = useKeycloak()
  
  // Pass the auth values through context
  const authValue = {
    keycloak,
    initialized,
    token: keycloak?.token,
    isAuthenticated: keycloak?.authenticated,
    logout: () => keycloak?.logout(),
    hasRole: (role) => keycloak?.hasRealmRole(role) || false
  }

  return (
    <KeycloakAuthContext.Provider value={authValue}>
      {children}
    </KeycloakAuthContext.Provider>
  )
}

// Hook to use auth context
export const useKeycloakAuth = () => {
  const context = useContext(KeycloakAuthContext)
  if (!context) {
    throw new Error('useKeycloakAuth must be used within a KeycloakAuthProvider')
  }
  return context
}
