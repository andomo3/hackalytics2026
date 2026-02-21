function minuteToHHMM(minute) {
  const h = String(Math.floor(minute / 60)).padStart(2, "0");
  const m = String(minute % 60).padStart(2, "0");
  return `${h}:${m}`;
}

export default function TimelineSlider({ minute, onChange }) {
  return (
    <div className="rounded-xl border border-slate-600 bg-slate-900/70 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-slate-300">24-Hour Timeline</span>
        <span className="font-mono text-emerald-300">{minuteToHHMM(minute)}</span>
      </div>
      <input
        type="range"
        min={0}
        max={1439}
        value={minute}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer accent-emerald-400"
      />
    </div>
  );
}
