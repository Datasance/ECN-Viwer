import { get as lget, set as lset } from 'lodash'
import React from 'react'
import { useController } from '../../ControllerProvider'
import { theme } from '../../Theme/ThemeProvider'

export const ConfigContext = React.createContext()
export const useConfig = () => React.useContext(ConfigContext)

const _initConfig = {
  tags: {},
  controllerLocationInfo: {
    lat: '40.935',
    lon: '28.97',
    query: ''
  }
}

const defaultTagColor = theme.colors.cobalt

const ecnViewerConfigKey = 'ecn-viewer-config'

export const ConfigProvider = ({
  children
}) => {
  const { request, location } = useController()
  const [config, setConfig] = React.useState({ ..._initConfig, controllerLocation: location })

  const _fetchConfig = async () => {
    try {
      const res = await request(`/api/v1/config/${ecnViewerConfigKey}`)
      if (res.ok) {
        const { value: stringifiedConfig } = await res.json()
        setConfig(JSON.parse(stringifiedConfig))
      }
    } catch (e) {

    }
  }

  const saveConfig = async (newConfig) => {
    const res = await request('/api/v1/config', {
      method: 'PUT',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        key: ecnViewerConfigKey,
        value: JSON.stringify(newConfig)
      })
    })
    if (res.ok) {
      setConfig(newConfig)
    }
    return res
  }

  const getTagDisplayInfo = value => {
    return { ...lget(config, `tags['${value}']`, { color: defaultTagColor }), value }
  }

  const updateTags = (agents = []) => {
    let updated = false
    for (const agent of agents) {
      if (agent.tags) {
        for (const tag of agent.tags) {
          if (!lget(config, `tags['${tag}']`)) {
            updated = true
            lset(config, `tags['${tag}']`, { icon: '', color: defaultTagColor })
          }
        }
      }
    }
    if (updated) {
      setConfig(config)
    }
  }

  React.useEffect(() => {
    //_fetchConfig()
  }, [])

  const isDebug = window.location.search.includes('debug=true')
  return (
    <ConfigContext.Provider
      value={{
        isDebug,
        editConfig: setConfig,
        updateTags,
        getTagDisplayInfo,
        saveConfig,
        config
      }}
    >
      {children}
    </ConfigContext.Provider>
  )
}
