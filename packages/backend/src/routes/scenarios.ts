// ============================================================================
// GET /api/scenarios        -> list available scenarios (metadata only)
// GET /api/scenarios/:id    -> student-facing scenario detail (no answer key)
// ============================================================================

import { Router } from "express";
import { listScenarios, getStudentFacingScenario } from "../scenarios/registry";

export const scenariosRouter = Router();

scenariosRouter.get("/", (_req, res) => {
  res.json(listScenarios());
});

scenariosRouter.get("/:id", (req, res) => {
  const scenario = getStudentFacingScenario(req.params.id);
  if (!scenario) {
    return res.status(404).json({ error: `Scenario "${req.params.id}" not found` });
  }
  res.json(scenario);
});
