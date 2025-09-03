import React from "react";
import { useAuth } from "../auth";

const controllerJson = window.controllerConfig;
const IPLookUp = "http://ip-api.com/json/";

const getBaseUrl = () =>
  controllerJson.url ||
  `${window.location.protocol}//${[window.location.hostname, controllerJson.port].join(":")}`;

const getUrl = (path) =>
  controllerJson.dev ? `/api/controllerApi${path}` : `${getBaseUrl()}${path}`;

const getHeaders = (headers) => {
  if (controllerJson.dev) {
    return {
      ...headers,
      "ECN-Api-Destination": `http://${controllerJson.ip}:${controllerJson.port}/`,
    };
  }
  return headers;
};

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
  if (response.ok) {
    return response.json();
  }
  throw new Error(response.statusText);
};

const getControllerStatus = async () => {
  const response = await fetch(getUrl("/api/v3/status"), {
    headers: getHeaders({}),
  });
  if (response.ok) return response.json();
  console.log("Controller status unreachable", { status: response.statusText });
  return null;
};

export const ControllerProvider = ({ children }) => {
  const [state, dispatch] = React.useReducer(reducer, initState);
  const auth = useAuth();

  const updateController = (data) => {
    dispatch({ type: "UPDATE", data });
  };

  const request = async (path, options = {}) => {
    const headers = {
      ...options.headers,
    };
    const token = auth?.token;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(getUrl(path), {
        ...options,
        headers,
      });

      if (!response.ok) {
        console.error(`HTTP error! status: ${response.status}`);
        return null;
      }

      return response;
    } catch (error) {
      console.error("Request failed:", error);
      return null;
    }
  };

  React.useEffect(() => {
    const effect = async () => {
      try {
        const ipInfo = await lookUpControllerInfo(controllerJson.ip);
        dispatch({ type: "UPDATE", data: { location: ipInfo } });
      } catch (e) {
        dispatch({
          type: "UPDATE",
          data: {
            location: {
              lat: "40.935",
              lon: "28.97",
              query: controllerJson.ip,
            },
          },
        });
      }
    };
    effect();
  }, []);

  React.useEffect(() => {
    const effect = async () => {
      const status = await getControllerStatus();
      dispatch({ type: "UPDATE", data: { status } });
    };

    if (auth.isAuthenticated) {
      dispatch({ type: "UPDATE", data: { user: auth.user } });
      effect();
    }
  }, [auth.user, auth.isAuthenticated]);

  return (
    <ControllerContext.Provider
      value={{
        ...state,
        updateController,
        request,
      }}
    >
      {children}
    </ControllerContext.Provider>
  );
};
