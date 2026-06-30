import { Router } from "express";
import { gradePortSubmission, PortSubmission, ALL_PORT_SCENARIOS } from "@fortisim/engine";

export const portSubmissionsRouter = Router();

function getScenario(id: string) {
  return ALL_PORT_SCENARIOS.find((s) => s.id === id);
}

portSubmissionsRouter.post("/:scenarioId/grade", (req, res) => {
  const scenario = getScenario(req.params.scenarioId);
  if (!scenario) return res.status(404).json({ error: "Scenario not found" });
  const report = gradePortSubmission(scenario, req.body as PortSubmission);
  res.json(report);
});
