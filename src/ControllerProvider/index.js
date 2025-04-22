import React from 'react'
import { useAuth } from '../auth'

const controllerJson = window.controllerConfig
const IPLookUp = 'http://ip-api.com/json/'

// If dev mode, use proxy
// Otherwise assume you are running on the Controller
const getBaseUrl = () => controllerJson.url || `${window.location.protocol}//${[window.location.hostname, controllerJson.port].join(':')}`
const getUrl = (path) => controllerJson.dev ? `/api/controllerApi${path}` : `${getBaseUrl()}${path}`
const getHeaders = (headers) => {
  if (controllerJson.dev) {
    return {
      ...headers,
      'ECN-Api-Destination': controllerJson.dev ? `http://${controllerJson.ip}:${controllerJson.port}/` : ''
    }
  }
  return headers
}

export const ControllerContext = React.createContext()
export const useController = () => React.useContext(ControllerContext)

const initState = {
  user: null,
  status: null,
  refresh: null
}

const reducer = (state, action) => {
  switch (action.type) {
    case 'UPDATE':
      return { ...state, ...action.data }
    default:
      return state
  }
}

const lookUpControllerInfo = async (ip) => {
  if (!ip) {
    ip = window.location.host.split(':')[0] // Get only ip, not port
  }
  const localhost = /(0\.0\.0\.0|localhost|127\.0\.0\.1|192\.168\.)/
  const lookupIP = localhost.test(ip) ? '8.8.8.8' : ip.slice(-1) === '/' ? ip.substring(0, ip.length - 1) : ip
  const response = await window.fetch(IPLookUp + lookupIP.replace('http://', '').replace('https://', ''))
  if (response.ok) {
    return response.json()
  } else {
    throw new Error(response.statusText)
  }
}

const getControllerStatus = async (api) => {
  const response = await window.fetch(getUrl('/api/v3/status'), {
    headers: getHeaders({})
  })
  if (response.ok) {
    return response.json()
  } else {
    console.log('Controller status unreachable', { status: response.statusText })
  }
}

export const ControllerProvider = ({ children }) => {
  const [state, dispatch] = React.useReducer(reducer, initState)
  const { token } = useAuth()

  const updateController = (data) => {
    dispatch({ type: 'UPDATE', data })
  }

  const request = async (path, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    }

    // Add Authorization header with token from auth
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    // console.log('Request headers:', headers) // Debug log

    const response = await fetch(getUrl(path), {
      ...options,
      headers
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response
  }

  React.useEffect(() => {
    // Grab controller location informations
    const effect = async () => {
      let ipInfo = {}
      try {
        ipInfo = await lookUpControllerInfo(controllerJson.ip)
      } catch (e) {
        ipInfo = {
          lat: '40.935',
          lon: '28.97',
          query: controllerJson.ip
        }
      }
      dispatch({ type: 'UPDATE', data: { location: ipInfo } })
    }
    effect()
  }, [])

  React.useEffect(() => {
    const effect = async () => {
      // Everytime user is updated, try to grab status
      const status = await getControllerStatus()
      dispatch({ type: 'UPDATE', data: { status } })
    }
    effect()
  }, [state.user])

  return (
    <ControllerContext.Provider
      value={{
        ...state,
        updateController,
        request
      }}
    >
      {children}
    </ControllerContext.Provider>
  )
}
