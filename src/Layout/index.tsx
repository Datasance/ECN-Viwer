import React from 'react'
import { HashRouter, Route, NavLink, useLocation, Routes, Navigate } from 'react-router-dom'
import Avatar from '@material-ui/core/Avatar'
import HomeIcon from '@material-ui/icons/HomeOutlined'
import CatalogIcon from '@material-ui/icons/GraphicEqOutlined'
import ExitToAppIcon from '@material-ui/icons/ExitToApp'
import AccountBoxIcon from '@material-ui/icons/AccountBox'
import DashboardIcon from '@material-ui/icons/Dashboard'
import { MapProvider } from '../providers/Map'
import { useData } from '../providers/Data'
import { useController } from '../ControllerProvider'
import { useKeycloak } from '@react-keycloak/web'

import ECNViewer from '../ECNViewer'
import Catalog from '../Catalog'
import Dashboard from '../Dashboard'
import SwaggerDoc from '../swagger/SwaggerDoc'
import logomark from '../assets/potLogoWithWhiteText.svg'

const controllerJson = window.controllerConfig || null

function RouteWatcher() {
  const { refreshData } = useData()
  const location = useLocation()

  React.useEffect(() => {
    if (location.pathname === '/overview' || location.pathname === '/dashboard') {
      console.log('Refreshing data')
      refreshData()
    }
  }, [])

  return null
}

export default function Layout() {
  const { keycloak, initialized } = useKeycloak()
  const returnHomeCbRef = React.useRef<(() => void) | null>(null);
  const { status, updateController } = useController()

  const returnHome = () => {
    if (returnHomeCbRef.current) {
      returnHomeCbRef.current()
    }
  }

  const handleLogout = async () => {
    try {
      if (keycloak) {
        await keycloak.logout()
      } else {
        updateController({ user: null })
        window.location.href = '/dashboard'
      }
    } catch (error) {
      console.error('Error during logout:', error)
    }
  }

  if (!initialized && keycloak) {
    return null
  }

  return (
    <HashRouter>
      <RouteWatcher />
      <div className="min-h-screen flex flex-col text-gray-900 bg-white dark:bg-gray-900 dark:text-white">


        <div className="flex">
          {/* Sidebar */}
          <div className="w-16 bg-[#2c3e50] flex flex-col items-center py-4 space-y-4">
            <div className="bg-[#2c3e50] flex justify-center">
              <NavLink to="/dashboard" onClick={returnHome}>
                <img src={logomark} className="w-9 mt-2" alt="Datasance" />
              </NavLink>
            </div>
            <NavLink to="/dashboard" className="bg-[#0E445C] rounded-full">
              <Avatar className="!bg-gray-800 cursor-pointer">
                <DashboardIcon />
              </Avatar>
            </NavLink>
            <NavLink to="/overview" onClick={returnHome} className="bg-[#0E445C] rounded-full">
              <Avatar className="!bg-gray-800 cursor-pointer">
                <HomeIcon />
              </Avatar>
            </NavLink>
            <NavLink to="/catalog" className="bg-[#0E445C] rounded-full">
              <Avatar className="!bg-gray-800 cursor-pointer">
                <CatalogIcon />
              </Avatar>
            </NavLink>
            {keycloak && (
              <Avatar className="!bg-gray-800 cursor-pointer" onClick={() =>
                window.open(`${controllerJson?.keycloakURL}admin/${controllerJson?.keycloakRealm}/console`, "_blank")
              }>
                <AccountBoxIcon />
              </Avatar>
            )}
            <Avatar className="!bg-gray-800 cursor-pointer" onClick={handleLogout}>
              <ExitToAppIcon />
            </Avatar>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-6 overflow-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" Component={Dashboard} />
              <Route path="/catalog" Component={Catalog} />
              <Route
                path="/overview"
                Component={() => (
                  <div className='max-h-[88vh] min-h-[88vh] overflow-auto'>
                    <MapProvider>
                      <ECNViewer returnHomeCBRef={returnHomeCbRef} />
                    </MapProvider>
                  </div>

                )}
              />
              <Route path="/api" Component={SwaggerDoc} />
              <Route Component={() => <Navigate to="/dashboard" />} />
            </Routes>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-xs text-center py-4 border-t border-gray-700 flex justify-between p-4">
          <div className="text-purple-300 mb-2">
            Controller v{status?.versions.controller} - ECN Viewer v{status?.versions.ecnViewer}
          </div>
          <div className="flex justify-center space-x-6 mb-2">
            <span className="text-purple-300 font-bold"></span>
            <a
              className="text-purple-300 font-black"
              href="https://docs.datasance.com"
              target="_blank"
              rel="noreferrer"
            >
              DOCS
            </a>
            <a
              className="text-purple-300 font-black"
              href={`/#/api?userToken=${keycloak?.token}&baseUrl=${/^(http:\/\/|https:\/\/)?((\d{1,3}\.){3}\d{1,3}|localhost)(:\d+)?$/.test(window.location.origin)
                ? `${window.location.origin.replace(/(:\d+)?$/, `:${window.controllerConfig?.port}`)}/api/v3`
                : `${window.location.origin}/api/v3`
                }`}
              target="_parent"
            >
              API
            </a>
          </div>
          <a href="https://datasance.com/" className="text-purple-300">
            © {new Date().getFullYear()} Datasance.
          </a>
        </footer>
      </div>
    </HashRouter>
  )
}
