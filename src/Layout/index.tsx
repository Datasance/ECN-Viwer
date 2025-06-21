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
import FileCopyOutlined from '@material-ui/icons/FileCopyOutlined'
import CategoryOutlined from '@material-ui/icons/CategoryOutlined'

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
import Map from '../ECNViewer/Map/Map'
import AppTemplates from '../DatasanceConfig/appTemplates/index'

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
              className="max-h-[93.5vh] min-h-[93.5vh] overflow-y-auto custom-scrollbar"
              onMouseEnter={() => !isPinned && setCollapsed(false)}
              onMouseLeave={() => !isPinned && setCollapsed(true)}
            >
              <Sidebar
                collapsed={collapsed}
                backgroundColor="#2c3e50"
                className="h-full flex flex-col"
                rootStyles={{
                  border: 'none !important',
                }}>
                <div className="flex justify-center py-4">
                  <NavLink to="/dashboard" onClick={returnHome}>
                    <img src={logomark} className="w-9 mt-2" alt="Datasance" />
                  </NavLink>
                </div>

                <div className="flex-grow">
                  <Menu
                    menuItemStyles={{
                      button: ({ active, disabled }) => ({
                        backgroundColor: active ? '#374151' : '#2c3e50',
                        color: disabled ? '#5e5e5e' : active ? '#ffffff' : '#d1d5db',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        '&:hover': {
                          backgroundColor: disabled ? '#2c3e50' : '#1a2633',
                          color: disabled ? '#9ca3af' : '#ffffff',
                        },
                      }),
                      icon: ({ active, disabled }) => ({
                        color: disabled ? '#5e5e5e' : active ? '#ffffff' : '#95a5a6',
                      }),
                      label: ({ active, disabled }) => ({
                        fontWeight: active && !disabled ? 600 : 400,
                      }),
                    }}
                  >
                    <NavLink to="/dashboard">
                      {({ isActive }) => (
                        <MenuItem icon={<DashboardIcon />} active={isActive}>
                          Overview
                        </MenuItem>
                      )}
                    </NavLink>

                    <SubMenu label="Nodes" icon={<StorageRounded />}>
                      <NavLink to="/nodes/list">
                        {({ isActive }) => (
                          <MenuItem icon={<ListAltRounded />} active={isActive}>
                            List
                          </MenuItem>
                        )}
                      </NavLink>
                      <NavLink to="/nodes/Map">
                        {({ isActive }) => (
                          <MenuItem icon={<MapRounded />} active={isActive}>
                            Map
                          </MenuItem>
                        )}
                      </NavLink>
                    </SubMenu>

                    <SubMenu label="Workloads" icon={<LayersRounded />}>
                      <MenuItem icon={<HomeIcon />} disabled>
                        Overview
                      </MenuItem>
                      <NavLink to="/Workloads/MicroservicesList">
                        {({ isActive }) => (
                          <MenuItem icon={<SettingsEthernetOutlined />} active={isActive}>
                            Microservices
                          </MenuItem>
                        )}
                      </NavLink>
                      <NavLink to="/Workloads/SystemMicroservicesList">
                        {({ isActive }) => (
                          <MenuItem icon={<SettingsEthernetOutlined />} active={isActive}>
                            System Microservices
                          </MenuItem>
                        )}
                      </NavLink>
                      <NavLink to="/Workloads/ApplicationList">
                        {({ isActive }) => (
                          <MenuItem icon={<SettingsEthernetOutlined />} active={isActive}>
                            Application
                          </MenuItem>
                        )}
                      </NavLink>
                      <NavLink to="/Workloads/SystemApplicationList">
                        {({ isActive }) => (
                          <MenuItem icon={<SettingsEthernetOutlined />} active={isActive}>
                            System Application
                          </MenuItem>
                        )}
                      </NavLink>
                    </SubMenu>

                    <SubMenu label="Config" icon={<CatalogIcon />}>
                      <NavLink to="/config/AppTemplates">
                        {({ isActive }) => (
                          <MenuItem icon={<FileCopyOutlined />} active={isActive}>
                            App Templates
                          </MenuItem>
                        )}
                      </NavLink>
                      <NavLink to="/config/microservice">
                        {({ isActive }) => (
                          <MenuItem icon={<CategoryOutlined />} active={isActive}>
                            Catalog Microservices
                          </MenuItem>
                        )}
                      </NavLink>
                    </SubMenu>

                    <MenuItem icon={<NetworkCell />} disabled>
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
                      >
                        IAM
                      </MenuItem>
                    )}

                    <MenuItem icon={<ExitToAppIcon />} onClick={handleLogout}>
                      Logout
                    </MenuItem>
                  </Menu>
                </div>

                <div className="sticky flex-shrink-0 p-3 ">
                  <button
                    className="w-full text-xs bg-gray-700 text-white py-2 rounded hover:bg-gray-600 transition flex items-center justify-center"
                    onClick={() => {
                      setIsPinned(!isPinned)
                      setCollapsed(false)
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
          <div className="flex-1 px-5 pt-6 overflow-auto bg-gray-900">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" Component={Dashboard} />
              <Route path="/config/AppTemplates" Component={AppTemplates} />
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
              <Route path="/nodes/Map" element={<Map collapsed={collapsed} />} />
              <Route Component={() => <Navigate to="/dashboard" />} />
            </Routes>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-xs text-center border-t border-gray-700 flex justify-between p-3 bg-gray-900">
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
