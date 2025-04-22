import { useKeycloak } from '@react-keycloak/web'

export const useAuth = () => {
  // Check if we should use Keycloak
  const shouldUseKeycloak = window.controllerConfig?.keycloakURL &&
     window.controllerConfig?.keycloakRealm &&
     window.controllerConfig?.keycloakClientid

  // If we shouldn't use Keycloak, return mock values without calling useKeycloak
  if (!shouldUseKeycloak) {
    return {
      keycloak: null,
      initialized: true
    }
  }

  // Only call useKeycloak when we're actually using Keycloak
  return useKeycloak()
}
