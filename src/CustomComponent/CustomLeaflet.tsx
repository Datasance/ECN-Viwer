import React, { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker as LeafletCircleMarker,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import ZoomOutMap from "@material-ui/icons/ZoomOutMap";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "",
  iconUrl: "",
  shadowUrl: "",
});

interface MarkerData {
  id: string | number;
  position: [number, number];
  color?: string;
  label?: string;
  [key: string]: any;
}

interface CustomLeafletProps {
  center: [number, number];
  zoom?: number;
  markers: MarkerData[];
  className?: string;
  height?: string;
  width?: string;
  tileUrl?: string;
  attribution?: string;
  onMarkerAction?: (marker: MarkerData) => void;
  collapsed: boolean;
  selectedMarkerId?: string;
}

const CustomLeaflet: React.FC<CustomLeafletProps> = ({
  center,
  zoom = 13,
  markers,
  className = "",
  height = "100%",
  width = "100%",
  tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution = "&copy; OpenStreetMap contributors",
  onMarkerAction,
  collapsed,
  selectedMarkerId,
}) => {
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(center);

  const mapRef = useRef<L.Map>(null);

  useEffect(() => {
    if (markers.length > 0) {
      setMapCenter(markers[0].position);
    }
  }, [markers]);

  useEffect(() => {
    if (selectedMarkerId && mapRef.current) {
      const foundMarker = markers.find((m) => m.id === selectedMarkerId);
      if (foundMarker) {
        mapRef.current.setView(foundMarker.position, mapRef.current.getZoom());
        mapRef.current.flyTo(foundMarker.position, 16, { duration: 0.5 });
        setSelectedMarker(foundMarker);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMarkerId]);

  function groupMarkersByPosition(markers: any[]): any[] {
    const grouped: Record<string, any[]> = {};

    for (const marker of markers) {
      const key = marker.position.join(",");
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(marker);
    }

    const adjustedMarkers: any[] = [];

    for (const group of Object.values(grouped)) {
      if (group.length === 1) {
        adjustedMarkers.push(group[0]);
      } else {
        group.forEach((marker, index) => {
          const offsetLat = marker.position[0] + 0.0001 * index;
          const offsetLng = marker.position[1] + 0.0001 * index;
          adjustedMarkers.push({
            ...marker,
            position: [offsetLat, offsetLng],
          });
        });
      }
    }

    return adjustedMarkers;
  }

  const adjustedMarkers = groupMarkersByPosition(markers);

  const CustomMarker = ({ marker }: { marker: MarkerData }) => {
    const map = useMap();
    const isSelected = selectedMarker?.id === marker.id;

    const handleClick = (e: any) => {
      e.originalEvent.stopPropagation();
      setSelectedMarker(marker);
      map.setView(marker.position, map.getZoom());
      map.flyTo(marker.position, 16, { duration: 0.5 });
    };

    return (
      <LeafletCircleMarker
        center={marker.position}
        pathOptions={{
          color: isSelected ? "blue" : marker.color || "gray",
          fillColor: isSelected ? "blue" : marker.color || "gray",
          fillOpacity: 0.8,
        }}
        radius={isSelected ? 12 : 10}
        eventHandlers={{
          click: handleClick,
        }}
      />
    );
  };

  const MapResizer = ({ collapsed }: { collapsed: boolean }) => {
    const map = useMap();

    useEffect(() => {
      map.invalidateSize();
    }, [collapsed, map]);

    return null;
  };

  const ZoomOutButton = () => {
    const map = useMap();

    const getCenterOfMarkers = (markers: MarkerData[]): [number, number] => {
      const latSum = markers.reduce((sum, m) => sum + m.position[0], 0);
      const lngSum = markers.reduce((sum, m) => sum + m.position[1], 0);
      return [latSum / markers.length, lngSum / markers.length];
    };

    const handleZoomOut = () => {
      const center = getCenterOfMarkers(markers);
      map.setView(center, 3);
    };

    return (
      <div className="absolute bottom-4 right-4 z-[1000]">
        <button
          onClick={handleZoomOut}
          className="bg-gray-800 text-white rounded-full shadow-md w-10 h-10 flex items-center justify-center hover:bg-gray-700 transition"
          title="Zoom Out"
        >
          <ZoomOutMap fontSize="medium" />
        </button>
      </div>
    );
  };

  return (
    <div className={`relative ${className}`} style={{ height, width }}>
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        scrollWheelZoom={true}
        className="h-full w-full rounded-xl shadow-lg z-0"
        ref={mapRef}
      >
        <TileLayer url={tileUrl} attribution={attribution} />
        {adjustedMarkers.map((marker) => (
          <CustomMarker key={marker.id} marker={marker} />
        ))}
        <MapResizer collapsed={collapsed} />
        <ZoomOutButton />
      </MapContainer>

      {selectedMarker && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-lg rounded-lg p-4 w-[90%] max-w-md z-50 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold mb-1">
                {selectedMarker.label || "Selected Marker"}
              </h3>
              <p className="text-sm opacity-80 mb-2">ID: {selectedMarker.id}</p>
              <p className="text-sm opacity-80">
                Location: {selectedMarker.position.join(", ")}
              </p>
            </div>
            <button
              onClick={() => setSelectedMarker(null)}
              className="text-gray-400 hover:text-red-500 text-xl font-bold ml-4"
            >
              ×
            </button>
          </div>
          <button
            onClick={() => onMarkerAction?.(selectedMarker)}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition"
          >
            Detail
          </button>
        </div>
      )}
    </div>
  );
};

export default CustomLeaflet;
