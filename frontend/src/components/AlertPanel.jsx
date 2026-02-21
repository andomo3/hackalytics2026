export default function AlertPanel({ frame }) {
  const threat = Number(frame?.egress_threat_score || 0);
  const severity = frame?.severity || 1;
  const message =
    frame?.alert_message ||
    (threat > 0.5
      ? "Crowd Crush Risk detected. Activate rerouting protocols."
      : "No active crowd crush risk.");

  return (
    <div className="rounded-xl border border-slate-600 bg-slate-900/70 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm uppercase tracking-wide text-slate-300">Safety Alerts</h3>
        <span
          className={[
            "rounded-full px-2 py-1 text-xs font-semibold",
            threat > 0.5 ? "bg-red-500/20 text-red-200" : "bg-emerald-500/20 text-emerald-200",
          ].join(" ")}
        >
          Severity {severity}
        </span>
      </div>
      <p className="text-sm text-slate-100">{message}</p>
      <p className="mt-3 text-xs text-slate-400">
        Threat score: <span className="font-mono">{threat.toFixed(2)}</span>
      </p>
    </div>
  );
}
