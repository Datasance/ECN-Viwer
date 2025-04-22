import { useKeycloak } from '@react-keycloak/web'

export const useAuth = () => {
  // Always call the hook first
  const keycloakState = useKeycloak()

  // Check if we should use Keycloak
  const shouldUseKeycloak = window.controllerConfig?.keycloakURL &&
    window.controllerConfig?.keycloakRealm &&
    window.controllerConfig?.keycloakClientid

  // If we shouldn't use Keycloak, return mock values
  if (!shouldUseKeycloak) {
    return {
      keycloak: null,
      initialized: true
    }
  }

  // Return the real Keycloak state when auth is configured
  return keycloakState
}
