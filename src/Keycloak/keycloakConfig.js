import Keycloak from 'keycloak-js'
const controllerJson = window.controllerConfig

debugger
let initOptions = {
  url: controllerJson?.keycloakURL,
  realm: controllerJson?.keycloakRealm,
  clientId: controllerJson?.keycloakClientid,
  onLoad: 'login-required',
  KeycloakResponseType: "code",
};

const keycloak = new Keycloak(initOptions);

export default keycloak