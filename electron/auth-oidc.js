/**
 * OIDC auth for Electron: external browser + main-process token exchange.
 * Used when app is packaged; avoids popup/redirect callback issues in the renderer.
 */
const crypto = require("crypto");
const https = require("https");
const http = require("http");
const path = require("path");
const fs = require("fs");

const REDIRECT_URI = "com.datasance.ecn-viewer://callback";

let codeVerifier = null;
let state = null;
let pendingConfig = null;

const TOKENS_FILE = "oidc-tokens.json";
const PENDING_FILE = "oidc-pending.json";
const PENDING_TTL_MS = 10 * 60 * 1000; // 10 min

function getTokensPath(userDataPath) {
  return path.join(userDataPath, TOKENS_FILE);
}

function getPendingPath(userDataPath) {
  return path.join(userDataPath, PENDING_FILE);
}

function savePendingState(userDataPath) {
  if (!codeVerifier || !state || !pendingConfig) return;
  const filePath = getPendingPath(userDataPath);
  fs.writeFileSync(
    filePath,
    JSON.stringify(
      {
        codeVerifier,
        state,
        keycloakUrl: pendingConfig.keycloakUrl,
        keycloakRealm: pendingConfig.keycloakRealm,
        keycloakClientId: pendingConfig.keycloakClientId,
        createdAt: Date.now(),
      },
      null,
      2
    ),
    "utf8"
  );
}

function loadPendingState(userDataPath) {
  try {
    const filePath = getPendingPath(userDataPath);
    if (!fs.existsSync(filePath)) return null;
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (Date.now() - (data.createdAt || 0) > PENDING_TTL_MS) {
      fs.unlinkSync(filePath);
      return null;
    }
    fs.unlinkSync(filePath);
    return {
      codeVerifier: data.codeVerifier,
      state: data.state,
      config: {
        keycloakUrl: data.keycloakUrl,
        keycloakRealm: data.keycloakRealm,
        keycloakClientId: data.keycloakClientId,
      },
    };
  } catch (e) {
    return null;
  }
}

function generateCodeVerifier() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let result = "";
  const bytes = crypto.randomBytes(64);
  for (let i = 0; i < 64; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

function base64UrlEncode(buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function generateCodeChallenge(verifier) {
  const hash = crypto.createHash("sha256").update(verifier).digest();
  return base64UrlEncode(hash);
}

function generateState() {
  return base64UrlEncode(crypto.randomBytes(32));
}

/**
 * Build Keycloak authorize URL and open in external browser.
 * @param {{ keycloakUrl: string, keycloakRealm: string, keycloakClientId: string }} config
 * @param {string} userDataPath - app.getPath('userData')
 * @param {function} openExternal - shell.openExternal
 */
async function getAuthUrlAndOpen(config, userDataPath, openExternal) {
  const base = (config.keycloakUrl || "").replace(/\/+$/, "");
  if (!base || !config.keycloakRealm || !config.keycloakClientId) {
    throw new Error("Missing Keycloak config (keycloakUrl, keycloakRealm, keycloakClientId)");
  }
  codeVerifier = generateCodeVerifier();
  state = generateState();
  pendingConfig = { ...config };
  savePendingState(userDataPath);
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const authUrl = `${base}/realms/${config.keycloakRealm}/protocol/openid-connect/auth?` + new URLSearchParams({
    response_type: "code",
    client_id: config.keycloakClientId,
    redirect_uri: REDIRECT_URI,
    scope: "openid profile email",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
  }).toString();
  openExternal(authUrl);
}

/**
 * Parse callback URL and exchange code for tokens. Stores tokens in userData.
 * @param {string} callbackUrl - e.g. com.datasance.ecn-viewer://callback?code=...&state=...
 * @param {string} userDataPath
 * @returns {Promise<{ accessToken: string, refreshToken?: string }>}
 */
function loadTokens(callbackUrl, userDataPath) {
  const parsed = new URL(callbackUrl);
  const code = parsed.searchParams.get("code");
  const returnedState = parsed.searchParams.get("state");
  if (!code || !returnedState) {
    return Promise.reject(new Error("Missing code or state in callback URL"));
  }
  if (returnedState !== state) {
    return Promise.reject(new Error("State mismatch"));
  }
  let config = pendingConfig;
  let verifier = codeVerifier;
  if (!config || !verifier) {
    const pending = loadPendingState(userDataPath);
    if (pending) {
      verifier = pending.codeVerifier;
      config = pending.config;
      if (returnedState !== pending.state) {
        return Promise.reject(new Error("State mismatch"));
      }
    }
  } else if (returnedState !== state) {
    return Promise.reject(new Error("State mismatch"));
  }
  if (!config || !verifier) {
    return Promise.reject(new Error("No pending login (code_verifier missing)"));
  }
  const base = (config.keycloakUrl || "").replace(/\/+$/, "");
  const tokenUrl = `${base}/realms/${config.keycloakRealm}/protocol/openid-connect/token`;
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: config.keycloakClientId,
    redirect_uri: REDIRECT_URI,
    code,
    code_verifier: verifier,
  }).toString();

  codeVerifier = null;
  state = null;
  pendingConfig = null;
  try {
    const pendingPath = getPendingPath(userDataPath);
    if (fs.existsSync(pendingPath)) fs.unlinkSync(pendingPath);
  } catch (e) { /* ignore */ }

  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(tokenUrl);
    const isHttps = parsedUrl.protocol === "https:";
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(body),
      },
    };
    const mod = isHttps ? https : http;
    const req = mod.request(options, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const responseBody = Buffer.concat(chunks).toString("utf8");
        if (res.statusCode !== 200) {
          reject(new Error(`Token exchange failed: ${res.statusCode} ${responseBody}`));
          return;
        }
        try {
          const data = JSON.parse(responseBody);
          const accessToken = data.access_token;
          const refreshToken = data.refresh_token || null;
          const tokens = { accessToken, refreshToken };
          saveTokens(userDataPath, tokens);
          resolve(tokens);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function saveTokens(userDataPath, tokens) {
  const filePath = getTokensPath(userDataPath);
  fs.writeFileSync(filePath, JSON.stringify(tokens, null, 2), "utf8");
}

function loadStoredTokens(userDataPath) {
  try {
    const filePath = getTokensPath(userDataPath);
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (e) {
    if (e.code === "ENOENT") return null;
    throw e;
  }
}

function clearTokens(userDataPath) {
  codeVerifier = null;
  state = null;
  pendingConfig = null;
  try {
    const filePath = getTokensPath(userDataPath);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (e) {
    // ignore
  }
}

module.exports = {
  REDIRECT_URI,
  getAuthUrlAndOpen,
  loadTokens,
  loadStoredTokens,
  clearTokens,
};
