import React, { createContext, useContext, useEffect } from 'react'
import { ReactKeycloakProvider, useKeycloak } from '@react-keycloak/web'
import keycloak from '../Keycloak/keycloakConfig'
import CustomLoadingModal from '../CustomComponent/CustomLoadingModal'

// Create the authentication context
const KeycloakAuthContext = createContext(null)

// Component responsible for refreshing the token periodically
const TokenRefresh = () => {
  const { keycloak } = useKeycloak()

  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (keycloak?.token) {
        // Attempt to refresh the token if it's about to expire
        keycloak.updateToken(60).catch(() => {
          console.warn('Token refresh failed. Logging out for safety.')
          keycloak.logout()
        })
      }
    }, 60000) // Refresh every 60 seconds

    return () => clearInterval(refreshInterval)
  }, [keycloak])

  return null
}

// Provider component that wraps the app with Keycloak authentication
export const KeycloakAuthProvider = ({ children }) => {
  return (
    <ReactKeycloakProvider
      authClient={keycloak}
      initOptions={{
        onLoad: 'login-required',
        pkceMethod: 'S256',
      }}
      onTokens={() => {
        console.log('Token updated or refreshed.')
      }}
      onEvent={(event, error) => {
        console.log('Keycloak event:', event)
        if (event === 'onAuthRefreshError') {
          console.error('Failed to refresh token:', error)
        }
      }}
      LoadingComponent={<CustomLoadingModal
        open={true}
        message={"Loading ECN-Viewer"}
        spinnerSize="lg"
        spinnerColor="text-green-500"
        overlayOpacity={60}
    />}
    >
      <KeycloakProviderContent>
        {children}
      </KeycloakProviderContent>
    </ReactKeycloakProvider>
  )
}

// Component that sets up and provides the Keycloak context values
const KeycloakProviderContent = ({ children }) => {
  const { keycloak, initialized } = useKeycloak()

  // Define values to be passed through the context
  const authValue = {
    keycloak,
    initialized,
    token: keycloak?.token,
    isAuthenticated: keycloak?.authenticated,
    logout: () => keycloak?.logout(),
    hasRole: (role) => keycloak?.hasRealmRole(role) || false,
  }

  return (
    <KeycloakAuthContext.Provider value={authValue}>
      <TokenRefresh />
      {children}
    </KeycloakAuthContext.Provider>
  )
}

// Custom hook to access the Keycloak authentication context
export const useKeycloakAuth = () => {
  const context = useContext(KeycloakAuthContext)
  if (!context) {
    throw new Error('useKeycloakAuth must be used within a KeycloakAuthProvider')
  }
  return context
}
