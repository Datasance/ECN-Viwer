/* eslint-disable no-unused-vars */
import React, { useState } from "react";

import { Box } from "@mui/material";
import L from "leaflet";
import { tagColor } from "./utils";
import { useMap } from "../providers/Map";
import { MapContainer } from "./myleaflet";
L.Icon.Default.imagePath = "/";

sessionStorage.setItem("iscontrolready", "true");

export const { Provider, Consumer } = React.createContext("a");

const mapWrapperSx = {
  width: "172%",
  height: "96%",
  position: "fixed",
  top: 0,
  "@media (min-width: 1200px)": {
    width: "156%",
  },
};

export default function Map(props) {
  const { controller, setAgent, loading, agent: selectedAgent } = props;
  const { map, mapRef, hasValidCoordinates } = useMap();
  const [mcstate, setMcstate] = useState(false);
  const [mymap, setMymap] = useState(0);
  var propsdata = controller.agents
    .filter((a) => hasValidCoordinates([a.latitude, a.longitude]))
    .map((a) => [a.latitude, a.longitude]);
  function getMapContainer(a) {
    setMymap(a);
  }
  function changemcstate(a) {
    setMcstate(a);
  }

  function ViewerMarker(props) {
    if (mcstate === false) {
      return null;
    } else {
      return <Consumer>{(mymapobj) => {}}</Consumer>;
    }
  }
  function SetViewOnClick({ coords }) {
    if (mcstate === false) {
      return null;
    } else {
      return (
        <Consumer>
          {(mymapobj) => {
            const mapObj = mymapobj;
            mapObj.setView(coords.center, coords.zoom);
          }}
        </Consumer>
      );
    }
  }

  return (
    <Box sx={mapWrapperSx} className="mui-fixed" ref={mapRef}>
      <MapContainer
        {...map}
        position={propsdata}
        getfun={getMapContainer}
        mcstate={changemcstate}
        isloading={loading}
      >
        <Provider value={mymap}>
          <SetViewOnClick coords={map} />
          {(loading ? [] : controller.agents)
            .filter((a) => hasValidCoordinates([a.latitude, a.longitude]))
            .map((a) => (
              <ViewerMarker
                mInstance={MapContainer}
                key={a.uuid}
                position={[a.latitude, a.longitude]}
                eventHandlers={{
                  click: () => {
                    setAgent(a);
                  },
                }}
                mType="agent"
                mInfo={a}
              ></ViewerMarker>
            ))}
        </Provider>
      </MapContainer>
    </Box>
  );
}
