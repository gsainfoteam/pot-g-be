import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { api, ApiError } from "../lib/api";
import { useFetch } from "../lib/use-fetch";

type TimingAnchor =
  | "departure_available_start"
  | "departure_available_end"
  | "departure_time"
  | "accounting_completed";

type PopoMessageVariable = {
  name: string;
  description: string;
};

type PopoMessagePolicy = {
  type: string;
  title: string;
  description: string;
  message: string;
  action_btns: string[];
  /** 문구에 {name} 형태로 쓸 수 있는 변수 (코드에서 정해지므로 읽기 전용) */
  variables: PopoMessageVariable[];
  enabled: boolean;
  timing_anchor: TimingAnchor | null;
  /** 음수 = 기준 시각 전, 양수 = 기준 시각 후 */
  offset_minutes: number | null;
  updated_at: string;
};

const ANCHOR_LABELS: Record<TimingAnchor, string> = {
  departure_available_start: "출발 가능 시작 시각",
  departure_available_end: "출발 가능 종료 시각",
  departure_time: "출발 시각",
  accounting_completed: "정산 완료 시각",
};

const ACTION_BTN_LABELS: Record<string, string> = {
  "departure-confirm-btn": "출발 시간 확정",
  "taxi-call-btn": "택시 호출",
  "accounting-request-btn": "정산 요청",
  "accounting-info-check-btn": "정산 정보 확인",
  "accounting-process-btn": "정산 처리",
  "delay-check-btn": "지연 확인",
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

type CardProps = {
  policy: PopoMessagePolicy;
  onSave: (next: PopoMessagePolicy) => Promise<void>;
};

function PopoMessageCard({ policy, onSave }: CardProps) {
  const [message, setMessage] = useState(policy.message);
  const [enabled, setEnabled] = useState(policy.enabled);
  const [direction, setDirection] = useState<"before" | "after">(
    (policy.offset_minutes ?? 0) > 0 ? "after" : "before",
  );
  const [minutes, setMinutes] = useState(
    String(Math.abs(policy.offset_minutes ?? 0)),
  );
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 문구 길이에 맞춰 입력칸 높이를 늘립니다.
  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [message]);

  const hasTiming = policy.timing_anchor !== null;

  const handleSave = async () => {
    setError(null);
    setSaved(false);

    if (message.trim() === "") {
      setError("메시지 문구를 입력해 주세요.");
      return;
    }

    let offset: number | null = null;
    if (hasTiming) {
      const parsed = Number(minutes);
      if (!Number.isInteger(parsed) || parsed < 0) {
        setError("발송 시점은 0 이상의 정수(분)로 입력해 주세요.");
        return;
      }
      offset = direction === "before" ? -parsed : parsed;
    }

    try {
      await onSave({ ...policy, message, enabled, offset_minutes: offset });
      setSaved(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? `저장하지 못했습니다. (${err.status})`
          : "저장하지 못했습니다.",
      );
    }
  };

  return (
    <section className={`card popo-message-card${enabled ? "" : " disabled"}`}>
      <div className="popo-message-head">
        <div>
          <h3>{policy.title}</h3>
          <span className="popo-message-type">{policy.type}</span>
        </div>
        <label className="popo-message-switch">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => {
              setEnabled(event.target.checked);
              setSaved(false);
            }}
          />
          {enabled ? "발송 중" : "발송 안 함"}
        </label>
      </div>

      <p className="popo-message-logic">
        <strong>발송 조건 (코드에서만 수정 가능)</strong>
        {policy.description}
      </p>

      <label className="popo-message-field">
        메시지 문구
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(event) => {
            setMessage(event.target.value);
            setSaved(false);
          }}
        />
        <span className="popo-message-hint">
          **굵게** 표기를 쓸 수 있습니다.
        </span>
      </label>

      <div className="popo-variables">
        <span>사용할 수 있는 변수</span>
        {policy.variables.length === 0 ? (
          <span className="popo-message-hint">없음</span>
        ) : (
          <>
            <ul>
              {policy.variables.map((variable) => (
                <li key={variable.name}>
                  <code>{`{${variable.name}}`}</code>
                  <span>{variable.description}</span>
                </li>
              ))}
            </ul>
            <span className="popo-message-hint">
              변수는 발송할 때 실제 값으로 바뀝니다. 변수 이름은 정확히 입력해
              주세요.
            </span>
          </>
        )}
      </div>

      <div className="popo-timing">
        <span>발송 시점</span>
        {policy.timing_anchor ? (
          <>
            <span>{ANCHOR_LABELS[policy.timing_anchor]}</span>
            <input
              type="number"
              min={0}
              step={1}
              aria-label="발송 시점(분)"
              value={minutes}
              onChange={(event) => {
                setMinutes(event.target.value);
                setSaved(false);
              }}
            />
            <span>분</span>
            <select
              aria-label="기준 시각 전후"
              value={direction}
              onChange={(event) => {
                setDirection(event.target.value as "before" | "after");
                setSaved(false);
              }}
            >
              <option value="before">전</option>
              <option value="after">후</option>
            </select>
          </>
        ) : (
          <span>이벤트 발생 즉시 (수정 불가)</span>
        )}
      </div>

      <div className="popo-chip-row">
        <span>버튼</span>
        {policy.action_btns.length === 0 ? (
          <span className="popo-message-hint">없음</span>
        ) : (
          policy.action_btns.map((btn) => (
            <span key={btn} className="popo-chip">
              {ACTION_BTN_LABELS[btn] ?? btn}
            </span>
          ))
        )}
      </div>

      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}

      <div className="popo-message-footer">
        <span className="popo-message-updated">
          마지막 수정 {formatDateTime(policy.updated_at)}
        </span>
        <div>
          {saved && (
            <span className="popo-message-success" role="status">
              저장했습니다.{" "}
            </span>
          )}
          <button type="button" className="button small" onClick={handleSave}>
            저장
          </button>
        </div>
      </div>
    </section>
  );
}

