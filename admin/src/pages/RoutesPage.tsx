import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIconUrl from "leaflet/dist/images/marker-icon.png";
import markerIconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png";
import { api, ApiError } from "../lib/api";

// leaflet 기본 마커 아이콘은 번들러 환경에서 경로가 깨지므로 직접 지정합니다.
const stopIcon = L.icon({
  iconUrl: markerIconUrl,
  iconRetinaUrl: markerIconRetinaUrl,
  shadowUrl: markerShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const GIST_CENTER: [number, number] = [35.2293323, 126.8476869];

type AdminStopDto = {
  pk: string;
  name_kor: string;
  name_eng: string;
  lat: number;
  lng: number;
};

type AdminRouteDto = {
  pk: string;
  short_name_kor: string;
  short_name_eng: string;
  from_stop: AdminStopDto;
  to_stop: AdminStopDto;
};

export function RoutesPage() {
  const [stops, setStops] = useState<AdminStopDto[]>([]);
  const [routes, setRoutes] = useState<AdminRouteDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.get<AdminStopDto[]>("/api/manager/v1/route/stop"),
      api.get<AdminRouteDto[]>("/api/manager/v1/route"),
    ])
      .then(([stopList, routeList]) => {
        setStops(stopList);
        setRoutes(routeList);
      })
      .catch((err) => {
        setError(
          err instanceof ApiError
            ? `목록을 불러오지 못했습니다. (${err.status})`
            : "목록을 불러오지 못했습니다.",
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const center = useMemo<[number, number]>(() => {
    if (stops.length === 0) return GIST_CENTER;
    const lat = stops.reduce((sum, s) => sum + s.lat, 0) / stops.length;
    const lng = stops.reduce((sum, s) => sum + s.lng, 0) / stops.length;
    return [lat, lng];
  }, [stops]);

  return (
    <>
      <div className="page-header">
        <h2>노선/정류장 관리</h2>
        <button className="button secondary" onClick={load} disabled={loading}>
          새로고침
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div style={{ display: "flex", gap: 24, marginBottom: 24 }}>
        <div className="card" style={{ flex: 1, minWidth: 0 }}>
          <h3>정류장 ({stops.length})</h3>
          <table>
            <thead>
              <tr>
                <th>이름</th>
              </tr>
            </thead>
            <tbody>
              {stops.map((stop) => (
                <tr key={stop.pk}>
                  <td>
                    {stop.name_kor}
                    <span className="placeholder"> ({stop.name_eng})</span>
                  </td>
                </tr>
              ))}
              {!loading && stops.length === 0 && (
                <tr>
                  <td className="placeholder">등록된 정류장이 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!loading && stops.length > 0 && (
          <div
            className="card"
            style={{ flex: 1, minWidth: 0, padding: 0, overflow: "hidden" }}
          >
            <MapContainer center={center} zoom={12} className="map-container">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {stops.map((stop) => (
                <Marker key={stop.pk} position={[stop.lat, stop.lng]} icon={stopIcon}>
                  <Popup>
                    {stop.name_kor} ({stop.name_eng})
                  </Popup>
                </Marker>
              ))}
              {routes.map((route) => (
                <Polyline
                  key={route.pk}
                  positions={[
                    [route.from_stop.lat, route.from_stop.lng],
                    [route.to_stop.lat, route.to_stop.lng],
                  ]}
                  pathOptions={{ color: "#418501", weight: 3, opacity: 0.6 }}
                >
                  <Tooltip sticky>{route.short_name_kor}</Tooltip>
                </Polyline>
              ))}
            </MapContainer>
          </div>
        )}
      </div>

      <div className="card">
        <h3>노선 ({routes.length})</h3>
        <table>
          <thead>
            <tr>
              <th>이름</th>
              <th>출발</th>
              <th>도착</th>
            </tr>
          </thead>
          <tbody>
            {routes.map((route) => (
              <tr key={route.pk}>
                <td>
                  {route.short_name_kor}
                  <span className="placeholder"> ({route.short_name_eng})</span>
                </td>
                <td>{route.from_stop.name_kor}</td>
                <td>{route.to_stop.name_kor}</td>
              </tr>
            ))}
            {!loading && routes.length === 0 && (
              <tr>
                <td colSpan={3} className="placeholder">
                  등록된 노선이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
