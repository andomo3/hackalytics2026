import { useMemo, useState } from "react";

import AlertPanel from "./AlertPanel";
import ScenarioCalendar from "./ScenarioCalendar";
import SeattleMap from "./SeattleMap";
import TimelineSlider from "./TimelineSlider";
import { useFetchScenario } from "../hooks/useFetchScenario";

export default function Dashboard() {
  const [selectedScenario, setSelectedScenario] = useState("scenario_a_normal_exit");
  const [currentTimestamp, setCurrentTimestamp] = useState(0);
  const { data, loading, error } = useFetchScenario(selectedScenario);

  const frame = useMemo(() => {
    if (!data?.timeline) return null;
    return data.timeline[currentTimestamp] || null;
  }, [data, currentTimestamp]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6">
      <header className="rounded-xl border border-slate-600 bg-slate-900/70 p-4">
        <h1 className="text-2xl font-semibold">SafeTransit Command Center</h1>
        <p className="mt-1 text-sm text-slate-300">
          AI-assisted crowd crush prevention for Seattle World Cup transit safety.
        </p>
      </header>

      <ScenarioCalendar selectedScenario={selectedScenario} onSelectScenario={setSelectedScenario} />

      <TimelineSlider minute={currentTimestamp} onChange={setCurrentTimestamp} />

      {loading && <p className="text-sm text-slate-300">Loading scenario timeline...</p>}
      {error && <p className="text-sm text-red-300">Error: {error}</p>}

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SeattleMap frame={frame} />
        </div>
        <div className="lg:col-span-1">
          <AlertPanel frame={frame} />
        </div>
      </section>
    </main>
  );
}