function formatTiming(policy: PopoMessagePolicy): string {
  if (!policy.timing_anchor || policy.offset_minutes === null)
    return "즉시 발송";
  const anchor = ANCHOR_LABELS[policy.timing_anchor];
  const minutes = Math.abs(policy.offset_minutes);
  if (minutes === 0) return `${anchor} 정각`;
  return `${anchor} ${minutes}분 ${policy.offset_minutes < 0 ? "전" : "후"}`;
}

export function PopoMessagesPage() {
  const { data, error } = useFetch<PopoMessagePolicy[]>(
    "/api/manager/v1/popo-messages",
    "포포 메시지를 불러오지 못했습니다.",
  );
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const [policies, setPolicies] = useState<PopoMessagePolicy[]>([]);

  useEffect(() => {
    if (data) setPolicies(data);
  }, [data]);

  const selected =
    policies.find((policy) => policy.type === selectedType) ?? policies[0];

  const handleSave = async (next: PopoMessagePolicy) => {
    const updated = await api.patch<PopoMessagePolicy>(
      `/api/manager/v1/popo-messages/${next.type}`,
      {
        message: next.message,
        enabled: next.enabled,
        offset_minutes: next.offset_minutes,
      },
    );
    setPolicies((prev) =>
      prev.map((policy) => (policy.type === updated.type ? updated : policy)),
    );
  };

  return (
    <div>
      <div className="page-header">
        <h2>포포 메시지 정책</h2>
      </div>
      <p className="popo-messages-notice">
        포포 메시지의 문구, 발송 여부, 기준 시각 대비 발송 시점을 관리합니다.
        <br />
        발송 예약이 걸리는 조건과 취소 흐름은 로직에 해당하므로 이 페이지에서는
        설명만 제공하며, 변경하려면 코드를 수정해야 합니다. 변경한 정책은 이후에
        새로 만들어지는 예약부터 적용되고, 이미 예약된 메시지는 그대로
        발송됩니다.
      </p>
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
      <div className="popo-messages-layout">
        <ul className="popo-message-list" aria-label="포포 메시지 목록">
          {policies.map((policy) => (
            <li key={policy.type}>
              <button
                type="button"
                className={`popo-message-item${
                  policy.type === selected?.type ? " active" : ""
                }${policy.enabled ? "" : " disabled"}`}
                aria-current={policy.type === selected?.type}
                onClick={() => setSelectedType(policy.type)}
              >
                <span className="popo-message-item-title">{policy.title}</span>
                <span className="popo-message-type">{policy.type}</span>
                <span className="popo-message-item-meta">
                  {formatTiming(policy)}
                </span>
                {!policy.enabled && (
                  <span className="popo-chip">발송 안 함</span>
                )}
              </button>
            </li>
          ))}
        </ul>
        <div className="popo-message-detail">
          {selected && (
            <PopoMessageCard
              key={selected.type}
              policy={selected}
              onSave={handleSave}
            />
          )}
        </div>
      </div>
    </div>
  );
}
