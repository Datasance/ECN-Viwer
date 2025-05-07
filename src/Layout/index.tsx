import React from 'react'
import { HashRouter, Route, NavLink, useLocation, Routes, Navigate } from 'react-router-dom'
import Avatar from '@material-ui/core/Avatar'
import HomeIcon from '@material-ui/icons/HomeOutlined'
import CatalogIcon from '@material-ui/icons/GraphicEqOutlined'
import ExitToAppIcon from '@material-ui/icons/ExitToApp'
import AccountBoxIcon from '@material-ui/icons/AccountBox'
import DashboardIcon from '@material-ui/icons/Dashboard'
import ChevronLeftSharp from '@material-ui/icons/ChevronLeftSharp';
import ChevronRightSharp from '@material-ui/icons/ChevronRightSharp';
import AppsOutlined from '@material-ui/icons/AppsOutlined'
import MapOutlined from '@material-ui/icons/MapOutlined'
import SettingsEthernetOutlined from '@material-ui/icons/SettingsEthernetOutlined'
import BuildOutlined from '@material-ui/icons/BuildOutlined'
import ExtensionOutlined from '@material-ui/icons/ExtensionOutlined'
import NetworkCell from '@material-ui/icons/NetworkCell'

import { MapProvider } from '../providers/Map'
import { useData } from '../providers/Data'
import { useController } from '../ControllerProvider'
import { useKeycloak } from '@react-keycloak/web'

import ECNViewer from '../ECNViewer'
import Catalog from '../Catalog'
import Dashboard from '../Dashboard'
import SwaggerDoc from '../swagger/SwaggerDoc'
import logomark from '../assets/potLogoWithWhiteText.svg'

