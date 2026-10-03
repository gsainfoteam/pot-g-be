import { FormEvent, useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import { useCurrentManager } from "../lib/current-manager";

// 서버의 AdminAccountRole enum 값과 맞춰야 합니다.
const ROLE_ADMIN = 0;
const ROLE_SUPERADMIN = 1;

type AdminAccountDto = {
  pk: string;
  email: string;
  role: number;
  created_at: string;
  updated_at: string;
};

const ROLE_LABEL: Record<number, string> = {
  [ROLE_ADMIN]: "admin",
  [ROLE_SUPERADMIN]: "superadmin",
};

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    try {
      const body = JSON.parse(err.message);
      if (typeof body.message === "string") return body.message;
    } catch {
      // JSON이 아니면 기본 문구를 사용합니다.
    }
    return `${fallback} (${err.status})`;
  }
  return fallback;
}

export function AdminAccountsPage() {
  const me = useCurrentManager();
  const isSuperAdmin = me.role === ROLE_SUPERADMIN;

  const [accounts, setAccounts] = useState<AdminAccountDto[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(ROLE_ADMIN);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setAccounts(
        await api.get<AdminAccountDto[]>("/api/manager/v1/admin-account"),
      );
    } catch (err) {
      setError(errorMessage(err, "관리자 목록을 불러오지 못했습니다."));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/api/manager/v1/admin-account", {
        email: email.trim(),
        role,
      });
      setEmail("");
      setRole(ROLE_ADMIN);
      await load();
    } catch (err) {
      setError(errorMessage(err, "관리자를 추가하지 못했습니다."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (account: AdminAccountDto) => {
    if (!window.confirm(`${account.email} 계정을 제거할까요?`)) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.delete(`/api/manager/v1/admin-account/${account.pk}`);
      await load();
    } catch (err) {
      setError(errorMessage(err, "관리자를 제거하지 못했습니다."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (account: AdminAccountDto, next: number) => {
    setSubmitting(true);
    setError(null);
    try {
      await api.patch(`/api/manager/v1/admin-account/${account.pk}`, {
        role: next,
      });
      await load();
    } catch (err) {
      setError(errorMessage(err, "권한을 변경하지 못했습니다."));
    } finally {
      setSubmitting(false);
    }
  };

  const isSelf = (account: AdminAccountDto) =>
    account.email.toLowerCase() === me.email.toLowerCase();

  return (
    <>
      <div className="page-header">
        <h2>관리자 계정</h2>
      </div>

      {error && <p className="error-text">{error}</p>}

      {isSuperAdmin ? (
        <form className="inline-form" onSubmit={handleAdd}>
          <input
            type="email"
            value={email}
            placeholder="name@gm.gist.ac.kr"
            onChange={(e) => setEmail(e.target.value)}
          />
          <select
            value={role}
            onChange={(e) => setRole(Number(e.target.value))}
          >
            <option value={ROLE_ADMIN}>admin</option>
            <option value={ROLE_SUPERADMIN}>superadmin</option>
          </select>
          <button className="button small" type="submit" disabled={submitting}>
            추가
          </button>
        </form>
      ) : (
        <p className="placeholder">
          관리자 추가/제거는 superadmin만 할 수 있습니다.
        </p>
      )}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>이메일</th>
              <th>권한</th>
              <th>등록일</th>
              <th>수정일</th>
              {isSuperAdmin && <th />}
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.pk}>
                <td>
                  {account.email}
                  {isSelf(account) && " (나)"}
                </td>
                <td>
                  {isSuperAdmin && !isSelf(account) ? (
                    <select
                      className={`role-select ${ROLE_LABEL[account.role]}`}
                      value={account.role}
                      disabled={submitting}
                      onChange={(e) =>
                        handleRoleChange(account, Number(e.target.value))
                      }
                    >
                      <option value={ROLE_ADMIN}>admin</option>
                      <option value={ROLE_SUPERADMIN}>superadmin</option>
                    </select>
                  ) : (
                    <span className={`role-badge ${ROLE_LABEL[account.role]}`}>
                      {ROLE_LABEL[account.role] ?? account.role}
                    </span>
                  )}
                </td>
                <td>{formatDateTime(account.created_at)}</td>
                <td>{formatDateTime(account.updated_at)}</td>
                {isSuperAdmin && (
                  <td>
                    {!isSelf(account) && account.role !== ROLE_SUPERADMIN && (
                      <button
                        className="button danger small"
                        onClick={() => handleRemove(account)}
                        disabled={submitting}
                      >
                        제거
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {accounts.length === 0 && (
              <tr>
                <td colSpan={isSuperAdmin ? 5 : 4} className="placeholder">
                  등록된 관리자가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
