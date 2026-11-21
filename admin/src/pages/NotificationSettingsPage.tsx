import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../lib/api";

type DelayCheckPolicyDto = {
  enabled: boolean;
  minutes_before_departure: number;
  updated_at: string;
};

const POLICY_PATH = "/api/manager/v1/notification/delay-check";

export function NotificationSettingsPage() {
  const [policy, setPolicy] = useState<DelayCheckPolicyDto | null>(null);

  const [minutes, setMinutes] = useState("30");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await api.get<DelayCheckPolicyDto>(POLICY_PATH);

        if (!active) return;

        setPolicy(data);
        setMinutes(String(data.minutes_before_departure));
      } catch {
        if (!active) return;

        setError("설정을 불러오지 못했습니다. 다시 시도해 주세요.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving || !policy) return;

    setError(null);
    setMessage(null);

    const parsedMinutes = Number(minutes);

    if (
      !Number.isInteger(parsedMinutes) ||
      parsedMinutes < 1 ||
      parsedMinutes > 2147483647
    ) {
      setError("출발 전 알림 시간은 1 이상의 정수로 입력해 주세요.");
      return;
    }

    setSaving(true);

    try {
      const data = await api.patch<DelayCheckPolicyDto>(POLICY_PATH, {
        enabled: true,
        minutes_before_departure: parsedMinutes,
      });

      setPolicy(data);
      setMinutes(String(data.minutes_before_departure));
      setMessage("설정을 저장했습니다.");
    } catch {
      setError(
        "설정을 저장하지 못했습니다. 입력값과 연결 상태를 확인해 주세요.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <p className="placeholder" role="status">
        설정을 불러오는 중입니다.
      </p>
    );
  }

  if (!policy) {
    return (
      <div className="notification-settings">
        <div className="page-header">
          <h2>지연 확인 알림 설정</h2>
        </div>
        <div className="card">
          <p className="error-text" role="alert">
            {error}
          </p>
          <button
            type="button"
            className="button secondary"
            onClick={() => window.location.reload()}
          >
            다시 불러오기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="notification-settings">
      <div className="page-header">
        <h2>지연 확인 알림 설정</h2>
      </div>
      <p className="notification-description">
        지스트행 팟의 확정된 택시 출발 시간을 기준으로 지연 여부 확인 알림을
        설정합니다.
      </p>

      <form className="card notification-card" onSubmit={handleSubmit}>
        <fieldset className="notification-fields" disabled={saving}>
          <legend className="notification-legend">발송 설정</legend>
          <div className="notification-setting-row">
            <label
              className="notification-setting-label"
              htmlFor="delay-check-minutes"
            >
              알림 시점
            </label>
            <div className="notification-time-input">
              <span>출발</span>
              <input
                id="delay-check-minutes"
                type="number"
                min={1}
                max={2147483647}
                step={1}
                required
                aria-describedby="delay-check-timing-unit"
                value={minutes}
                onChange={(event) => {
                  setMinutes(event.target.value);
                  setMessage(null);
                }}
              />
              <span id="delay-check-timing-unit">분 전</span>
            </div>
          </div>
          <p className="notification-notice">
            기본 알림 설정: 출발 10분 전
          </p>
          <div className="notification-footer">
            <p className="notification-updated">
              마지막 수정{" "}
              {new Date(policy.updated_at).toLocaleString("ko-KR", {
                timeZone: "Asia/Seoul",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
            </p>
            <button type="submit" className="button small notification-save">
              {saving ? "저장 중…" : "저장"}
            </button>
          </div>
        </fieldset>
        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="notification-success" role="status">
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
