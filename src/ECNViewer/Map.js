/* eslint-disable no-unused-vars */
import React, { useState } from 'react'

import { makeStyles, useTheme } from '@material-ui/styles'
import L from 'leaflet'
import { tagColor } from './utils'
import { useMap } from '../providers/Map'
import { MapContainer } from './myleaflet'
L.Icon.Default.imagePath = "/";

sessionStorage.setItem("iscontrolready", "true");

export const { Provider, Consumer } = React.createContext("a");


const useStyles = makeStyles(theme => ({
  mapMarkerTransform: {
    transform: 'translate(-50%, -100%)',
    position: 'absolute'
  },
  msvcBadge: {
    '& .MuiBadge-badge': {
      backgroundColor: `var(--color, ${theme.colors.cobalt})`
    }
  },
  mapMarker: {
    backgroundColor: `var(--markerColor, ${theme.colors.success})`,
    borderRadius: '50% 50% 50% 0 !important',
    border: `2px solid var(--markerColor, ${theme.colors.success})`,
    transform: 'rotate(-45deg)',
    '& .MuiSvgIcon-root': {
      transform: 'rotate(-45deg)'
    },
    width: '50px',
    height: '50px',
    fontSize: 24
  },
  mapWrapper: {
    width: '172%',
    height: '96%',
    position: 'fixed',
    top: 0,
    '@media (min-width: 1200px)': {
      width: '156%'//if the max width  > 96%  the leaflet controller will be hide
    }
  },
  selectedMarker: {
    zIndex: 2,
    fontSize: 32,
    width: '80px',
    height: '80px'
  },
  selectedMarkerTransform: {
    zIndex: 2,
    '& $erContainer': {
      width: '30px',
      height: '30px',
      '& .MuiIcon-root': {
        fontSize: 16
      }
    }
  },
  erContainer: {
    backgroundColor: tagColor,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '2px',
    padding: '4px',
    borderRadius: '100%',
    zIndex: 3,
    width: '20px',
    height: '20px',
    '& .MuiIcon-root': {
      fontSize: 14
    },
    color: 'white'
  }
}))


export default function Map (props) {
  const classes = useStyles()
  const theme = useTheme()
  const { controller, setAgent, loading, agent: selectedAgent } = props
  const { map, mapRef, hasValidCoordinates } = useMap()
  const [mcstate, setMcstate] = useState(false);
  const [mymap, setMymap] = useState(0);
  var propsdata = (controller.agents).filter(a => hasValidCoordinates([a.latitude, a.longitude])).map(a =>
    [a.latitude, a.longitude]
  )
  function getMapContainer(a) {
    setMymap(a)
  
  }
  function changemcstate(a) {
    setMcstate(a)
  }

  function ViewerMarker(props) {
    //componentDidmount is not over so this component return null
    if (mcstate === false) {
      return null
    } else {
      return (
        // componentDidmount is over Mymarker function can be mark on the map
        <Consumer>
          {(mymapobj) => {
            // const Mymarker = L.marker(props.position).addTo(mymapobj);
            // var allcity = L.layerGroup(...Mymarker).addTo(mymapobj);
          }
          }
        </Consumer>
      );
    }
  }
  function SetViewOnClick({ coords }) {
    if (mcstate === false) {
      return null
    } else {
      return (
        //  
        <Consumer>
          {(mymapobj) => {
            const map = mymapobj
            map.setView(coords.center, coords.zoom);
          }
          }
        </Consumer>
      );
    }
  }


  return (
    <div className={[classes.mapWrapper, 'mui-fixed'].join(' ')} ref={mapRef}>
       <MapContainer
        {...map}
        position={propsdata}
        getfun={getMapContainer}//get leaflet example
        mcstate={changemcstate}//change react state
        isloading={loading}
      >
        <Provider value={mymap}>
          <SetViewOnClick coords={map} />
          {(loading ? [] : controller.agents).filter(a => hasValidCoordinates([a.latitude, a.longitude])).map(a =>
            <ViewerMarker
              mInstance={MapContainer}
              key={a.uuid}
              position={[a.latitude, a.longitude]}
              eventHandlers={{
                click: () => {
                  setAgent(a)
                }
              }}
              mType='agent'
              mInfo={a}
            >
            </ViewerMarker>
          )}
        </Provider>
          </MapContainer>

    </div>
  )
}