// ============================================================================
// The Grader: behavioral-equivalence scoring. Produces structured
// diagnostics ONLY -- facts about what happened, never the correct
// configuration values. Safe to hand straight to an AI feedback layer.
// ============================================================================

import { Scenario, StudentSubmission } from "./types";
import { evaluateAll, EvaluationResult } from "./evaluator";

export interface PacketDiagnostic {
  testPacketId: string;
  description: string;
  expectedAction: "ACCEPT" | "DENY";
  actualAction: "ACCEPT" | "DENY";
  passed: boolean;
  expectedLog?: boolean;
  actualLog: boolean;
  logPassed: boolean | null;
  matchedPolicyName: string | null;
}

export interface GradingReport {
  scenarioId: string;
  totalChecks: number;
  passedChecks: number;
  overallPassed: boolean;
  diagnostics: PacketDiagnostic[];
}

export function gradeSubmission(
  scenario: Scenario,
  submission: StudentSubmission
): GradingReport {
  const results: EvaluationResult[] = evaluateAll(
    scenario.testPackets,
    submission.policies,
    submission.addresses,
    submission.services
  );

  const resultsByPacketId = new Map(results.map((r) => [r.packetId, r]));

  const diagnostics: PacketDiagnostic[] = scenario.expectedOutcomes.map((expected) => {
    const result = resultsByPacketId.get(expected.testPacketId);
    const packetDef = scenario.testPackets.find((p) => p.id === expected.testPacketId);

    if (!result || !packetDef) {
      throw new Error(
        `Scenario "${scenario.id}" references testPacketId "${expected.testPacketId}" with no matching TestPacket definition.`
      );
    }

    const actionPassed = result.finalAction === expected.expectedAction;
    let logPassed: boolean | null = null;
    if (expected.expectedLog !== undefined) {
      logPassed = result.loggedByPolicy === expected.expectedLog;
    }

    const matchedPolicy = result.matchedPolicyId
      ? submission.policies.find((p) => p.id === result.matchedPolicyId) ?? null
      : null;

    return {
      testPacketId: expected.testPacketId,
      description: packetDef.description,
      expectedAction: expected.expectedAction,
      actualAction: result.finalAction,
      passed: actionPassed && (logPassed === null || logPassed === true),
      expectedLog: expected.expectedLog,
      actualLog: result.loggedByPolicy,
      logPassed,
      matchedPolicyName: matchedPolicy ? matchedPolicy.name : null,
    };
  });

  const passedChecks = diagnostics.filter((d) => d.passed).length;

  return {
    scenarioId: scenario.id,
    totalChecks: diagnostics.length,
    passedChecks,
    overallPassed: passedChecks === diagnostics.length,
    diagnostics,
  };
}
