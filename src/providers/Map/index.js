import React from 'react'
import { isFinite, get } from 'lodash'
import { fitBounds } from 'google-map-react/utils'

import mapStyle from './mapStyle.json'

export const MapContext = React.createContext()
export const useMap = () => React.useContext(MapContext)

const hasValidCoordinates = (coordinates) => {
  return isFinite(coordinates[0]) && isFinite(coordinates[1])
}

export const MapProvider = ({
  children
}) => {
  const mapRef = React.useRef()
  const [map, _setMap] = React.useState({
    center: [0, 0],
    zoom: 15,
    options: {
      styles: mapStyle,
      zoomControl: false,
      fullscreenControl: false
    }
  })

  const setMap = (agents, controllerInfo, includeController) => {
    const newMap = {}
    if (!window.google) {
      return map
    }
    const bounds = new window.google.maps.LatLngBounds() // need handler incase `google` not yet available

    const validAgents = agents.filter(a => hasValidCoordinates([a.latitude, a.longitude]))

    if (!validAgents.length) {
      newMap.center = [get(controllerInfo, 'location.lat', 0), get(controllerInfo, 'location.lon', 0)]
      newMap.zoom = 9
      _setMap({ ...map, ...newMap })
      return
    } else if (validAgents.length === 1 && !includeController) {
      newMap.center = [get(validAgents[0], 'latitude', 0), get(validAgents[0], 'longitude', 0)]
      newMap.zoom = 9
      _setMap({ ...map, ...newMap })
      return
    }

    validAgents.forEach(marker => {
      bounds.extend(new window.google.maps.LatLng(get(marker, 'latitude', 0), get(marker, 'longitude', 0)))
    })

    if (includeController) {
      bounds.extend(new window.google.maps.LatLng(get(controllerInfo, 'location.lat', 0), get(controllerInfo, 'location.lon', 0)))
    }

    const newBounds = {
      ne: {
        lat: bounds.getNorthEast().lat(),
        lng: bounds.getNorthEast().lng()
      },
      sw: {
        lat: bounds.getSouthWest().lat(),
        lng: bounds.getSouthWest().lng()
      }
    }

    const size = {
      width: get(mapRef, 'current.offsetWidth', 600),
      height: get(mapRef, 'current.offsetHeight', 800)
    }

    const { center } = fitBounds(newBounds, size)
    newMap.center = center
    newMap.zoom = 1
    _setMap({ ...map, ...newMap })
  }

  return (
    <MapContext.Provider
      value={{
        map,
        mapRef,
        hasValidCoordinates,
        setMap,
        restoreMapToState: _setMap
      }}
    >
      {children}
    </MapContext.Provider>
  )
}
