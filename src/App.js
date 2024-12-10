import CssBaseline from "@material-ui/core/CssBaseline";
import Backend from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";

import "./App.scss";
import FeedbackContext from "./Utils/FeedbackContext";
import ThemeContext from "./Theme/ThemeProvider";
import ControllerContext from "./ControllerProvider";
import { ConfigProvider } from "./providers/Config";
import { DataProvider } from "./providers/Data";
import { ReactKeycloakProvider } from "@react-keycloak/web";
import keycloak from "./Keycloak/keycloakConfig";
import Layout from "./Layout";
import SwaggerDoc from "./swagger/SwaggerDoc"

function App() {
  const isSwagger = window.location.pathname === "/api";
  return (
    <>
      {isSwagger ? (
        <SwaggerDoc />
      ) : (
        <>
          <CssBaseline />
          <ThemeContext>
            <DndProvider backend={Backend}>
              <ReactKeycloakProvider
                authClient={keycloak}
                initOptions={{
                  onLoad: "login-required",
                  KeycloakResponseType: "code",
                  pkceMethod: "S256",
                  inAppBrowserOptions: {},
                }}
              >
                <ControllerContext>
                  <ConfigProvider>
                    <DataProvider>
                      <FeedbackContext>
                        <Layout />
                      </FeedbackContext>
                    </DataProvider>
                  </ConfigProvider>
                </ControllerContext>
              </ReactKeycloakProvider>
            </DndProvider>
          </ThemeContext>
        </>
      )}
    </>
  );
}

export default App;
