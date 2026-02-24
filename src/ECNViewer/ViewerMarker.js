import L from "leaflet";
L.Icon.Default.imagePath = "/";

// Import all images as a object
const requireContext = require.context(
  "../assets/markerIcon",
  true,
  /^\.\/.*\.png$/,
);
const getImportImageObject = function (filename) {
  return requireContext(`./${filename}.png`);
};

// Attention: when the status of target either is notworking or unknown, always using ...NotWorking.png
const iconSourceNameList = {
  agent: {
    work: "agent",
    not_work: "agent_uk",
  },
  application: {
    work: "application",
    not_work: "application_uk",
  },
  controller: {
    work: "controller",
    not_work: "controller_uk",
  },
};

// Define a class to manage our customize icon
function MarkerIcon(props) {
  this.type = props.mType;
  this.info = props.mInfo;
}

/**
 * GetIconUrl
 * @description Get icon object or url by node's status & type
 * @return {string} imagePath
 */
MarkerIcon.prototype.getIconUrl = function () {
  const workStatus = this.getStatus();
  return getImportImageObject(iconSourceNameList[this.type][workStatus]);
};

/**
 * GetPointStatus
 * @description Get point working status and transform to union status
 * @return {string} workStatus
 */
MarkerIcon.prototype.getStatus = function () {
  let ret = "";
  // Decide how to get a node's status according to its type
  if (this.type === "agent") {
    ret = this.info.daemonStatus === "RUNNING" ? "work" : "not_work";
  }
  if (this.type === "application") {
    ret = this.info.isActivated ? "work" : "not_work";
  }
  if (this.type === "controller") {
    ret = this.info.status.status === "online" ? "work" : "not_work";
  }

  if (!ret) {
    console.warn(
      "Can not find an icon belong to this type! Icon url will be null.",
    );
  }
  return ret;
};

/**
 * ViewerMarker
 * @description UI component - map marker
 * @param {object} props
 * @return {reactDOM} marker
 */
export default function ViewerMarker(props) {
  const mIcon = new MarkerIcon(props);
  L.icon({
    iconUrl: mIcon.getIconUrl(),
    iconSize: [25, 41],
  });
  //
  var allcity = props.position.map((a) => {
    return L.marker(a);
  });
  var cities = L.layerGroup(...allcity);
  return cities;
  // <Mymarker icon={iconInstance} {...props} />
}
