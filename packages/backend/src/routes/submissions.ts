// ============================================================================
// POST /api/submissions/:scenarioId/grade     -> fast grading, no AI
// POST /api/submissions/:scenarioId/feedback  -> grading + AI feedback if failed
// ============================================================================

import { Router } from "express";
import { gradeSubmission, StudentSubmission } from "@fortisim/engine";
import { getScenarioById } from "../scenarios/registry";
import { getFeedbackForReport } from "../services/nimFeedback";

export const submissionsRouter = Router();

submissionsRouter.post("/:scenarioId/grade", (req, res) => {
  const scenario = getScenarioById(req.params.scenarioId);
  if (!scenario) {
    return res.status(404).json({ error: `Scenario "${req.params.scenarioId}" not found` });
  }
  const submission = req.body as StudentSubmission;
  const report = gradeSubmission(scenario, submission);
  res.json(report);
});

submissionsRouter.post("/:scenarioId/feedback", async (req, res) => {
  const scenario = getScenarioById(req.params.scenarioId);
  if (!scenario) {
    return res.status(404).json({ error: `Scenario "${req.params.scenarioId}" not found` });
  }
  const submission = req.body as StudentSubmission;
  const report = gradeSubmission(scenario, submission);

  if (report.overallPassed) {
    return res.json({ report });
  }

  try {
    const aiRemark = await getFeedbackForReport(scenario.title, report);
    res.json({ report, aiRemark });
  } catch (err) {
    console.error("NIM feedback call failed:", err);
    res.json({ report, aiRemark: null, aiError: "Feedback service unavailable" });
  }
});
