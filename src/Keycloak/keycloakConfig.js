import Keycloak from 'keycloak-js'

const controllerJson = window.controllerConfig

const shouldUseKeycloak = controllerJson?.keycloakURL &&
   controllerJson?.keycloakRealm &&
   controllerJson?.keycloakClientid

let keycloak

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
  keycloak = new Keycloak(initOptions)
}
keycloak.init({ onLoad: 'login-required' }).then(authenticated => {
  console.log('authenticated?', authenticated)
})
export default keycloak
