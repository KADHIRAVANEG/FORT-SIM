import { Scenario } from "@fortisim/engine";
import { webServerAccessScenario } from "@fortisim/engine";
import { dbLockdownScenario } from "@fortisim/engine";
import { dmzMultiServiceScenario } from "@fortisim/engine";
import { interZoneTrustScenario } from "@fortisim/engine";
import { fullNetworkPolicyScenario } from "@fortisim/engine";

const allScenarios: Scenario[] = [
  webServerAccessScenario,
  dbLockdownScenario,
  dmzMultiServiceScenario,
  interZoneTrustScenario,
  fullNetworkPolicyScenario,
];

export function listScenarios(): Pick<Scenario, "id" | "title" | "description">[] {
  return allScenarios.map(({ id, title, description }) => ({ id, title, description }));
}

export function getScenarioById(id: string): Scenario | undefined {
  return allScenarios.find((s) => s.id === id);
}

export function getStudentFacingScenario(id: string) {
  const scenario = getScenarioById(id);
  if (!scenario) return undefined;
  const { expectedOutcomes, ...studentFacing } = scenario;
  return studentFacing;
}
