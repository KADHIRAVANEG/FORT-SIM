// ============================================================================
// Unified Tasks landing page (new first page of the app). Lists every
// exercise across all three tracks (Firewall Policy, Interfaces, Port
// Assignment) as a single difficulty-ordered list. Clicking a firewall
// policy task selects that scenario and navigates to Firewall Policy;
// interface/port tasks navigate to the Interfaces page with the right
// track pre-selected.
// ============================================================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchScenarioList } from "../api/client";
import { ALL_INTERFACE_SCENARIOS, ALL_PORT_SCENARIOS } from "@fortisim/engine";
import { ScenarioSession } from "../hooks/useScenarioSession";

interface TasksPageProps {
  session: ScenarioSession;
}

interface TaskEntry {
  id: string;
  title: string;
  description: string;
  track: "policy" | "interface" | "port";
  difficulty: number; // 1-5, lower = easier, used for ordering across tracks
}

export function TasksPage({ session }: TasksPageProps) {
  const navigate = useNavigate();
  const [policyScenarios, setPolicyScenarios] = useState<{ id: string; title: string; description: string }[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchScenarioList()
      .then(setPolicyScenarios)
      .catch((err) => setError(err.message ?? "Failed to load tasks"));
  }, []);

  if (error) {
    return <div className="text-red-600 text-[12.5px]">{error}</div>;
  }
  if (!policyScenarios) {
    return <div className="text-gray-500 text-[12.5px]">Loading tasks…</div>;
  }

  // Interleave tracks in a sensible difficulty progression: port assignment
  // and interface basics first (foundational), then firewall policy tasks
  // (which build on having a configured network), roughly ordered by the
  // conceptual complexity each task's title/description implies.
  const tasks: TaskEntry[] = [
    { id: ALL_PORT_SCENARIOS[0].id, title: ALL_PORT_SCENARIOS[0].title, description: ALL_PORT_SCENARIOS[0].description, track: "port", difficulty: 1 },
    { id: ALL_INTERFACE_SCENARIOS[0].id, title: ALL_INTERFACE_SCENARIOS[0].title, description: ALL_INTERFACE_SCENARIOS[0].description, track: "interface", difficulty: 1 },
    { id: ALL_INTERFACE_SCENARIOS[1].id, title: ALL_INTERFACE_SCENARIOS[1].title, description: ALL_INTERFACE_SCENARIOS[1].description, track: "interface", difficulty: 2 },
    { id: ALL_PORT_SCENARIOS[1].id, title: ALL_PORT_SCENARIOS[1].title, description: ALL_PORT_SCENARIOS[1].description, track: "port", difficulty: 2 },
    { id: policyScenarios[0].id, title: policyScenarios[0].title, description: policyScenarios[0].description, track: "policy", difficulty: 3 },
    { id: ALL_PORT_SCENARIOS[2].id, title: ALL_PORT_SCENARIOS[2].title, description: ALL_PORT_SCENARIOS[2].description, track: "port", difficulty: 3 },
    { id: policyScenarios[1].id, title: policyScenarios[1].title, description: policyScenarios[1].description, track: "policy", difficulty: 4 },
    { id: ALL_INTERFACE_SCENARIOS[2].id, title: ALL_INTERFACE_SCENARIOS[2].title, description: ALL_INTERFACE_SCENARIOS[2].description, track: "interface", difficulty: 4 },
    { id: policyScenarios[2].id, title: policyScenarios[2].title, description: policyScenarios[2].description, track: "policy", difficulty: 5 },
    { id: ALL_PORT_SCENARIOS[3].id, title: ALL_PORT_SCENARIOS[3].title, description: ALL_PORT_SCENARIOS[3].description, track: "port", difficulty: 5 },
    { id: policyScenarios[3].id, title: policyScenarios[3].title, description: policyScenarios[3].description, track: "policy", difficulty: 6 },
    { id: ALL_PORT_SCENARIOS[4].id, title: ALL_PORT_SCENARIOS[4].title, description: ALL_PORT_SCENARIOS[4].description, track: "port", difficulty: 6 },
    { id: policyScenarios[4].id, title: policyScenarios[4].title, description: policyScenarios[4].description, track: "policy", difficulty: 7 },
  ].sort((a, b) => a.difficulty - b.difficulty);

  const trackLabels: Record<string, string> = {
    policy: "Firewall Policy",
    interface: "Interface Config",
    port: "Port Assignment",
  };
  const trackColors: Record<string, string> = {
    policy: "bg-red-100 text-red-700",
    interface: "bg-blue-100 text-blue-700",
    port: "bg-emerald-100 text-emerald-700",
  };

  function handleSelect(task: TaskEntry) {
    if (task.track === "policy") {
      session.selectScenario(task.id);
      navigate("/policy/firewall-policy");
    } else {
      // Interfaces page reads its own scenario list internally; just
      // navigate there. Query param signals which track/scenario to
      // preselect, read by InterfacesPage.
      navigate(`/network/interfaces?track=${task.track}&scenario=${task.id}`);
    }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-lg font-semibold text-forti-dark mb-1">Tasks</h1>
      <p className="text-gray-500 text-[12.5px] mb-5">
        All exercises, ordered from easiest to hardest. Complete them in any order — start with the basics
        if you're new to firewall configuration.
      </p>

      <div className="space-y-2.5">
        {tasks.map((task, idx) => {
          const completed = session.completedTaskIds.has(task.id);
          return (
            <div
              key={task.id}
              onClick={() => handleSelect(task)}
              className={`bg-white border rounded-md p-4 cursor-pointer hover:shadow-sm transition-all ${
                completed ? "border-emerald-300" : "border-gray-200 hover:border-forti-red"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 ${
                  completed ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-500"
                }`}>
                  {completed ? "✓" : idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[13.5px] font-medium text-gray-800">{task.title}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${trackColors[task.track]}`}>
                      {trackLabels[task.track]}
                    </span>
                    {completed && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-emerald-100 text-emerald-700">
                        Completed
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-gray-500 leading-relaxed">{task.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
