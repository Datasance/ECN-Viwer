import React from "react";
import { useAuth } from "../auth";
import { useFeedback } from "../Utils/FeedbackContext";
import { useControllerConfig } from "../contexts/ActiveContextProvider";

const IPLookUp = "http://ip-api.com/json/";

function getBaseUrl(controllerConfig) {
  if (!controllerConfig) return "";
  return (
    controllerConfig.url ||
    `${window.location.protocol}//${[window.location.hostname, controllerConfig.port].join(":")}`
  );
}

function getUrl(controllerConfig, path) {
  if (!controllerConfig) return "";
  if (controllerConfig.dev) {
    return `/api/controllerApi${path}`;
  }
  return `${getBaseUrl(controllerConfig)}${path}`;
}

function getHeaders(controllerConfig, headers) {
  if (!controllerConfig || !controllerConfig.dev) return headers || {};
  return {
    ...headers,
    "ECN-Api-Destination": `http://${controllerConfig.ip}:${controllerConfig.port}/`,
  };
}

function isElectronWithCA(controllerConfig) {
  return (
    typeof window !== "undefined" &&
    window.__controllerFetch &&
    controllerConfig?.controllerCA
  );
}

async function doRequest(controllerConfig, url, options = {}) {
  if (isElectronWithCA(controllerConfig)) {
    const body =
      options.body != null
        ? typeof options.body === "string"
          ? options.body
          : JSON.stringify(options.body)
        : undefined;
    const result = await window.__controllerFetch({
      url,
      method: options.method || "GET",
      headers: options.headers || {},
      body,
      controllerCA: controllerConfig.controllerCA,
    });
    return new Response(result.body, {
      status: result.status,
      statusText: result.statusText,
      headers: new Headers(result.headers || {}),
    });
  }
  return fetch(url, options);
}

export const ControllerContext = React.createContext();
export const useController = () => React.useContext(ControllerContext);

const initState = {
  user: null,
  status: null,
  refresh: null,
  location: null,
};

const reducer = (state, action) => {
  switch (action.type) {
    case "UPDATE":
      return { ...state, ...action.data };
    default:
      return state;
  }
};

const lookUpControllerInfo = async (ip) => {
  if (!ip) ip = window.location.host.split(":")[0];
  const localhost = /(0\.0\.0\.0|localhost|127\.0\.0\.1|192\.168\.)/;
  const lookupIP = localhost.test(ip) ? "8.8.8.8" : ip;
  const response = await fetch(
    IPLookUp + lookupIP.replace("http://", "").replace("https://", ""),
  );
  if (response.ok) return response.json();
  throw new Error(response.statusText);
};

export const ControllerProvider = ({ children }) => {
  const controllerConfig = useControllerConfig();
  const [state, dispatch] = React.useReducer(reducer, initState);
  const auth = useAuth();
  const feedbackContext = useFeedback();
  const pushFeedback = feedbackContext?.pushFeedback;

  const updateController = (data) => {
    dispatch({ type: "UPDATE", data });
  };

  const request = async (path, options = {}) => {
    const headers = { ...options.headers };
    const token = auth?.token;
    if (token) headers.Authorization = `Bearer ${token}`;

    const url = getUrl(controllerConfig, path);
    if (!url) return null;

    try {
      const response = await doRequest(controllerConfig, url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const status = response.status;
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = {
            message: response.statusText || "An error occurred",
          };
        }
        if ((status === 401 || status === 403) && pushFeedback) {
          const errorMessage =
            errorData.message ||
            (status === 401
              ? "Unauthorized: You don't have permission to access this resource"
              : "Forbidden: Access to this resource is denied");
          pushFeedback({ message: errorMessage, type: "error" });
        }
        return {
          ...errorData,
          ok: false,
          status,
          statusText: response.statusText,
        };
      }
      return response;
    } catch (error) {
      console.error("Request failed:", error);
      return null;
    }
  };

  React.useEffect(() => {
    if (!controllerConfig?.url) return;
    let mounted = true;
    const u = new URL(controllerConfig.url);
    const ip = u.hostname;
    lookUpControllerInfo(ip)
      .then((ipInfo) => mounted && dispatch({ type: "UPDATE", data: { location: ipInfo } }))
      .catch(() =>
        mounted &&
        dispatch({
          type: "UPDATE",
          data: {
            location: {
              lat: "40.935",
              lon: "28.97",
              query: ip,
            },
          },
        }),
      );
    return () => { mounted = false; };
  }, [controllerConfig?.url]);

  React.useEffect(() => {
    if (!controllerConfig || !auth.isAuthenticated) return;
    dispatch({ type: "UPDATE", data: { user: auth.user } });
    const doStatus = async () => {
      const url = getUrl(controllerConfig, "/api/v3/status");
      const res = await doRequest(controllerConfig, url, {
        headers: getHeaders(controllerConfig, {}),
      });
      if (res.ok) {
        const data = await res.json();
        dispatch({ type: "UPDATE", data: { status: data } });
      } else {
        console.log("Controller status unreachable", { status: res.statusText });
        dispatch({ type: "UPDATE", data: { status: null } });
      }
    };
    doStatus();
  }, [controllerConfig, auth.user, auth.isAuthenticated]);

  const value = {
    ...state,
    updateController,
    request,
    controllerConfig,
    getUrl: (path) => getUrl(controllerConfig, path),
    getBaseUrl: () => getBaseUrl(controllerConfig),
  };

  return (
    <ControllerContext.Provider value={value}>
      {children}
    </ControllerContext.Provider>
  );
};
