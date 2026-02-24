const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("__contextStore", {
  getContexts: () => ipcRenderer.invoke("context-store:getContexts"),
  getActiveContextId: () => ipcRenderer.invoke("context-store:getActiveContextId"),
  setActiveContextId: (id) =>
    ipcRenderer.invoke("context-store:setActiveContextId", id),
  saveContext: (context) =>
    ipcRenderer.invoke("context-store:saveContext", context),
  deleteContext: (id) =>
    ipcRenderer.invoke("context-store:deleteContext", id),
  getContext: (id) => ipcRenderer.invoke("context-store:getContext", id),
});

contextBridge.exposeInMainWorld("__controllerFetch", (opts) =>
  ipcRenderer.invoke("controller-fetch", opts)
);

contextBridge.exposeInMainWorld("__subscribeOidcCallbackUrl", (callback) => {
  ipcRenderer.on("oidc-callback-url", (_, url) => callback(url));
  ipcRenderer.invoke("oidc-callback-request").then((url) => {
    if (url) callback(url);
  });
});

contextBridge.exposeInMainWorld("__notifyOidcCallbackProcessed", () => {
  ipcRenderer.send("oidc-callback-processed");
});

contextBridge.exposeInMainWorld("__subscribeOidcPopupClosed", (callback) => {
  ipcRenderer.on("oidc-popup-closed", () => callback());
});

// External-browser OIDC (packaged Electron only)
contextBridge.exposeInMainWorld("__electronAuthStartLogin", (config) => {
  ipcRenderer.send("auth:start-login", config);
});
contextBridge.exposeInMainWorld("__electronAuthGetAccessToken", () =>
  ipcRenderer.invoke("auth:get-access-token")
);
contextBridge.exposeInMainWorld("__electronAuthLogout", () => {
  ipcRenderer.send("auth:logout");
});
contextBridge.exposeInMainWorld("__subscribeOidcLoginSuccess", (callback) => {
  ipcRenderer.on("oidc-login-success", () => callback());
});
contextBridge.exposeInMainWorld("__subscribeOidcLoginError", (callback) => {
  ipcRenderer.on("oidc-login-error", (_, message) => callback(message));
});
