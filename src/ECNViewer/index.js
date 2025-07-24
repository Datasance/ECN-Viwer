/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react'
import { isFinite, uniqBy } from 'lodash'

import Map from './Map'
import Default from './Default'
import AgentDetails from './AgentDetails'
import ApplicationDetails from './ApplicationDetails'
import MicroserviceDetails from './MicroserviceDetails'
import Navigation from './Navigation'
import useMediaQuery from '@material-ui/core/useMediaQuery'

// import logo from '../assets/logo.png'
import './layout.scss'

import { useMap } from '../providers/Map'
import { useData } from '../providers/Data'
import { useConfig } from '../providers/Config'
import { ControllerContext } from '../ControllerProvider'

const views = {
  DEFAULT: 1,
  AGENT_DETAILS: 2,
  APPLICATION_DETAILS: 3,
  MICROSERVICE_DETAILS: 4
}

export default function ECNViewer ({ returnHomeCBRef }) {
  const { data, loading } = useData()
  const { config } = useConfig()
  const { location: _location } = React.useContext(ControllerContext)
  const { setMap, map, restoreMapToState } = useMap()
  const [selectedElement, selectElement] = React.useState(null)
  const [history, setHistory] = React.useState([])
  const [view, setView] = React.useState(views.DEFAULT)
  const showMap = useMediaQuery('(min-width:992px)') // Bootstrap4 lg
  const location = _location;

  const saveHistory = () => {
    setHistory(h => [...h, { view, selectedElement, map }])
  }

  const selectAgent = (a) => {
    const copy = { ...a }
    saveHistory()
    selectElement(copy)
    if (isFinite(a.latitude) && isFinite(a.longitude)) {
      setMap([copy], { location }, false)
    }
    setView(views.AGENT_DETAILS)
  }

  const selectApplication = (a) => {
    const copy = { ...a }
    saveHistory()
    selectElement(copy)
    setMap(uniqBy(a.microservices.map(m => data.reducedAgents.byUUID[m.iofogUuid]), a => a.uuid), null, false)
    setView(views.APPLICATION_DETAILS)
  }

  const selectMicroservice = (a) => {
    const copy = { ...a }
    saveHistory()
    selectElement(copy)
    setMap([data.reducedAgents.byUUID[a.iofogUuid]], null, false)
    setView(views.MICROSERVICE_DETAILS)
  }

  const seeAllECN = () => {
    selectElement({})
    setView(views.DEFAULT)
    selectController()
    setHistory([])
  }

  React.useEffect(() => {
    returnHomeCBRef.current = seeAllECN
    return () => { returnHomeCBRef.current = null }
  }, [seeAllECN])

  const back = () => {
    if (history.length) {
      const previousState = history[history.length - 1]
      setView(previousState.view)
      selectElement(previousState.selectedElement)
      restoreMapToState(previousState.map)
      setHistory(h => {
        h.pop()
        return h
      })
    } else {
      seeAllECN()
    }
  }

  React.useEffect(() => {
    if (!loading) {
      setMap(data.activeAgents, { location }, true)
    }
  }, [loading])

  const selectController = () => {
    setMap(data.activeAgents, { location }, true)
  }

  const setAutozoom = () => {
    setMap(data.controller.agents, { location }, true)
  }

  const _getView = (view) => {
    switch (view) {
      case views.AGENT_DETAILS:
        return (
          <AgentDetails
            {
              ...{
                agent: selectedElement,
                selectApplication,
                selectMicroservice,
                back
              }
            }
          />
        )
      case views.APPLICATION_DETAILS:
        return (
          <ApplicationDetails
            {
              ...{
                application: selectedElement,
                selectMicroservice,
                selectAgent,
                back
              }
            }
          />
        )
      case views.MICROSERVICE_DETAILS:
        return (
          <MicroserviceDetails
            {
              ...{
                microservice: selectedElement,
                selectApplication,
                selectAgent,
                back
              }
            }
          />
        )
      case views.DEFAULT:
      default:
        return (
          <Default {
            ...{
              setAutozoom,
              selectController,
              selectAgent,
              selectApplication,
              selectedElement,
              setView,
              views
            }
          }
          />)
    }
  }

  const { controller, msvcsPerAgent } = data
  console.log({ location, controller, config })
  return (
    <div className='viewer-layout-container'>
      <div className='box sidebar'>
        <Navigation {...{ view, selectedElement, views, back }} />
        {_getView(view)}
      </div>
      {showMap && (
        <div className='map-grid-container'>
          <Map {...{ controller: { ...controller, info: { location } }, agent: selectedElement, setAgent: selectAgent, msvcsPerAgent, loading }} />
          <div className='map-overlay' />
        </div>
      )}
    </div>
  )
}
