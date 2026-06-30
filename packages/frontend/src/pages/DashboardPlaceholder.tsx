// ============================================================================
// Landing page after login: a real scenario picker. Lists every scenario
// the backend knows about, lets the student pick one, which calls
// session.selectScenario() to switch the shared session state, then
// navigates them to Firewall Policy to start working.
// ============================================================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchScenarioList } from "../api/client";
import { ScenarioSession } from "../hooks/useScenarioSession";

interface DashboardProps {
  session: ScenarioSession;
}

interface ScenarioSummary {
  id: string;
  title: string;
  description: string;
}

export function DashboardPlaceholder({ session }: DashboardProps) {
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState<ScenarioSummary[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  useEffect(() => {
    fetchScenarioList()
      .then(setScenarios)
      .catch((err) => setListError(err.message ?? "Failed to load scenario list"));
  }, []);

  function handleSelect(id: string) {
    session.selectScenario(id);
    navigate("/policy/firewall-policy");
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-[15px] font-semibold text-forti-dark mb-1">Welcome to FortiSim</h1>
      <p className="text-gray-500 mb-5">
        Choose an exercise below to begin. Selecting a new exercise resets your current policy configuration.
      </p>

      <div className="flex gap-3 mb-6">
        <div className="bg-white border border-gray-200 rounded-md px-4 py-3 flex-1">
          <div className="text-[11px] text-gray-500 uppercase tracking-wide">Active Scenario</div>
          <div className="mt-1 text-sm font-medium text-gray-700">
            {session.scenario ? session.scenario.title : "—"}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-md px-4 py-3 flex-1">
          <div className="text-[11px] text-gray-500 uppercase tracking-wide">Mode</div>
          <div className="mt-1 text-sm font-medium text-emerald-600">Training (Stateless)</div>
        </div>
      </div>

      {listError && <div className="text-red-600 text-[12.5px] mb-4">{listError}</div>}

      {!scenarios && !listError && (
        <div className="text-gray-500 text-[12.5px]">Loading exercises…</div>
      )}

      {scenarios && (
        <div className="space-y-3">
          {scenarios.map((s) => (
            <div key={s.id} className="bg-white border border-gray-200 rounded-md p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[13px] font-medium text-gray-800 flex items-center gap-2">
                    {s.title}
                    {session.scenarioId === s.id && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded font-medium">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 mt-1 text-[12.5px] leading-relaxed">{s.description}</p>
                </div>
                <button
                  onClick={() => handleSelect(s.id)}
                  className="shrink-0 px-3 py-1.5 bg-forti-red text-white rounded-sm text-[12.5px] hover:bg-forti-red/90 whitespace-nowrap"
                >
                  {session.scenarioId === s.id ? "Continue" : "Start Exercise"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
