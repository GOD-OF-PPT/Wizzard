import type { TableStatusText } from "../web/table-status";

export function TableStatus({ status }: { status: TableStatusText }) {
  return <div className="table-turn" id="table-turn-info" role="status" aria-atomic="true">
    <span className="table-turn__phase">{status.phase}</span>
    <div className="table-turn__message">
      {status.prefix && <span>{status.prefix}</span>}
      {status.who && <strong title={status.who}>{status.who}</strong>}
      <span>{status.action}</span>
    </div>
  </div>;
}
