import { useKeycloak } from '@react-keycloak/web'

// Check if we should use Keycloak
const shouldUseKeycloak = window.controllerConfig?.keycloakURL &&
  window.controllerConfig?.keycloakRealm &&
  window.controllerConfig?.keycloakClientid

export const useAuth = () => {
  // Use the real Keycloak hook
  const { keycloak, initialized } = useKeycloak()

  // If Keycloak isn't configured or initialized, return mock values
  if (!shouldUseKeycloak) {
    return {
      keycloak: null,
      initialized: true,
      token: 'mock-token'
    }
  }

  // Return the real Keycloak state with an easily accessible token property
  return {
    keycloak,
    initialized,
    token: keycloak?.token
  }
}
