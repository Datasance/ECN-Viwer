import Keycloak from 'keycloak-js'

debugger
let initOptions = {
  url: `${process.env.KC_URL}`,
  realm: process.env.KC_REALM,
  clientId: process.env.KC_VIEWER_CLIENT,
  onLoad: 'login-required',
  KeycloakResponseType: "code",
};

const keycloak = new Keycloak(initOptions);

export default keycloak