import { POT_STATUS_LABEL } from "../lib/pot";

export function PotStatusBadge({ status }: { status: string }) {
  return (
    <span className={`status-badge status-${status.toLowerCase()}`}>
      {POT_STATUS_LABEL[status] ?? status}
    </span>
  );
}
