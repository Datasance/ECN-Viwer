const controllerJson = (window as any).controllerConfig || {};

export const oidcConfig = {
  authority: controllerJson.keycloakUrl
    ? `${controllerJson.keycloakUrl.replace(/\/+$/, "")}/realms/${controllerJson.keycloakRealm}`
    : "",
  client_id: controllerJson.keycloakClientId || "",
  redirect_uri: `${window.location.origin}/`,
  response_type: "code",
  scope: "openid profile email",
  silent_redirect_uri: `${window.location.origin}/silent-renew.html`,
  automaticSilentRenew: true,
  loadUserInfo: true,
  onSigninCallback: () => {
    const hash = window.location.hash?.startsWith("#") ? window.location.hash : "#/";
    window.history.replaceState({}, document.title, window.location.origin + (hash || "#/"));
  },
};
