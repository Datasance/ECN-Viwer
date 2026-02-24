const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const https = require("https");
const http = require("http");
const authOidc = require("./auth-oidc");

// Suppress GPU compositing errors (SharedImageManager / Invalid mailbox on some drivers)
app.commandLine.appendSwitch("disable-gpu-compositing");

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;
const CONTEXTS_FILE = "contexts.json";
const ACTIVE_ID_KEY = "activeContextId";
const PROTOCOL_SCHEME = "com.datasance.ecn-viewer";

let mainWindow = null;
let loginPopupWindow = null;
let pendingProtocolUrl = null;
/** Last OIDC callback URL we sent (or would send) so renderer can fetch it if it wasn't ready. */
let lastOidcCallbackUrl = null;

function getContextsPath() {
  return path.join(app.getPath("userData"), CONTEXTS_FILE);
}

function readContexts() {
  try {
    const data = fs.readFileSync(getContextsPath(), "utf8");
    return JSON.parse(data);
  } catch (e) {
    if (e.code === "ENOENT") return { contexts: [], [ACTIVE_ID_KEY]: null };
    return { contexts: [], [ACTIVE_ID_KEY]: null };
  }
}

function writeContexts(data) {
  fs.writeFileSync(getContextsPath(), JSON.stringify(data, null, 2), "utf8");
}

/** OIDC: in packaged app use external-browser flow (token exchange in main). Otherwise send URL to renderer for popup callback. */
function handleProtocolUrl(url) {
  try {
    if (!url.startsWith(`${PROTOCOL_SCHEME}:`)) return;
    if (!isDev) {
      authOidc.loadTokens(url, app.getPath("userData"))
        .then(() => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.focus();
            mainWindow.webContents.send("oidc-login-success");
          }
        })
        .catch((e) => {
          console.error("OIDC token exchange error:", e);
          if (mainWindow && !mainWindow.isDestroyed()) mainWindow.focus();
        });
      return;
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.focus();
      lastOidcCallbackUrl = url;
      mainWindow.webContents.send("oidc-callback-url", url);
    } else {
      pendingProtocolUrl = url;
    }
  } catch (e) {
    console.error("handleProtocolUrl error:", e);
  }
}

function closeLoginPopup() {
  if (loginPopupWindow && !loginPopupWindow.isDestroyed()) {
    loginPopupWindow.close();
    loginPopupWindow = null;
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow = win;
  win.on("closed", () => { mainWindow = null; });

  // Track login popup for OIDC (close it when we get the callback via protocol).
  win.webContents.setWindowOpenHandler(() => ({ action: "allow" }));
  win.webContents.on("did-create-window", (popup) => {
    loginPopupWindow = popup;
    popup.on("closed", () => {
      if (loginPopupWindow === popup) loginPopupWindow = null;
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("oidc-popup-closed");
      }
    });
  });

  if (isDev) {
    win.loadURL("http://localhost:3000");
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "../build/index.html")).then(() => {
      if (pendingProtocolUrl) {
        const urlToHandle = pendingProtocolUrl;
        pendingProtocolUrl = null;
        handleProtocolUrl(urlToHandle);
      }
    });
  }
}

app.setAsDefaultProtocolClient(PROTOCOL_SCHEME);

ipcMain.handle("oidc-callback-request", () => {
  const url = lastOidcCallbackUrl || pendingProtocolUrl;
  lastOidcCallbackUrl = null;
  pendingProtocolUrl = null;
  return url;
});

ipcMain.on("oidc-callback-processed", () => {
  closeLoginPopup();
});

// External-browser OIDC (packaged Electron only)
ipcMain.on("auth:start-login", async (_, config) => {
  if (isDev) return;
  try {
    await authOidc.getAuthUrlAndOpen(config, app.getPath("userData"), (url) => shell.openExternal(url));
  } catch (e) {
    console.error("auth:start-login error:", e);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("oidc-login-error", e.message || String(e));
    }
  }
});

ipcMain.handle("auth:get-access-token", async () => {
  if (isDev) return null;
  const tokens = authOidc.loadStoredTokens(app.getPath("userData"));
  return tokens ? tokens.accessToken : null;
});

ipcMain.on("auth:logout", () => {
  if (isDev) return;
  authOidc.clearTokens(app.getPath("userData"));
});

app.whenReady().then(() => {
  app.on("open-url", (event, url) => {
    event.preventDefault();
    if (url.startsWith(`${PROTOCOL_SCHEME}:`)) handleProtocolUrl(url);
  });

  const gotLock = app.requestSingleInstanceLock();
  if (!gotLock) {
    app.quit();
    return;
  }
  app.on("second-instance", (_, argv) => {
    if (mainWindow) mainWindow.focus();
    const url = argv.find((arg) => arg.startsWith(`${PROTOCOL_SCHEME}:`));
    if (url) handleProtocolUrl(url);
  });

  if (!isDev && process.argv.length >= 2) {
    const url = process.argv.find((arg) => arg.startsWith(`${PROTOCOL_SCHEME}:`));
    if (url) pendingProtocolUrl = url;
  }

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// Context store IPC
ipcMain.handle("context-store:getContexts", async () => {
  const data = readContexts();
  return data.contexts || [];
});

ipcMain.handle("context-store:getActiveContextId", async () => {
  const data = readContexts();
  return data[ACTIVE_ID_KEY] ?? null;
});

ipcMain.handle("context-store:setActiveContextId", async (_, id) => {
  const data = readContexts();
  data[ACTIVE_ID_KEY] = id;
  writeContexts(data);
});

ipcMain.handle("context-store:saveContext", async (_, context) => {
  const data = readContexts();
  const list = data.contexts || [];
  const idx = list.findIndex((c) => c.id === context.id);
  if (idx >= 0) list[idx] = context;
  else list.push(context);
  data.contexts = list;
  writeContexts(data);
});

ipcMain.handle("context-store:deleteContext", async (_, id) => {
  const data = readContexts();
  data.contexts = (data.contexts || []).filter((c) => c.id !== id);
  if (data[ACTIVE_ID_KEY] === id) data[ACTIVE_ID_KEY] = null;
  writeContexts(data);
});

ipcMain.handle("context-store:getContext", async (_, id) => {
  const data = readContexts();
  const list = data.contexts || [];
  return list.find((c) => c.id === id) ?? null;
});

// Controller fetch with optional custom CA (for self-signed / private CA)
ipcMain.handle(
  "controller-fetch",
  async (
    _,
    { url, method = "GET", headers = {}, body, controllerCA }
  ) => {
    return new Promise((resolve, reject) => {
      const parsed = new URL(url);
      const isHttps = parsed.protocol === "https:";
      const options = {
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method,
        headers: { ...headers },
      };
      if (isHttps && controllerCA) {
        try {
          options.agent = new https.Agent({
            ca: Buffer.from(controllerCA, "base64"),
          });
        } catch (e) {
          return reject(e);
        }
      }
      const mod = isHttps ? https : http;
      const req = mod.request(options, (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            statusText: res.statusMessage,
            headers: res.headers,
            body: Buffer.concat(chunks).toString("utf8"),
          });
        });
      });
      req.on("error", reject);
      if (body) req.write(body);
      req.end();
    });
  }
);
