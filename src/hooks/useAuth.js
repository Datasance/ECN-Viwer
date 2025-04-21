import { useKeycloak } from '@react-keycloak/web'

export const useAuth = () => {
  // Check if we should use Keycloak
  const shouldUseKeycloak = !window.controllerConfig?.dev || 
    (window.controllerConfig?.keycloakURL && 
     window.controllerConfig?.keycloakRealm && 
     window.controllerConfig?.keycloakClientid)

  // If we shouldn't use Keycloak, return mock values
  if (!shouldUseKeycloak) {
    return {
      keycloak: null,
      initialized: true
    }
  }

  // Only use real Keycloak when needed
  return useKeycloak()
}
