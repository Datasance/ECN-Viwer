import Keycloak from 'keycloak-js'
const controllerJson = window.controllerConfig

let initOptions = {
  url: controllerJson?.keycloakURL,
  realm: controllerJson?.keycloakRealm,
  clientId: controllerJson?.keycloakClientid,
  onLoad: 'login-required',
  KeycloakResponseType: "code",
  checkLoginIframe: false,
};

const keycloak = new Keycloak(initOptions);

export default keycloak