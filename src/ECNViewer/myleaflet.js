import React from 'react'
import L from 'leaflet'
import { useState, useEffect } from 'react'
import './myleaflet.css'
import "leaflet/dist/leaflet.css";
L.Icon.Default.imagePath = "/";
const mymapcss = {
  height: "100vh"
}
export function MapContainer(props) {
  // const [posation,setPosation] = useState([]);
  const [initFlag, setInitFlag] = useState(true)
  const flag = React.useRef(null)
  //props camefrom  the father component
  //this useEffect replace componentDidUpdate
  React.useEffect(() => {
    if (!flag.current) {
      flag.current = true
    } else {
      if (!initFlag) {
      }
    }
  })
  //this useEffect replace componentDidmount
  useEffect(() => {
    //change map document link https://leafletjs.com/examples/layers-control/
    var container = L.DomUtil.get('map')
    if (container != null) {
      container._leaflet_id = null;
    }
    var allcity = props.position.map(a => {
      return L.marker(a)
    })
    var cities = L.layerGroup(...allcity);
    var streets = L.tileLayer("//{s}.tile.osm.org/{z}/{x}/{y}.png", { id: 'MapID', tileSize: 512, zoomOffset: -1, attribution: "osm" });
    //var grayscale = L.tileLayer("//mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}", { id: 'MapID', tileSize: 512, zoomOffset: -1, attribution: "Google" });
    //var Geoq = L.tileLayer("//map.geoq.cn/ArcGIS/rest/services/ChinaOnlineCommunity/MapServer/tile/{z}/{y}/{x}", { id: 'MapID', tileSize: 512, zoomOffset: -1, attribution: "Geoq" });
    var map = L.map('map', {
      center: props.center,
      zoom: props.zoom,
      layers: [streets, cities],
      zoomControl: false 
    });
    var baseMaps = {
      "OSM": streets,
      //"Google": grayscale,
      //"Geoq": Geoq
    };
    var overlayMaps = {
      //"Cities": cities
    };
    //var newcontrol= L.control.layers(baseMaps, overlayMaps).setPosition('bottomleft').addTo(map);
    // console.log(newcontrol.getContainer())
    const navEl = document.querySelector('.latnav')
    const lControlArray = navEl.querySelectorAll('.leaflet-control')
    // console.log('find lControl', lControlArray)
    if (lControlArray){
      lControlArray.forEach((el)=>{
        el.remove()
      })
    }
    //navEl.append(newcontrol.getContainer()) 
    props.getfun(map)
    props.mcstate(true)
    setInitFlag(false)
    map.invalidateSize();
  }, [])
  return (
    <div id='map' style={mymapcss}>
      {props.children}
    </div>
  )
}