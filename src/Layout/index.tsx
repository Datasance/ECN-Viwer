import React from 'react'
import { HashRouter, Route, NavLink, useLocation, Routes, Navigate } from 'react-router-dom'
import MiscellaneousServicesIcon from '@material-ui/icons/Settings'
import ExitToAppIcon from '@material-ui/icons/ExitToApp'
import AccountBoxIcon from '@material-ui/icons/AccountBox'
import DashboardIcon from '@material-ui/icons/Dashboard'
import ChevronLeftSharp from '@material-ui/icons/ChevronLeftSharp';
import ChevronRightSharp from '@material-ui/icons/ChevronRightSharp';
import Hub from '@material-ui/icons/DeviceHubRounded'
import StorageRounded from '@material-ui/icons/StorageRounded'
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
import AppTemplates from '../DatasanceConfig/appTemplates/index'
import CatalogMicroservices from '../DatasanceConfig/catalogMicroservices'
import ConfigMaps from '../DatasanceConfig/configMaps'
import VolumeMounts from '../DatasanceConfig/volumeMounts'
import SecretsMicroservices from '../DatasanceConfig/secret'
import Certificates from '../DatasanceConfig/certificates'
import Services from '../DatasanceConfig/services'
import Map from '../ECNViewer/Map/Map'

const controllerJson = window.controllerConfig || null

