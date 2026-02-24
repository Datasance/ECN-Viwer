import CssBaseline from "@mui/material/CssBaseline";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
import React from "react";
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
import { ActiveContextProvider, useActiveContext } from "./contexts/ActiveContextProvider";
import { SESSION_KEY_CONTEXT_CHOSEN } from "./contexts/contextStore";
import ContextsPage from "./contexts/ContextsPage";
import "immutable";
import "xterm/css/xterm.css";

function AppContent() {
  const { activeContext } = useActiveContext();
  const hasChosenContextThisSession =
    typeof sessionStorage !== "undefined" &&
    sessionStorage.getItem(SESSION_KEY_CONTEXT_CHOSEN) === "1";

  // Option A: always show Contexts first until user selects a context this session.
  if (!activeContext || !hasChosenContextThisSession) {
    return (
      <ThemeContext>
        <CssBaseline />
        <ContextsPage />
      </ThemeContext>
    );
  }

  return (
    <KeycloakAuthProvider>
      <CssBaseline />
      <ThemeContext>
        <DndProvider backend={HTML5Backend}>
          <FeedbackContext>
            <ControllerProvider>
              <ConfigProvider>
                <PollingConfigProvider>
                  <DataProvider>
                    <TerminalProvider>
                      <LogViewerProvider>
                        <Layout />
                      </LogViewerProvider>
                    </TerminalProvider>
                  </DataProvider>
                </PollingConfigProvider>
              </ConfigProvider>
            </ControllerProvider>
          </FeedbackContext>
        </DndProvider>
      </ThemeContext>
    </KeycloakAuthProvider>
  );
}

function App() {
  // Do not strip ?code=...&state=... here. The OIDC library must read them first to complete
  // the sign-in. Our auth config's onSigninCallback cleans the URL after the callback is processed.

  return (
    <ActiveContextProvider>
      <AppContent />
    </ActiveContextProvider>
  );
}

export default App;
