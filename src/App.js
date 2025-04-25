import CssBaseline from "@material-ui/core/CssBaseline";
import Backend from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
import React from 'react'
import { ControllerProvider } from './ControllerProvider'
import { DataProvider } from './providers/Data'
import Layout from './Layout'
import './App.scss'

import FeedbackContext from "./Utils/FeedbackContext";
import ThemeContext from "./Theme/ThemeProvider";
import { ConfigProvider } from "./providers/Config";
import { AuthProvider } from './auth'
import './styles/tailwind.css';

function App () {
  return (
    <AuthProvider>
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
    </AuthProvider>
  )
}

export default App