function RouteWatcher() {
  const { refreshData } = useData()
  const location = useLocation()

  React.useEffect(() => {
    if (location.pathname === '/overview' || location.pathname === '/dashboard') {
      console.log('Refreshing data')
      refreshData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
              className="h-screen overflow-y-auto custom-scrollbar"
              onMouseEnter={() => !isPinned && setCollapsed(false)}
              onMouseLeave={() => !isPinned && setCollapsed(true)}
            >
              <Sidebar
                collapsed={collapsed}
                backgroundColor="#111827"
                className="h-full flex flex-col border-r border-gray-500"
              >
                <div className="flex justify-center py-4">
                  <NavLink to="/dashboard" onClick={returnHome}>
                    <img src={logomark} className="w-7 mt-2" alt="Datasance" />
                  </NavLink>
                </div>

                <div className="overflow-y-auto h-[calc(100vh-265px)] border-t border-gray-500">
                  <Menu
                    menuItemStyles={{
                      button: ({ active, disabled }) => ({
                        backgroundColor: active ? '#374151' : '#111827',
                        color: disabled ? '#5e5e5e' : active ? '#ffffff' : '#d1d5db',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        '&:hover': {
                          backgroundColor: disabled ? '#111827' : '#1a2633',
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
                          <MenuItem active={isActive}>
                            List
                          </MenuItem>
                        )}
                      </NavLink>
                      <NavLink to="/nodes/Map">
                        {({ isActive }) => (
                          <MenuItem active={isActive}>
                            Map
                          </MenuItem>
                        )}
                      </NavLink>
                    </SubMenu>

                    <SubMenu label="Workloads" icon={<LayersRounded />}>
                      <NavLink to="/Workloads/MicroservicesList">
                        {({ isActive }) => (
                          <MenuItem active={isActive}>
                            Microservices
                          </MenuItem>
                        )}
                      </NavLink>
                      <NavLink to="/Workloads/SystemMicroservicesList">
                        {({ isActive }) => (
                          <MenuItem active={isActive}>
                            System Microservices
                          </MenuItem>
                        )}
                      </NavLink>
                      <NavLink to="/Workloads/ApplicationList">
                        {({ isActive }) => (
                          <MenuItem active={isActive}>
                            Application
                          </MenuItem>
                        )}
                      </NavLink>
                      <NavLink to="/Workloads/SystemApplicationList">
                        {({ isActive }) => (
                          <MenuItem active={isActive}>
                            System Application
                          </MenuItem>
                        )}
                      </NavLink>
                    </SubMenu>

                    <SubMenu label="Config" icon={<MiscellaneousServicesIcon />}>
                      <NavLink to="/config/AppTemplates">
                        {({ isActive }) => (
                          <MenuItem active={isActive}>
                            App Templates
                          </MenuItem>
                        )}
                      </NavLink>
                      <NavLink to="/config/CatalogMicroservices">
                        {({ isActive }) => (
                          <MenuItem active={isActive}>
                            Catalog Microservices
                          </MenuItem>
                        )}
                      </NavLink>
                      <NavLink to="/config/ConfigMaps">
                        {({ isActive }) => (
                          <MenuItem active={isActive}>
                            Config Maps
                          </MenuItem>
                        )}
                      </NavLink>
                      <NavLink to="/config/secret">
                        {({ isActive }) => (
                          <MenuItem active={isActive}>
                            Secrets
                          </MenuItem>
                        )}
                      </NavLink>
                      <NavLink to="/config/VolumeMounts">
                        {({ isActive }) => (
                          <MenuItem active={isActive}>
                            Volume Mounts
                          </MenuItem>
                        )}
                      </NavLink>
                      <NavLink to="/config/certificates">
                        {({ isActive }) => (
                          <MenuItem active={isActive}>
                            Certificates
                          </MenuItem>
                        )}
                      </NavLink>
                    </SubMenu>

                    <SubMenu label="Network" icon={<Hub />}>
                      <NavLink to="/config/services">
                        {({ isActive }) => (
                          <MenuItem active={isActive}>
                            Services
                          </MenuItem>
                        )}
                      </NavLink>
                    </SubMenu>


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

                {/* ALT: Pin button + versiyon bilgisi + footer */}
                <div className="flex flex-col gap-3 px-3 py-4 border-t border-gray-500">
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

                  {
                    !collapsed ?
                      <>
                        <div className="flex justify-center items-center text-white text-xs space-x-8">
                          <a className="font-bold underline underline-offset-2" href="https://docs.datasance.com" target="_blank" rel="noreferrer">
                            DOCS
                          </a>
                          <a className="font-bold underline underline-offset-2" href="https://github.com/Datasance" target="_blank" rel="noreferrer">
                            GitHub
                          </a>
                          <a
                            className="font-bold underline underline-offset-2"
                            href={`/#/api?authToken=${keycloak?.token}&baseUrl=${window.controllerConfig?.url === undefined
                              ? `${window.location.protocol}//${window.location.hostname}:${window?.controllerConfig?.port}/api/v3`
                              : `${window.location.origin}/api/v3`
                              }`}
                            target="_parent"
                          >
                            API
                          </a>
                          <a className="font-bold underline underline-offset-2" href="https://datasance.com/EULA.pdf" target="_blank" rel="noreferrer">
                            EULA
                          </a>
                        </div>
                        <div className="text-white text-xs text-center">
                          <p>Controller v{status?.versions.controller}</p>
                          <p>ECN Viewer v{status?.versions.ecnViewer}</p>
                        </div>
                      </> : null
                  }
                  <a href="https://datasance.com/" className="text-white text-xs text-center">
                    © {new Date().getFullYear()} Datasance
                  </a>

                </div>
              </Sidebar>




            </div>
          </ProSidebarProvider>


          {/* Content Area */}
          <div className="flex-1 px-5 pt-6 overflow-auto bg-gray-900 h-screen overflow-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" Component={Dashboard} />
              <Route path="/catalog" Component={Catalog} />
              <Route
                path="/overview"
                element={
                  <div className=' overflow-auto'>
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
              <Route path="/config/AppTemplates" Component={AppTemplates} />
              <Route path="/config/CatalogMicroservices" Component={CatalogMicroservices} />
              <Route path="/config/ConfigMaps" Component={ConfigMaps} />
              <Route path="/config/secret" Component={SecretsMicroservices} />
              <Route path="/config/VolumeMounts" Component={VolumeMounts} />
              <Route path="/config/certificates" Component={Certificates} />
              <Route path="/config/services" Component={Services} />
              <Route Component={() => <Navigate to="/dashboard" />} />
            </Routes>
          </div>
        </div>

        {/* Footer */}
        {/* <footer className="text-xs text-center border-t border-gray-700 flex justify-between p-3 bg-gray-900">
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
              href={`/#/api?authToken=${keycloak?.token}&baseUrl=${/^(http:\/\/|https:\/\/)?((\d{1,3}\.){3}\d{1,3}|localhost)(:\d+)?$/.test(window.location.origin)
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
        </footer> */}
      </div>
    </HashRouter>
  )
}
