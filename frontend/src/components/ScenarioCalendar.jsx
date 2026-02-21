const defaultScenarios = [
  {
    id: "scenario_a_normal_exit",
    label: "Scenario A",
    sublabel: "Normal Exit",
  },
  {
    id: "scenario_b_close_game",
    label: "Scenario B",
    sublabel: "Close Game",
  },
  {
    id: "scenario_c_blowout_q3",
    label: "Scenario C",
    sublabel: "Blowout Q3",
  },
];

export default function ScenarioCalendar({
  selectedScenario,
  onSelectScenario,
  scenarios = defaultScenarios,
}) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {scenarios.map((scenario) => {
        const selected = scenario.id === selectedScenario;
        return (
          <button
            key={scenario.id}
            onClick={() => onSelectScenario(scenario.id)}
            className={[
              "rounded-xl border px-4 py-3 text-left transition",
              selected
                ? "border-emerald-300 bg-emerald-400/20"
                : "border-slate-500 bg-slate-900/60 hover:bg-slate-800/70",
            ].join(" ")}
          >
            <div className="text-sm font-medium text-slate-200">{scenario.label}</div>
            <div className="text-lg font-semibold">{scenario.sublabel || scenario.label}</div>
          </button>
        );
      })}
    </div>
  );
}
