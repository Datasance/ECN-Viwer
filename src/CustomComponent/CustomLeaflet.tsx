import React, { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker as LeafletCircleMarker,
  useMap
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '',
  iconUrl: '',
  shadowUrl: '',
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
}

const CustomLeaflet: React.FC<CustomLeafletProps> = ({
  center,
  zoom = 13,
  markers,
  className = '',
  height = '100%',
  width = '100%',
  tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution = '&copy; OpenStreetMap contributors',
  onMarkerAction,
  collapsed
}) => {
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(center);

  useEffect(() => {
    if (markers.length > 0) {
      setMapCenter(markers[0].position);
    }
  }, [markers]);

  function groupMarkersByPosition(markers: any[]): any[] {
    const grouped: Record<string, any[]> = {};

    for (const marker of markers) {
      const key = marker.position.join(',');
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
    const isSelected = selectedMarker?.id === marker.id;
    return (
      <LeafletCircleMarker
        center={marker.position}
        pathOptions={{
          color: isSelected ? 'blue' : marker.color || 'gray',
          fillColor: isSelected ? 'blue' : marker.color || 'gray',
          fillOpacity: 0.8,
        }}
        radius={isSelected ? 12 : 10}
        eventHandlers={{
          click: (e) => {
            e.originalEvent.stopPropagation();
            setSelectedMarker(marker);
          },
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

  return (
    <div className={`relative ${className}`} style={{ height, width }}>
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        scrollWheelZoom={true}
        className="h-full w-full rounded-xl shadow-lg z-0"
      >
        <TileLayer url={tileUrl} attribution={attribution} />
        {adjustedMarkers.map((marker) => (
          <CustomMarker key={marker.id} marker={marker} />
        ))}
        <MapResizer collapsed={collapsed} />
      </MapContainer>

      {selectedMarker && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-lg rounded-lg p-4 w-[90%] max-w-md z-50 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold mb-1">{selectedMarker.label || 'Seçilen Marker'}</h3>
              <p className="text-sm opacity-80 mb-2">ID: {selectedMarker.id}</p>
              <p className="text-sm opacity-80">Konum: {selectedMarker.position.join(', ')}</p>
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
