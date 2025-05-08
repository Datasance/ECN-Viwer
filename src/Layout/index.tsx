import React from 'react'
import { HashRouter, Route, NavLink, useLocation, Routes, Navigate } from 'react-router-dom'
import HomeIcon from '@material-ui/icons/HomeOutlined'
import CatalogIcon from '@material-ui/icons/GraphicEqOutlined'
import ExitToAppIcon from '@material-ui/icons/ExitToApp'
import AccountBoxIcon from '@material-ui/icons/AccountBox'
import DashboardIcon from '@material-ui/icons/Dashboard'
import ChevronLeftSharp from '@material-ui/icons/ChevronLeftSharp';
import ChevronRightSharp from '@material-ui/icons/ChevronRightSharp';
import SettingsEthernetOutlined from '@material-ui/icons/SettingsEthernetOutlined'
import NetworkCell from '@material-ui/icons/NetworkCell'
import StorageRounded from '@material-ui/icons/StorageRounded'
import ListAltRounded from '@material-ui/icons/ListAltRounded'
import MapRounded from '@material-ui/icons/MapRounded'
import LayersRounded from '@material-ui/icons/LayersRounded'

import { MapProvider } from '../providers/Map'
import { useData } from '../providers/Data'
import { useController } from '../ControllerProvider'
import { useKeycloak } from '@react-keycloak/web'

import ECNViewer from '../ECNViewer'
import Catalog from '../Catalog'
import Dashboard from '../Dashboard'
import SwaggerDoc from '../swagger/SwaggerDoc'
import logomark from '../assets/potLogoWithWhiteText.svg'

