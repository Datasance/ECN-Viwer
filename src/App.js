import CssBaseline from "@material-ui/core/CssBaseline";
import Backend from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
import React from 'react'
import { ReactKeycloakProvider } from '@react-keycloak/web'
import { ControllerProvider } from './ControllerProvider'
import { DataProvider } from './providers/Data'
import Layout from './Layout'
import './App.scss'

import FeedbackContext from "./Utils/FeedbackContext";
import ThemeContext from "./Theme/ThemeProvider";
import { ConfigProvider } from "./providers/Config";
import keycloak from "./Keycloak/keycloakConfig";

function App() {
  // Check if we should use Keycloak
  // We use Keycloak when:
  // 1. Not in dev mode OR
  // 2. In dev mode with all required Keycloak config
  const shouldUseKeycloak = !window.controllerConfig?.controllerDevMode || 
    (window.controllerConfig?.keycloakURL && 
     window.controllerConfig?.keycloakRealm && 
     window.controllerConfig?.keycloakClientid)

  console.log('App - Using Keycloak:', shouldUseKeycloak, 'config:', window.controllerConfig)

  // Base app structure
  const appContent = (
    <>
      <CssBaseline />
      <ThemeContext>
        <DndProvider backend={Backend}>
          <ControllerProvider>
            <ConfigProvider>
              <DataProvider>
                <FeedbackContext>
                  <Layout />
                </FeedbackContext>
              </DataProvider>
            </ConfigProvider>
          </ControllerProvider>
        </DndProvider>
      </ThemeContext>
    </>
  )

  // Only wrap with Keycloak provider when needed
  if (shouldUseKeycloak) {
    return (
      <ReactKeycloakProvider
        authClient={keycloak}
        initOptions={{
          onLoad: "login-required",
          KeycloakResponseType: "code",
          pkceMethod: "S256",
          inAppBrowserOptions: {},
        }}
        LoadingComponent={<div>Loading...</div>}
      >
        {appContent}
      </ReactKeycloakProvider>
    )
  }

  // Return app content directly when not using Keycloak
  return appContent
}

export default App;
