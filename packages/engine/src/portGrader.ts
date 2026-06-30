import { PortScenario, PortSubmission, PortGradingReport, PortCheckResult } from "./interfaceTypes";

export function gradePortSubmission(
  scenario: PortScenario,
  submission: PortSubmission
): PortGradingReport {
  const assignmentMap = new Map(submission.assignments.map((a) => [a.portId, a.zone]));

  const results: PortCheckResult[] = scenario.checks.map((check) => {
    const studentZone = assignmentMap.get(check.portId) ?? "unassigned";
    return {
      portId: check.portId,
      description: check.description,
      passed: studentZone === check.expectedZone,
      studentZone,
    };
  });

  const passedChecks = results.filter((r) => r.passed).length;
  return {
    scenarioId: scenario.id,
    totalChecks: results.length,
    passedChecks,
    overallPassed: passedChecks === results.length,
    results,
  };
}
