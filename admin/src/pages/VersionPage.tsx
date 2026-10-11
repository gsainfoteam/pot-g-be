import { useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";

type VersionDto = {
  ios_min_version: string;
  ios_latest_version: string;
  aos_min_version: string;
  aos_latest_version: string;
};

type Platform = "ios" | "aos";

const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;

const PLATFORMS: { key: Platform; label: string }[] = [
  { key: "ios", label: "iOS" },
  { key: "aos", label: "Android" },
];

function compareVersion(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
}

export function VersionPage() {
  const [saved, setSaved] = useState<VersionDto | null>(null);
  const [form, setForm] = useState<VersionDto | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    try {
      const data = await api.get<VersionDto>("/api/manager/v1/version");
      setSaved(data);
      setForm(data);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? `버전 정보를 불러오지 못했습니다. (${err.status})`
          : "버전 정보를 불러오지 못했습니다.",
      );
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (platform: Platform) => {
    if (!saved || !form) return;
    const minKey = `${platform}_min_version` as const;
    const latestKey = `${platform}_latest_version` as const;
    const min = form[minKey].trim();
    const latest = form[latestKey].trim();

    if (!VERSION_PATTERN.test(min) || !VERSION_PATTERN.test(latest)) {
      setError("버전은 x.y.z 형식으로 입력하세요. (예: 1.2.3)");
      setMessage(null);
      return;
    }
    if (compareVersion(min, latest) > 0) {
      setError("최소 버전은 최신 버전보다 높을 수 없습니다.");
      setMessage(null);
      return;
    }

    const body: Partial<VersionDto> = {};
    if (min !== saved[minKey]) body[minKey] = min;
    if (latest !== saved[latestKey]) body[latestKey] = latest;
    if (Object.keys(body).length === 0) {
      setError(null);
      setMessage("변경된 내용이 없습니다.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const data = await api.patch<VersionDto>("/api/manager/v1/version", body);
      setSaved(data);
      // 저장한 플랫폼의 필드만, 요청 이후 수정되지 않은 경우에 서버 값을 반영합니다.
      setForm((prev) => {
        if (!prev) return data;
        const next = { ...prev };
        if (prev[minKey].trim() === min) next[minKey] = data[minKey];
        if (prev[latestKey].trim() === latest) {
          next[latestKey] = data[latestKey];
        }
        return next;
      });
      setMessage("저장했습니다.");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? `저장하지 못했습니다. (${err.status})`
          : "저장하지 못했습니다.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h2>앱 버전 관리</h2>
      </div>

      {error && <p className="error-text">{error}</p>}
      {message && <p className="text-secondary">{message}</p>}

      {form &&
        PLATFORMS.map(({ key, label }) => {
          const minKey = `${key}_min_version` as const;
          const latestKey = `${key}_latest_version` as const;
          return (
            <div key={key} className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ marginTop: 0 }}>{label}</h3>
              <div className="inline-form version-form">
                <label>
                  최소 버전
                  <input
                    value={form[minKey]}
                    placeholder="1.0.0"
                    onChange={(e) =>
                      setForm(
                        (prev) => prev && { ...prev, [minKey]: e.target.value },
                      )
                    }
                  />
                </label>
                <label>
                  최신 버전
                  <input
                    value={form[latestKey]}
                    placeholder="1.0.0"
                    onChange={(e) =>
                      setForm(
                        (prev) =>
                          prev && { ...prev, [latestKey]: e.target.value },
                      )
                    }
                  />
                </label>
                <button
                  className="button"
                  onClick={() => save(key)}
                  disabled={submitting}
                >
                  저장
                </button>
              </div>
              <p className="placeholder">
                최소 버전 미만의 앱은 강제 업데이트 대상입니다.
              </p>
            </div>
          );
        })}
    </>
  );
}
