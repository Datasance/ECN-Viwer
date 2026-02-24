import Keycloak from "keycloak-js";

const controllerJson = window.controllerConfig;

const shouldUseKeycloak =
  controllerJson?.keycloakUrl &&
  controllerJson?.keycloakRealm &&
  controllerJson?.keycloakClientId;

let keycloak;

if (shouldUseKeycloak) {
  const initOptions = {
    url: controllerJson.keycloakUrl,
    realm: controllerJson.keycloakRealm,
    clientId: controllerJson.keycloakClientId,
    initOptions: {
      KeycloakResponseType: "code",
      pkceMethod: "S256",
    },
  };
  keycloak = new Keycloak(initOptions);
}
keycloak.init({ onLoad: "login-required" }).then((authenticated) => {
  console.log("authenticated?", authenticated);
});
export default keycloak;
