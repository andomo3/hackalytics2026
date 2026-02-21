import { CircleMarker, MapContainer, Polyline, Popup, TileLayer } from "react-leaflet";

function toLatLngPath(path) {
  if (!Array.isArray(path)) return [];
  return path.map((pair) => [pair[0], pair[1]]);
}

export default function SeattleMap({ frame }) {
  const threat = Number(frame?.egress_threat_score || 0);
  const showRoutes = threat > 0.5;
  const transitLoad = frame?.transit_load || {};

  return (
    <div className="h-[460px] overflow-hidden rounded-xl border border-slate-600">
      <MapContainer center={[47.5952, -122.3316]} zoom={14} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <CircleMarker center={[47.5952, -122.3316]} radius={8} pathOptions={{ color: "#f97316" }}>
          <Popup>Lumen Field</Popup>
        </CircleMarker>

        {Object.entries(transitLoad).map(([station, load], idx) => (
          <CircleMarker
            key={station}
            center={[47.596 + idx * 0.002, -122.332 + idx * 0.002]}
            radius={Math.max(6, Math.min(20, Number(load) / 120))}
            pathOptions={{ color: "#facc15" }}
          >
            <Popup>
              <strong>{station}</strong>
              <br />
              Current load: {load}
            </Popup>
          </CircleMarker>
        ))}

        {showRoutes &&
          (frame?.danger_routes || []).map((route) => (
            <Polyline
              key={`danger-${route.id || route.label}`}
              positions={toLatLngPath(route.path)}
              pathOptions={{ color: "#ef4444", weight: 6, dashArray: "8, 10" }}
            />
          ))}

        {showRoutes &&
          (frame?.safe_routes || []).map((route) => (
            <Polyline
              key={`safe-${route.id || route.label}`}
              positions={toLatLngPath(route.path)}
              pathOptions={{ color: "#10b981", weight: 6 }}
            />
          ))}
      </MapContainer>
    </div>
  );
}
