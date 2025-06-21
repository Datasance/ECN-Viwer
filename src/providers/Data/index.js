import React from 'react'
import { useController } from '../../ControllerProvider'
import { find, groupBy, get } from 'lodash'
import useRecursiveTimeout from '../../hooks/useInterval'
import { useAuth } from '../../auth'

import AgentManager from './agent-manager'
import ApplicationManager from './application-manager'

export const DataContext = React.createContext()
export const useData = () => React.useContext(DataContext)

const initState = {
  controller: {
    info: {
      location: {},
      user: {}
    },
    agents: [],
    flows: [],
    microservices: [],
    applications: []
  },
  activeAgents: [],
  activeMsvcs: [],
  msvcsPerAgent: [],
  applications: [],
  systemApplications: []
}

export const actions = {
  UPDATE: 'UPDATE',
  SET_AGENT: 'SET_AGENT'
}

const updateData = (state, newController) => {
  if (!newController) {
    return state
  }
  // newController.agents = newController.agents.map(a => ({
  //   ...a,
  //   edgeResources: [...a.edgeResources, ...a.edgeResources, ...a.edgeResources, ...a.edgeResources, ...a.edgeResources]
  // }))
  newController.agents.sort((a, b) => {
    const statusOrder = {
      RUNNING: 1,
      UNKOWN: 2
    }
    if (a.daemonStatus === b.daemonStatus) {
      return a.name.localeCompare(b.name)
    } else {
      return (statusOrder[a.daemonStatus] || 3) - (statusOrder[b.daemonStatus] || 3)
    }
  })
  newController.applications.sort((a, b) => {
    if (a.isActivated === b.isActivated) { return a.name.localeCompare(b.name) }
    return (a.isActivated ? 1 : 2) - (b.isActivated ? 1 : 2)
  })
  const reducedAgents = newController.agents.reduce((acc, a) => {
    acc.byUUID[a.uuid] = a
    acc.byName[a.name] = a
    return acc
  }, {
    byUUID: {},
    byName: {}
  })

  let mergedApplications = [...newController.applications, ...newController?.systemApplications];
  const reducedApplications = mergedApplications.reduce((acc, a) => {
    acc.byId[a.id] = a
    acc.byName[a.name] = a
    return acc
  }, {
    byId: {},
    byName: {}
  })
  const activeFlows = newController.applications.filter(f => f.isActivated === true)
  const activeAgents = newController.agents.filter(a => a.daemonStatus === 'RUNNING')
  const msvcsPerAgent = groupBy(newController.microservices.map(m => ({
    ...m,
    flowActive: !!find(activeFlows, f => m.flowId === f.id)
  })), 'iofogUuid')
  const activeMsvcs = activeAgents.reduce((res, a) => res.concat(get(msvcsPerAgent, a.uuid, []).filter(m => !!find(activeFlows, f => f.id === m.flowId)) || []), [])

  if (!state.agent || !state.agent.uuid) {
    state.agent = newController.agents[0] || {}
  }
  
  const systemApplications = newController?.systemApplications

  return {
    ...state,
    controller: newController,
    applications: newController.applications,
    activeFlows,
    activeAgents,
    activeMsvcs,
    msvcsPerAgent,
    reducedAgents,
    reducedApplications,
    systemApplications
  }
}

const reducer = (state, action) => {
  switch (action.type) {
    case actions.UPDATE:
      return updateData(state, action.data)
    default:
      return state
  }
}

export const DataProvider = ({
  children
}) => {
  const { request, refresh } = useController()
  const [state, dispatch] = React.useReducer(reducer, initState)
  const [loading, setLoading] = React.useState(true)
  const timeout = +refresh || 3000
  const [error, setError] = React.useState(false)
  const { keycloak, initialized } = useAuth()

  const update = async () => {
    // Only update if we're initialized or not using auth
    if (!keycloak || initialized) {
      // List fogs
      let agents = []
      try {
        agents = await AgentManager.listAgents(request)()
      } catch (e) {
        setError(e)
        return
      }

      // List applications
      let applications = []
      try {
        applications = await ApplicationManager.listApplications(request)()
      } catch (e) {
        setError(e)
        return
      }

      let systemApplications = []
      try {
        systemApplications = await ApplicationManager.listSystemApplications(request)()
      } catch (e) {
        setError(e)
        return
      }

      let microservices = []
      for (const application of applications) {
        // We need this to get microservice details like Status
        const microservicesResponse = await request(`/api/v3/microservices?application=${application.name}`)
        if (!microservicesResponse?.ok) {
          setError({ message: microservicesResponse.statusText })
          return
        }
        const newMicroservices = (await microservicesResponse.json()).microservices
        microservices = microservices.concat(newMicroservices)
        application.microservices = newMicroservices
      }
      if (error) {
        setError(false)
      }
      dispatch({ type: actions.UPDATE, data: { agents, applications, microservices, systemApplications } })
      if (loading) {
        setLoading(false)
      }
    }
  }

  useRecursiveTimeout(update, timeout)

  return (
    <DataContext.Provider
      value={{
        data: state,
        error,
        loading,
        refreshData: update,
        deleteAgent: AgentManager.deleteAgent(request),
        deleteApplication: ApplicationManager.deleteApplication(request),
        toggleApplication: ApplicationManager.toggleApplication(request)
      }}
    >
      {children}
    </DataContext.Provider>
  )
}
