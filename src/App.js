import React from 'react'

import CssBaseline from '@material-ui/core/CssBaseline'
import Backend from 'react-dnd-html5-backend'
import { DndProvider } from 'react-dnd'

import Layout from './Layout'

import './App.scss'
import FeedbackContext from './Utils/FeedbackContext'
import ThemeContext from './Theme/ThemeProvider'
import ControllerContext from './ControllerProvider'
import { ConfigProvider } from './providers/Config'
import { DataProvider } from './providers/Data'

function App () {
  console.log(' ======> Rendering app ')
  return (
    <>
      <CssBaseline />
      <ThemeContext>
        <DndProvider backend={Backend}>
          <ControllerContext>
            <ConfigProvider>
              <DataProvider>
                <FeedbackContext>
                  <Layout />
                </FeedbackContext>
              </DataProvider>
            </ConfigProvider>
          </ControllerContext>
        </DndProvider>
      </ThemeContext>
    </>
  )
}

export default App