import { Sidebar, Menu, MenuItem, SubMenu } from 'react-pro-sidebar';
import { ProSidebarProvider } from 'react-pro-sidebar';
import NodesList from '../Nodes/List'
import MicroservicesList from '../Workloads/Microservices'
import SystemMicroservicesList from '../Workloads/SystemMicroservices'
import ApplicationList from '../Workloads/Applications'
import SystemApplicationList from '../Workloads/SystemApplications'

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
                    <MenuItem icon={<DashboardIcon />}>
                      <NavLink
                        to="/dashboard"
                        className={({ isActive }) =>
                          `w-full h-full block ${isActive ? "bg-gray-700 text-white" : ""}`
                        }
                      >
                        Overview
                      </NavLink>
                    </MenuItem>

                    <SubMenu
                      label="Nodes"
                      icon={<StorageRounded />}
                      className="bg-[#2c3e50] transition-colors duration-300 hover:bg-[#1a2a35] hover:text-gray-600"
                    >
                      <MenuItem
                        icon={<ListAltRounded />}
                        className="bg-[#2c3e50] transition-colors duration-300 hover:bg-[#1a2a35] hover:text-gray-600"
                      >
                        <NavLink
                          to="/nodes/list"
                          className={({ isActive }) =>
                            `w-full h-full block ${isActive ? "bg-gray-700 text-white" : ""}`
                          }
                        >
                          List
                        </NavLink>
                      </MenuItem>
                      <MenuItem
                        icon={<MapRounded />}
                        className="bg-[#2c3e50] transition-colors duration-300 hover:bg-[#1a2a35] hover:text-gray-600"
                      >
                        <NavLink
                          to="/overview"
                          className={({ isActive }) =>
                            `w-full h-full block ${isActive ? "bg-gray-700 text-white" : ""}`
                          }
                        >
                          Map
                        </NavLink>
                      </MenuItem>
                    </SubMenu>

                    <SubMenu
                      label="Workloads"
                      icon={<LayersRounded />}
                      className="bg-[#2c3e50] transition-colors duration-300 hover:bg-[#1a2a35] hover:text-gray-600"
                    >
                      <MenuItem
                        icon={<HomeIcon />}
                        className="bg-[#2c3e50] transition-colors duration-300 hover:bg-[#1a2a35] hover:text-gray-600"
                        disabled
                      >
                        Overview
                      </MenuItem>
                      <MenuItem
                        icon={<SettingsEthernetOutlined />}
                        className="bg-[#2c3e50] transition-colors duration-300 hover:bg-[#1a2a35] hover:text-gray-600"
                      >
                        <NavLink
                          to="/Workloads/MicroservicesList"
                          className={({ isActive }) =>
                            `w-full h-full block ${isActive ? "bg-gray-700 text-white" : ""}`
                          }
                        >
                          Microservices
                        </NavLink>
                      </MenuItem>
                      <MenuItem
                        icon={<SettingsEthernetOutlined />}
                        className="bg-[#2c3e50] transition-colors duration-300 hover:bg-[#1a2a35] hover:text-gray-600"
                      >
                        <NavLink
                          to="/Workloads/SystemMicroservicesList"
                          className={({ isActive }) =>
                            `w-full h-full block ${isActive ? "bg-gray-700 text-white" : ""}`
                          }
                        >
                          System Microservices
                        </NavLink>
                      </MenuItem>
                      <MenuItem
                        icon={<SettingsEthernetOutlined />}
                        className="bg-[#2c3e50] transition-colors duration-300 hover:bg-[#1a2a35] hover:text-gray-600"
                      >
                        <NavLink
                          to="/Workloads/ApplicationList"
                          className={({ isActive }) =>
                            `w-full h-full block ${isActive ? "bg-gray-700 text-white" : ""}`
                          }
                        >
                          Application
                        </NavLink>
                      </MenuItem>
                      <MenuItem
                        icon={<SettingsEthernetOutlined />}
                        className="bg-[#2c3e50] transition-colors duration-300 hover:bg-[#1a2a35] hover:text-gray-600"
                      >
                        <NavLink
                          to="/Workloads/SystemApplicationList"
                          className={({ isActive }) =>
                            `w-full h-full block ${isActive ? "bg-gray-700 text-white" : ""}`
                          }
                        >
                          System Application
                        </NavLink>
                      </MenuItem>
                    </SubMenu>

                    <SubMenu
                      label="Config"
                      icon={<CatalogIcon />}
                      className="bg-[#2c3e50] transition-colors duration-300 hover:bg-[#1a2a35] hover:text-gray-600"
                    >
                      <MenuItem
                        className="bg-[#2c3e50] transition-colors duration-300 hover:bg-[#1a2a35] hover:text-gray-600"
                      >
                        <NavLink
                          to="/catalog"
                          className={({ isActive }) =>
                            `w-full h-full block ${isActive ? "bg-gray-700 text-white" : ""}`
                          }
                        >
                          App Templates
                        </NavLink>
                      </MenuItem>
                      <MenuItem
                        className="bg-[#2c3e50] transition-colors duration-300 hover:bg-[#1a2a35] hover:text-gray-600"
                      >
                        <NavLink
                          to="/catalog/microservice"
                          className={({ isActive }) =>
                            `w-full h-full block ${isActive ? "bg-gray-700 text-white" : ""}`
                          }
                        >
                          Catalog Microservices
                        </NavLink>
                      </MenuItem>
                    </SubMenu>

                    <MenuItem
                      icon={<NetworkCell />}
                      onClick={handleLogout}
                      className="bg-[#2c3e50] transition-colors duration-300 hover:bg-[#1a2a35] hover:text-gray-600"
                      disabled
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
          <div className="flex-1 px-5 pt-6 overflow-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" Component={Dashboard} />
              <Route path="/catalog" Component={Catalog} />
              <Route
                path="/overview"
                element={
                  <div className='max-h-[90.8vh] min-h-[90.8vh] overflow-auto'>
                    <MapProvider>
                      <ECNViewer returnHomeCBRef={returnHomeCbRef} />
                    </MapProvider>
                  </div>
                }
              />

              <Route path="/api" Component={SwaggerDoc} />
              <Route path="/nodes/list" Component={NodesList} />
              <Route path="/Workloads/MicroservicesList" Component={MicroservicesList} />
              <Route path="/Workloads/SystemMicroservicesList" Component={SystemMicroservicesList} />
              <Route path="/Workloads/ApplicationList" Component={ApplicationList} />
              <Route path="/Workloads/SystemApplicationList" Component={SystemApplicationList} />
              <Route Component={() => <Navigate to="/dashboard" />} />
            </Routes>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-xs text-center border-t border-gray-700 flex justify-between p-3">
          <div className="text-white">
            <p>
              Controller v{status?.versions.controller}
            </p>
            <p>
              ECN Viewer v{status?.versions.ecnViewer}
            </p>
          </div>
          <div className="flex justify-center space-x-6">
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
