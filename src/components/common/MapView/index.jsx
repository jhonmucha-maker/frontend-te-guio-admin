import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Spinner } from '../../ui';

// Fix para los iconos de Leaflet en Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Icono Premium (dorado)
const premiumIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Icono Estándar (azul)
const standardIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Componente para cambiar la vista del mapa
const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
};

/**
 * MapView - Componente de mapa con Leaflet
 * @param {Array} markers - Array de marcadores { id, latitude, longitude, title, description, isPremium }
 * @param {Object} center - Centro del mapa { lat, lng }
 * @param {number} zoom - Nivel de zoom
 * @param {number} height - Altura del mapa
 * @param {function} onMarkerClick - Callback cuando se hace click en un marcador
 * @param {boolean} loading - Si esta cargando
 */
const MapView = ({
  markers = [],
  center = { lat: -12.0464, lng: -77.0428 }, // Lima, Peru
  zoom = 12,
  height = 400,
  onMarkerClick,
  loading = false,
}) => {
  if (loading) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center bg-gray-100 rounded-lg"
      >
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="relative">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        style={{ height, width: '100%', borderRadius: 8 }}
        scrollWheelZoom={true}
      >
        <ChangeView center={[center.lat, center.lng]} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.latitude, marker.longitude]}
            icon={marker.isPremium ? premiumIcon : standardIcon}
            eventHandlers={{
              click: () => onMarkerClick && onMarkerClick(marker),
            }}
          >
            <Popup>
              <div className="min-w-[150px]">
                <p className="font-semibold text-gray-900">
                  {marker.title}
                  {marker.isPremium && ' ⭐'}
                </p>
                {marker.description && (
                  <p className="text-sm text-gray-500">
                    {marker.description}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Leyenda */}
      <div className="absolute bottom-4 left-4 bg-surface rounded-lg p-3 shadow-lg z-[1000] flex gap-4 items-center">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <span className="text-xs text-gray-600">Premium</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-xs text-gray-600">Estándar</span>
        </div>
        <span className="px-2 py-0.5 text-xs font-medium text-primary border border-primary rounded-full">
          {markers.length} tiendas
        </span>
      </div>
    </div>
  );
};

export default MapView;
