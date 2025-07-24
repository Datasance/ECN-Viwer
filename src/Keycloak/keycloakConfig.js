import Keycloak from 'keycloak-js'

// Get controller configuration
const controllerJson = window.controllerConfig

// Check if we should use Keycloak
const shouldUseKeycloak = controllerJson?.keycloakURL &&
   controllerJson?.keycloakRealm &&
   controllerJson?.keycloakClientid

let keycloak

// Only initialize Keycloak if we have all required config and should use it
if (shouldUseKeycloak) {
  const initOptions = {
    url: controllerJson.keycloakURL,
    realm: controllerJson.keycloakRealm,
    clientId: controllerJson.keycloakClientid,
    initOptions: {
      KeycloakResponseType: 'code',
      pkceMethod: 'S256'
    }
  }
  // console.log('Initializing Keycloak with config:', initOptions)
  keycloak = new Keycloak(initOptions)
}

export default keycloak
