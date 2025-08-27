const controllerJson = (window as any).controllerConfig || {};

export const oidcConfig = {
  authority: controllerJson.keycloakURL
    ? `${controllerJson.keycloakURL.replace(/\/+$/, "")}/realms/${controllerJson.keycloakRealm}`
    : "",
  client_id: controllerJson.keycloakClientid || "",
  redirect_uri: `${window.location.origin}${window.location.hash || "/#/"}`,
  response_type: "code",
  scope: "openid profile email",
  silent_redirect_uri: `${window.location.origin}/silent-renew.html`,
  automaticSilentRenew: true,
  loadUserInfo: true,
  onSigninCallback: () => {
    const cleanUrl =
      window.location.origin +
      (window.location.hash?.startsWith("#") ? window.location.hash : "/#/");

    window.history.replaceState({}, document.title, cleanUrl);
  },
};
