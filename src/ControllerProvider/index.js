import { useKeycloak } from '@react-keycloak/web'
import React from 'react'

const controllerJson = window.controllerConfig

const initControllerState = (() => {
  const localUser = window.localStorage.getItem('iofogUser')
  if ((!controllerJson.user || !controllerJson.user.email) && localUser) {
    controllerJson.user = JSON.parse(localUser)
  }
  return {
    ...controllerJson,
    api: `${window.location.protocol}//${controllerJson.ip}:${controllerJson.port || 80}/`,
    location: {
      lat: 'Unknown',
      lon: 'Unknown',
      query: controllerJson.ip
    },
    status: {
      versions: {
        controller: '',
        ecnViewer: ''
      }
    }
  }
})()

const IPLookUp = 'http://ip-api.com/json/'

// If dev mode, use proxy
// Otherwise assume you are running on the Controller
const getBaseUrl = () => controllerJson.url || `${window.location.protocol}//${[window.location.hostname, controllerJson.port].join(':')}`;
const getUrl = (path) => controllerJson.dev ? `/api/controllerApi${path}` : `${getBaseUrl()}${path}`;
const getHeaders = (headers) => controllerJson.dev
  ? ({
    ...headers,
    'ECN-Api-Destination': controllerJson.dev ? `http://${controllerJson.ip}:${controllerJson.port}/` : ''
  }) : headers

export const ControllerContext = React.createContext({
  controller: {
    status: {}
  },
  updateController: () => {}
})

export const useController = () => React.useContext(ControllerContext)

const lookUpControllerInfo = async (ip) => {
  if (!ip) {
    ip = window.location.host.split(':')[0] // Get only ip, not port
  }
  const localhost = new RegExp('(0\.0\.0\.0|localhost|127\.0\.0\.1|192\.168\.)') // eslint-disable-line no-useless-escape
  const lookupIP = localhost.test(ip) ? '8.8.8.8' : ip
  const response = await window.fetch(IPLookUp + lookupIP)
  if (response.ok) {
    return response.json()
  } else {
    throw new Error(response.statusText)
  }
}

const getControllerStatus = async (api) => {
  const response = await await window.fetch(getUrl('/api/v1/status'), {
    headers: getHeaders({})
  })
  if (response.ok) {
    return response.json()
  } else {
    console.log('Controller status unreachable', { status: response.statusText })
  }
}

export default function Context (props) {
  // const [token, setToken] = React.useState(null)
  const tokenRef = React.useRef(null)
  const [controllerUser, setControllerUser] = React.useState(initControllerState.user)
  const [controllerLocation, setControllerLocation] = React.useState(initControllerState.location)
  const [controllerStatus, setControllerStatus] = React.useState(initControllerState.status)
  const [error, setError] = React.useState(null)
  const [refresh, setRefresh] = React.useState(window.localStorage.getItem('iofogRefresh') || 3000)
  const { initialized, keycloak } = useKeycloak()
  const setToken = (newToken) => {
    tokenRef.current = newToken
  }
  React.useEffect(() => {
    // Grab controller location informations
    const effect = async () => {
      let ipInfo = {}
      try {
        ipInfo = await lookUpControllerInfo(controllerJson.ip)
      } catch (e) {
        ipInfo = {
          lat: 'Unknown',
          lon: 'Unknown',
          query: controllerJson.ip
        }
      }
      setControllerLocation(ipInfo)
    }
    effect()
  }, [])

  React.useEffect(() => {
    const effect = async () => {
      // Everytime user is updated, try to grab status
      const status = await getControllerStatus()
      setControllerStatus(status)
    }
    effect()
  }, [controllerUser])

  // const authenticate = async (user) => {
  //   const response = await window.fetch(getUrl('/api/v1/user/login'), {
  //     method: 'POST',
  //     headers: getHeaders({
  //       Accept: 'application/json',
  //       'Content-Type': 'application/json'
  //     }),
  //     body: JSON.stringify(user || controllerUser)
  //   })
  //   if (response.ok) {
  //     const token = (await response.json()).accessToken
  //     setToken(token)
  //     setError(null)
  //     return token
  //   } else {
  //     setToken(null)
  //     throw new Error(response.statusText)
  //   }
  // }

  // Wrapper around window.fetch to add proxy and authorization headers
  const request = React.useMemo(() => async (path, options = {}) => {
    try {
      let t = `${'Bearer '}${keycloak?.token}`
      if (options.body && typeof options.body === typeof {}) {
        options.body = JSON.stringify(options.body)
        options.headers = {
          ...options.headers,
          'Content-Type': 'application/json'
        }
      }
      const response = await window.fetch(getUrl(path), {
        ...options,
        headers: getHeaders({
          ...options.headers,
          Authorization: t
        })
      })
      if (error) {
        setError(null)
      }
      return response
    } catch (err) {
      setError(err)
      return ({
        ok: false,
        statusText: err.message || 'Could not reach controller'
      })
    }
  }, [tokenRef.current, error])

  const updateController = async ({ user, refresh }) => {
    window.localStorage.setItem('iofogUser', JSON.stringify(user))
    window.localStorage.setItem('iofogRefresh', refresh)
    setControllerUser(user)
    setRefresh(refresh)
    try {
      keycloak.login()
    } catch (e) {
      setError(e)
      throw e
    }
  }

  return (
    <ControllerContext.Provider value={{
      refresh,
      location: controllerLocation,
      status: controllerStatus,
      user: controllerUser,
      error,
      updateController,
      request
    }}
    >
      {props.children}
    </ControllerContext.Provider>
  )
}
