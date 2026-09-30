import { useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";

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

  return (
    <>
      <div className="page-header">
        <h2>노선/정류장 관리</h2>
        <button className="button secondary" onClick={load} disabled={loading}>
          새로고침
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="card" style={{ marginBottom: 24 }}>
        <h3>정류장 ({stops.length})</h3>
        <table>
          <thead>
            <tr>
              <th>이름</th>
              <th>위도</th>
              <th>경도</th>
            </tr>
          </thead>
          <tbody>
            {stops.map((stop) => (
              <tr key={stop.pk}>
                <td>
                  {stop.name_kor}
                  <span className="placeholder"> ({stop.name_eng})</span>
                </td>
                <td>{stop.lat}</td>
                <td>{stop.lng}</td>
              </tr>
            ))}
            {!loading && stops.length === 0 && (
              <tr>
                <td colSpan={3} className="placeholder">
                  등록된 정류장이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
