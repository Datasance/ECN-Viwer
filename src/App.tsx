import CssBaseline from "@material-ui/core/CssBaseline";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
import React, { useEffect } from "react";
import { ControllerProvider } from "./ControllerProvider";
import { DataProvider } from "./providers/Data";
import { TerminalProvider } from "./providers/Terminal/TerminalProvider";
import { LogViewerProvider } from "./providers/LogViewer/LogViewerProvider";
import Layout from "./Layout";
import "./App.scss";

import FeedbackContext from "./Utils/FeedbackContext";
import ThemeContext from "./Theme/ThemeProvider";
import { ConfigProvider } from "./providers/Config";
import { PollingConfigProvider } from "./providers/PollingConfig/PollingConfigProvider";
import "./styles/tailwind.css";
import { KeycloakAuthProvider } from "./auth";
import "immutable";
import "xterm/css/xterm.css";

function App() {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("code") || urlParams.get("state")) {
      const cleanUrl = window.location.origin + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, []);

  return (
    <KeycloakAuthProvider>
      <CssBaseline />
      <ThemeContext>
        <DndProvider backend={HTML5Backend}>
          <ControllerProvider>
            <ConfigProvider>
              <PollingConfigProvider>
                <DataProvider>
                  <TerminalProvider>
                    <LogViewerProvider>
                      <FeedbackContext>
                        <Layout />
                      </FeedbackContext>
                    </LogViewerProvider>
                  </TerminalProvider>
                </DataProvider>
              </PollingConfigProvider>
            </ConfigProvider>
          </ControllerProvider>
        </DndProvider>
      </ThemeContext>
    </KeycloakAuthProvider>
  );
}

export default App;