import { Sidebar, Menu, MenuItem, SubMenu, useProSidebar } from 'react-pro-sidebar';
import { ProSidebarProvider } from 'react-pro-sidebar';

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
  const [collapsed, setCollapsed] = React.useState(true);
  const [isPinned, setIsPinned] = React.useState(false)
  const { data } = useData()
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
      <div className="min-h-screen flex flex-col text-gray-900 dark:bg-gray-900 dark:text-white">

        <div className="flex">
          <ProSidebarProvider>
            <div
              className="max-h-[93.5vh] min-h-[93.5vh]"
              onMouseEnter={() => !isPinned && setCollapsed(false)}
              onMouseLeave={() => !isPinned && setCollapsed(true)}
            >
              <Sidebar collapsed={collapsed} backgroundColor="#2c3e50" className="h-full flex flex-col">
                <div className="flex justify-center py-4">
                  <NavLink to="/dashboard" onClick={returnHome}>
                    <img src={logomark} className="w-9 mt-2" alt="Datasance" />
                  </NavLink>
                </div>

                <div className="flex-grow">
                  <Menu>
                    <MenuItem
                      icon={<DashboardIcon />}
                      component={<NavLink to="/dashboard" />}
                      className="bg-[#2c3e50] transition-colors duration-300 hover:bg-[#1a2a35] hover:text-gray-600"
                    >
                      Dashboard
                    </MenuItem>

                    <SubMenu
                      label="Nodes"
                      icon={<AppsOutlined />}
                      className="bg-[#2c3e50] transition-colors duration-300 hover:bg-[#1a2a35] hover:text-gray-600"
                    >
                      <SubMenu
                        icon={<HomeIcon />}
                        label="List"
                        className="bg-[#2c3e50] transition-colors duration-300 hover:bg-[#1a2a35] hover:text-gray-600"
                      >
                        {
                          data?.activeAgents?.map((x: any) => (
                            <MenuItem
                              key={x.uuid}
                              icon={<BuildOutlined />}
                              component={<NavLink to={`/overview/${x.uuid}`} />}
                              className="bg-[#2c3e50] transition-colors duration-300 hover:bg-[#1a2a35] hover:text-gray-600"
                            >
                              {x.name}
                            </MenuItem>
                          ))
                        }
                      </SubMenu>
                      <MenuItem
                        icon={<HomeIcon />}
                        component={<NavLink to="/overview" />}
                        className="bg-[#2c3e50] transition-colors duration-300 hover:bg-[#1a2a35] hover:text-gray-600"
                      >
                        Map
                      </MenuItem>

                    </SubMenu>
                    <SubMenu
                      label="Workloads"
                      icon={<AppsOutlined />}
                      className="bg-[#2c3e50] transition-colors duration-300 hover:bg-[#1a2a35] hover:text-gray-600"
                    >
                      <MenuItem
                        icon={<HomeIcon />}
                        component={<NavLink to="/overview" />}
                        className="bg-[#2c3e50] transition-colors duration-300 hover:bg-[#1a2a35] hover:text-gray-600"
                      >
                        Overview
                      </MenuItem>
                      <SubMenu
                        label="Microservices"
                        icon={<SettingsEthernetOutlined />}
                        className="bg-[#2c3e50] transition-colors duration-300 hover:bg-[#1a2a35] hover:text-gray-600"
                      >
                        {
                          data?.activeMsvcs?.map((x: any) => (
                            <MenuItem
                              key={x.uuid}
                              icon={<BuildOutlined />}
                              component={<NavLink to={`/overview/${x.uuid}`} />}
                              className="bg-[#2c3e50] transition-colors duration-300 hover:bg-[#1a2a35] hover:text-gray-600"
                            >
                              {x.name}
                            </MenuItem>
                          ))
                        }
                      </SubMenu>
                      <SubMenu
                        label="System Microservices"
                        icon={<SettingsEthernetOutlined />}
                        className="bg-[#2c3e50] transition-colors duration-300 hover:bg-[#1a2a35] hover:text-gray-600"
                      >
                        {data?.systemApplications?.flatMap((app: any) =>
                          app.microservices.map((ms: any) => (
                            <MenuItem
                              key={ms.uuid}
                              icon={<BuildOutlined />}
                              component={<NavLink to={`/overview/${ms.uuid}`} />}
                              className="bg-[#2c3e50] transition-colors duration-300 hover:bg-[#1a2a35] hover:text-gray-600"
                            >
                              {ms.name}
                            </MenuItem>
                          ))
                        )}
                      </SubMenu>

                      <SubMenu
                        label="Application"
                        icon={<SettingsEthernetOutlined />}
                        className="bg-[#2c3e50] transition-colors duration-300 hover:bg-[#1a2a35] hover:text-gray-600"
                      >
                        {
                          data?.applications?.map((x: any) => (
                            <MenuItem
                              key={x.uuid}
                              icon={<BuildOutlined />}
                              component={<NavLink to={`/overview/${x.uuid}`} />}
                              className="bg-[#2c3e50] transition-colors duration-300 hover:bg-[#1a2a35] hover:text-gray-600"
                            >
                              {x.name}
                            </MenuItem>
                          ))
                        }
                      </SubMenu>

                      <SubMenu
                        label="System Application"
                        icon={<SettingsEthernetOutlined />}
                        className="bg-[#2c3e50] transition-colors duration-300 hover:bg-[#1a2a35] hover:text-gray-600"
                      >
                        {
                          data?.systemApplications?.map((x: any) => (
                            <MenuItem
                              key={x.uuid}
                              icon={<BuildOutlined />}
                              component={<NavLink to={`/overview/${x.uuid}`} />}
                              className="bg-[#2c3e50] transition-colors duration-300 hover:bg-[#1a2a35] hover:text-gray-600"
                            >
                              {x.name}
                            </MenuItem>
                          ))
                        }
                      </SubMenu>

                    </SubMenu>

                    <SubMenu
                      label="Config"
                      icon={<CatalogIcon />}
                      className="bg-[#2c3e50] transition-colors duration-300 hover:bg-[#1a2a35] hover:text-gray-600"
                    >
                      <MenuItem
                        component={<NavLink to="/catalog" />}
                        className="bg-[#2c3e50] transition-colors duration-300 hover:bg-[#1a2a35] hover:text-gray-600"
                      >
                        App Templates
                      </MenuItem>
                      <MenuItem
                        component={<NavLink to="/catalog/microservice" />}
                        className="bg-[#2c3e50] transition-colors duration-300 hover:bg-[#1a2a35] hover:text-gray-600"
                      >
                        Catalog Microservices
                      </MenuItem>
                    </SubMenu>
                    <MenuItem
                      icon={<NetworkCell />}
                      onClick={handleLogout}
                      className="bg-[#2c3e50] transition-colors duration-300 hover:bg-[#1a2a35] hover:text-gray-600"
                    >
                      Network
                    </MenuItem>

                    {keycloak && (
                      <MenuItem
                        icon={<AccountBoxIcon />}
                        onClick={() =>
                          window.open(
                            `${controllerJson?.keycloakURL}admin/${controllerJson?.keycloakRealm}/console`,
                            '_blank'
                          )
                        }
                        className="bg-[#2c3e50] transition-colors duration-300 hover:bg-[#1a2a35] hover:text-gray-600"
                      >
                        IAM
                      </MenuItem>
                    )}
                    <MenuItem
                      icon={<ExitToAppIcon />}
                      onClick={handleLogout}
                      className="bg-[#2c3e50] transition-colors duration-300 hover:bg-[#1a2a35] hover:text-gray-600"
                    >
                      Logout
                    </MenuItem>
                  </Menu>
                </div>

                <div className="flex-shrink-0 p-3">
                  <button
                    className="w-full text-xs bg-gray-700 text-white py-2 rounded hover:bg-gray-600 transition flex items-center justify-center"
                    onClick={() => {
                      setIsPinned(!isPinned);
                      setCollapsed(false);
                    }}
                  >
                    {!collapsed && (
                      <span className="mr-2">{isPinned ? 'Unpin Sidebar' : 'Pin Sidebar'}</span>
                    )}
                    {isPinned ? <ChevronLeftSharp /> : <ChevronRightSharp />}

                  </button>
                </div>
              </Sidebar>
            </div>
          </ProSidebarProvider>


          {/* Content Area */}
          <div className="flex-1 p-6 overflow-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" Component={Dashboard} />
              <Route path="/catalog" Component={Catalog} />
              <Route
                path="/overview"
                element={
                  <div className='max-h-[88vh] min-h-[88vh] overflow-auto'>
                    <MapProvider>
                      <ECNViewer returnHomeCBRef={returnHomeCbRef} />
                    </MapProvider>
                  </div>
                }
              />

              <Route path="/api" Component={SwaggerDoc} />
              <Route Component={() => <Navigate to="/dashboard" />} />
            </Routes>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-xs text-center py-4 border-t border-gray-700 flex justify-between p-4">
          <div className="text-white mb-2">
            Controller v{status?.versions.controller} - ECN Viewer v{status?.versions.ecnViewer}
          </div>
          <div className="flex justify-center space-x-6 mb-2">
            <span className="text-white font-bold"></span>
            <a
              className="text-white font-black"
              href="https://docs.datasance.com"
              target="_blank"
              rel="noreferrer"
            >
              DOCS
            </a>
            <a
              className="text-white font-black"
              href={`/#/api?userToken=${keycloak?.token}&baseUrl=${/^(http:\/\/|https:\/\/)?((\d{1,3}\.){3}\d{1,3}|localhost)(:\d+)?$/.test(window.location.origin)
                ? `${window.location.origin.replace(/(:\d+)?$/, `:${window.controllerConfig?.port}`)}/api/v3`
                : `${window.location.origin}/api/v3`
                }`}
              target="_parent"
            >
              API
            </a>
          </div>
          <a href="https://datasance.com/" className="text-white">
            © {new Date().getFullYear()} Datasance.
          </a>
        </footer>
      </div>
    </HashRouter>
  )
}
