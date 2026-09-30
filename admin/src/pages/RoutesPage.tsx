import { useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMapEvents,
} from "react-leaflet";
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

type Mode = "none" | "add-stop" | "add-route";

function MapClickHandler({
  onClick,
}: {
  onClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function RoutesPage() {
  const [stops, setStops] = useState<AdminStopDto[]>([]);
  const [routes, setRoutes] = useState<AdminRouteDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode>("none");
  const [pendingStop, setPendingStop] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [stopForm, setStopForm] = useState({ name_kor: "", name_eng: "" });
  const [routeSelection, setRouteSelection] = useState<AdminStopDto[]>([]);
  const [routeForm, setRouteForm] = useState({
    short_name_kor: "",
    short_name_eng: "",
    reverse_short_name_kor: "",
    reverse_short_name_eng: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [editingStopPk, setEditingStopPk] = useState<string | null>(null);
  const [editStopForm, setEditStopForm] = useState({
    name_kor: "",
    name_eng: "",
  });
  const [editStopPosition, setEditStopPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [editingRoutePk, setEditingRoutePk] = useState<string | null>(null);
  const [editRouteForm, setEditRouteForm] = useState({
    short_name_kor: "",
    short_name_eng: "",
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

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

  const resetInteraction = () => {
    setPendingStop(null);
    setRouteSelection([]);
    setStopForm({ name_kor: "", name_eng: "" });
    setRouteForm({
      short_name_kor: "",
      short_name_eng: "",
      reverse_short_name_kor: "",
      reverse_short_name_eng: "",
    });
    setFormError(null);
  };

  const toggleMode = (next: Mode) => {
    setMode((current) => (current === next ? "none" : next));
    resetInteraction();
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (mode === "add-stop") {
      setFormError(null);
      setPendingStop({ lat, lng });
    }
  };

  const handleStopMarkerClick = (stop: AdminStopDto) => {
    if (mode !== "add-route") return;
    setFormError(null);
    setRouteSelection((prev) => {
      if (prev.some((s) => s.pk === stop.pk)) return prev;
      if (prev.length < 2) return [...prev, stop];
      return [stop];
    });
  };

  const submitStop = async () => {
    if (!pendingStop) return;
    if (!stopForm.name_kor.trim() || !stopForm.name_eng.trim()) {
      setFormError("한글/영문 이름을 모두 입력하세요.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await api.post("/api/manager/v1/route/stop", {
        name_kor: stopForm.name_kor.trim(),
        name_eng: stopForm.name_eng.trim(),
        lat: pendingStop.lat,
        lng: pendingStop.lng,
      });
      setMode("none");
      resetInteraction();
      load();
    } catch (err) {
      setFormError(
        err instanceof ApiError
          ? `정류장을 추가하지 못했습니다. (${err.status})`
          : "정류장을 추가하지 못했습니다.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const submitRoute = async () => {
    if (routeSelection.length !== 2) return;
    if (
      !routeForm.short_name_kor.trim() ||
      !routeForm.short_name_eng.trim() ||
      !routeForm.reverse_short_name_kor.trim() ||
      !routeForm.reverse_short_name_eng.trim()
    ) {
      setFormError("양방향 한글/영문 노선 이름을 모두 입력하세요.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await api.post("/api/manager/v1/route", {
        from_stop_pk: routeSelection[0].pk,
        to_stop_pk: routeSelection[1].pk,
        short_name_kor: routeForm.short_name_kor.trim(),
        short_name_eng: routeForm.short_name_eng.trim(),
        reverse_short_name_kor: routeForm.reverse_short_name_kor.trim(),
        reverse_short_name_eng: routeForm.reverse_short_name_eng.trim(),
      });
      setMode("none");
      resetInteraction();
      load();
    } catch (err) {
      setFormError(
        err instanceof ApiError
          ? `노선을 추가하지 못했습니다. (${err.status})`
          : "노선을 추가하지 못했습니다.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const startEditStop = (stop: AdminStopDto) => {
    setEditingStopPk(stop.pk);
    setEditStopForm({ name_kor: stop.name_kor, name_eng: stop.name_eng });
    setEditStopPosition({ lat: stop.lat, lng: stop.lng });
    setEditError(null);
  };

  const cancelEditStop = () => {
    setEditingStopPk(null);
    setEditStopPosition(null);
  };

  const saveStopName = async (pk: string) => {
    if (!editStopForm.name_kor.trim() || !editStopForm.name_eng.trim()) {
      setEditError("한글/영문 이름을 모두 입력하세요.");
      return;
    }
    setEditSubmitting(true);
    setEditError(null);
    try {
      await api.patch(`/api/manager/v1/route/stop/${pk}`, {
        name_kor: editStopForm.name_kor.trim(),
        name_eng: editStopForm.name_eng.trim(),
        lat: editStopPosition?.lat,
        lng: editStopPosition?.lng,
      });
      setEditingStopPk(null);
      setEditStopPosition(null);
      load();
    } catch (err) {
      setEditError(
        err instanceof ApiError
          ? `수정하지 못했습니다. (${err.status})`
          : "수정하지 못했습니다.",
      );
    } finally {
      setEditSubmitting(false);
    }
  };

  const startEditRoute = (route: AdminRouteDto) => {
    setEditingRoutePk(route.pk);
    setEditRouteForm({
      short_name_kor: route.short_name_kor,
      short_name_eng: route.short_name_eng,
    });
    setEditError(null);
  };

  const saveRouteName = async (pk: string) => {
    if (
      !editRouteForm.short_name_kor.trim() ||
      !editRouteForm.short_name_eng.trim()
    ) {
      setEditError("한글/영문 이름을 모두 입력하세요.");
      return;
    }
    setEditSubmitting(true);
    setEditError(null);
    try {
      await api.patch(`/api/manager/v1/route/${pk}`, {
        short_name_kor: editRouteForm.short_name_kor.trim(),
        short_name_eng: editRouteForm.short_name_eng.trim(),
      });
      setEditingRoutePk(null);
      load();
    } catch (err) {
      setEditError(
        err instanceof ApiError
          ? `수정하지 못했습니다. (${err.status})`
          : "수정하지 못했습니다.",
      );
    } finally {
      setEditSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h2>노선/정류장 관리</h2>
        <button className="button secondary" onClick={load} disabled={loading}>
          새로고침
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}
      {editError && <p className="error-text">{editError}</p>}

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          className={mode === "add-stop" ? "button" : "button secondary"}
          onClick={() => toggleMode("add-stop")}
        >
          정류장 추가
        </button>
        <button
          className={mode === "add-route" ? "button" : "button secondary"}
          onClick={() => toggleMode("add-route")}
        >
          경로 추가
        </button>
      </div>

      {mode === "add-stop" && !pendingStop && (
        <p className="placeholder" style={{ marginBottom: 12 }}>
          지도를 클릭해 새 정류장 위치를 선택하세요.
        </p>
      )}
      {mode === "add-route" && routeSelection.length < 2 && (
        <p className="placeholder" style={{ marginBottom: 12 }}>
          지도에서 출발 정류장, 도착 정류장을 순서대로 클릭하세요. (
          {routeSelection.length}/2 선택됨)
        </p>
      )}
      {editingStopPk && (
        <p className="placeholder" style={{ marginBottom: 12 }}>
          지도에서 정류장 아이콘을 드래그해 위치를 옮긴 뒤, 표에서 저장하세요.
        </p>
      )}

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
                    {editingStopPk === stop.pk ? (
                      <div className="inline-form compact">
                        <input
                          placeholder="한글 이름"
                          value={editStopForm.name_kor}
                          onChange={(e) =>
                            setEditStopForm((f) => ({
                              ...f,
                              name_kor: e.target.value,
                            }))
                          }
                        />
                        <input
                          placeholder="영문 이름"
                          value={editStopForm.name_eng}
                          onChange={(e) =>
                            setEditStopForm((f) => ({
                              ...f,
                              name_eng: e.target.value,
                            }))
                          }
                        />
                        <button
                          className="button"
                          disabled={editSubmitting}
                          onClick={() => saveStopName(stop.pk)}
                        >
                          저장
                        </button>
                        <button
                          className="button secondary"
                          disabled={editSubmitting}
                          onClick={cancelEditStop}
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <>
                        {stop.name_kor}
                        <span className="placeholder"> ({stop.name_eng})</span>
                        <button
                          className="link-button"
                          onClick={() => startEditStop(stop)}
                        >
                          수정
                        </button>
                      </>
                    )}
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

        {!loading && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              className="card"
              style={{ padding: 0, overflow: "hidden" }}
            >
              <MapContainer
                center={center}
                zoom={12}
                className="map-container"
                style={{
                  cursor: mode === "add-stop" ? "crosshair" : undefined,
                }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickHandler onClick={handleMapClick} />
                {stops.map((stop) => {
                  const isEditing = editingStopPk === stop.pk;
                  return (
                    <Marker
                      key={`${stop.pk}:${isEditing ? "editing" : "idle"}`}
                      position={[stop.lat, stop.lng]}
                      icon={stopIcon}
                      draggable={isEditing}
                      eventHandlers={{
                        click: () => handleStopMarkerClick(stop),
                        drag: (e) => {
                          const { lat, lng } = e.target.getLatLng();
                          setEditStopPosition({ lat, lng });
                        },
                      }}
                    >
                      <Popup>
                        {stop.name_kor} ({stop.name_eng})
                      </Popup>
                    </Marker>
                  );
                })}
                {routeSelection.map((stop) => (
                  <CircleMarker
                    key={`selected-${stop.pk}`}
                    center={[stop.lat, stop.lng]}
                    radius={14}
                    pathOptions={{ color: "#ba0407", weight: 3, fillOpacity: 0 }}
                  />
                ))}
                {editingStopPk && editStopPosition && (
                  <CircleMarker
                    center={[editStopPosition.lat, editStopPosition.lng]}
                    radius={16}
                    pathOptions={{ color: "#0066ff", weight: 3, fillOpacity: 0 }}
                  />
                )}
                {pendingStop && (
                  <Marker
                    position={[pendingStop.lat, pendingStop.lng]}
                    icon={stopIcon}
                    opacity={0.6}
                  >
                    <Popup>새 정류장 위치</Popup>
                  </Marker>
                )}
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

            {pendingStop && (
              <div className="card" style={{ marginTop: 12 }}>
                <h4 style={{ marginTop: 0 }}>새 정류장 추가</h4>
                <p className="placeholder">
                  위도 {pendingStop.lat.toFixed(6)}, 경도{" "}
                  {pendingStop.lng.toFixed(6)}
                </p>
                <div className="inline-form">
                  <input
                    placeholder="한글 이름"
                    value={stopForm.name_kor}
                    onChange={(e) =>
                      setStopForm((f) => ({ ...f, name_kor: e.target.value }))
                    }
                  />
                  <input
                    placeholder="영문 이름"
                    value={stopForm.name_eng}
                    onChange={(e) =>
                      setStopForm((f) => ({ ...f, name_eng: e.target.value }))
                    }
                  />
                  <button
                    className="button"
                    disabled={submitting}
                    onClick={submitStop}
                  >
                    추가
                  </button>
                  <button
                    className="button secondary"
                    disabled={submitting}
                    onClick={() => {
                      setPendingStop(null);
                      setFormError(null);
                    }}
                  >
                    취소
                  </button>
                </div>
                {formError && <p className="error-text">{formError}</p>}
              </div>
            )}

            {mode === "add-route" && routeSelection.length > 0 && (
              <div className="card" style={{ marginTop: 12 }}>
                <h4 style={{ marginTop: 0 }}>새 노선 추가 (양방향)</h4>
                <p className="placeholder">
                  {routeSelection[0]?.name_kor ?? "-"} ↔{" "}
                  {routeSelection[1]?.name_kor ?? "-"}
                </p>
                {routeSelection.length === 2 && (
                  <>
                    <div className="inline-form">
                      <span style={{ minWidth: 140 }}>
                        {routeSelection[0].name_kor} → {routeSelection[1].name_kor}
                      </span>
                      <input
                        placeholder="한글 이름"
                        value={routeForm.short_name_kor}
                        onChange={(e) =>
                          setRouteForm((f) => ({
                            ...f,
                            short_name_kor: e.target.value,
                          }))
                        }
                      />
                      <input
                        placeholder="영문 이름"
                        value={routeForm.short_name_eng}
                        onChange={(e) =>
                          setRouteForm((f) => ({
                            ...f,
                            short_name_eng: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="inline-form">
                      <span style={{ minWidth: 140 }}>
                        {routeSelection[1].name_kor} → {routeSelection[0].name_kor}
                      </span>
                      <input
                        placeholder="한글 이름"
                        value={routeForm.reverse_short_name_kor}
                        onChange={(e) =>
                          setRouteForm((f) => ({
                            ...f,
                            reverse_short_name_kor: e.target.value,
                          }))
                        }
                      />
                      <input
                        placeholder="영문 이름"
                        value={routeForm.reverse_short_name_eng}
                        onChange={(e) =>
                          setRouteForm((f) => ({
                            ...f,
                            reverse_short_name_eng: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="inline-form">
                      <button
                        className="button"
                        disabled={submitting}
                        onClick={submitRoute}
                      >
                        추가
                      </button>
                      <button
                        className="button secondary"
                        disabled={submitting}
                        onClick={() => {
                          setRouteSelection([]);
                          setFormError(null);
                        }}
                      >
                        다시 선택
                      </button>
                    </div>
                  </>
                )}
                {formError && <p className="error-text">{formError}</p>}
              </div>
            )}
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
                  {editingRoutePk === route.pk ? (
                    <div className="inline-form compact">
                      <input
                        placeholder="한글 이름"
                        value={editRouteForm.short_name_kor}
                        onChange={(e) =>
                          setEditRouteForm((f) => ({
                            ...f,
                            short_name_kor: e.target.value,
                          }))
                        }
                      />
                      <input
                        placeholder="영문 이름"
                        value={editRouteForm.short_name_eng}
                        onChange={(e) =>
                          setEditRouteForm((f) => ({
                            ...f,
                            short_name_eng: e.target.value,
                          }))
                        }
                      />
                      <button
                        className="button"
                        disabled={editSubmitting}
                        onClick={() => saveRouteName(route.pk)}
                      >
                        저장
                      </button>
                      <button
                        className="button secondary"
                        disabled={editSubmitting}
                        onClick={() => setEditingRoutePk(null)}
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <>
                      {route.short_name_kor}
                      <span className="placeholder"> ({route.short_name_eng})</span>
                      <button
                        className="link-button"
                        onClick={() => startEditRoute(route)}
                      >
                        수정
                      </button>
                    </>
                  )}
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
