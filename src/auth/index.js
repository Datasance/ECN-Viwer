import { KeycloakAuthProvider, useKeycloakAuth } from './keycloakAuth'
import { MockAuthProvider, useMockAuth } from './mockAuth'

// Check if we should use Keycloak
const shouldUseKeycloak = window.controllerConfig?.keycloakURL &&
  window.controllerConfig?.keycloakRealm &&
  window.controllerConfig?.keycloakClientid

// Select the appropriate provider and hook based on config
export const AuthProvider = shouldUseKeycloak ? KeycloakAuthProvider : MockAuthProvider
export const useAuth = shouldUseKeycloak ? useKeycloakAuth : useMockAuth

// Export a simple way to check if we're using Keycloak
export const isUsingKeycloak = shouldUseKeycloak
