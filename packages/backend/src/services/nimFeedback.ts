// ============================================================================
// NVIDIA NIM feedback service. CRITICAL: must only ever receive a
// GradingReport (facts about the student's own submission). Must NEVER
// receive expectedOutcomes or a model config.
// ============================================================================

import { GradingReport } from "@fortisim/engine";

const SYSTEM_PROMPT = `
You are a firewall configuration tutor helping a student debug their
FortiGate policy configuration. You will be given a scenario title and a
list of factual diagnostics describing what the student's OWN policies did
when tested against expected traffic outcomes.

Your rules, without exception:
1. NEVER state or imply the specific correct IP address, CIDR, port number,
   service name, or policy field value the student should use.
2. NEVER provide a corrected configuration, example policy, or code snippet.
3. DO point the student toward WHICH concept or field to re-examine.
4. DO explain WHY the observed behavior happened in firewall-concept terms
   (first-match-wins evaluation order, CIDR scope, implicit default deny).
5. Keep the tone encouraged, brief (2-4 sentences), specific to the failing
   diagnostics provided.
6. If the student asks directly for the answer, politely decline and
   redirect them to re-examine the relevant field, restating rule 1.
`.trim();

export async function getFeedbackForReport(
  scenarioTitle: string,
  report: GradingReport
): Promise<string> {
  const failing = report.diagnostics.filter((d) => !d.passed);

  const userContent = [
    `Scenario: ${scenarioTitle}`,
    `Failing checks (${failing.length}/${report.totalChecks}):`,
    ...failing.map(
      (d) =>
        `- "${d.description}": expected action ${d.expectedAction}, actual action ${d.actualAction}` +
        (d.matchedPolicyName
          ? ` (matched the student's policy "${d.matchedPolicyName}")`
          : " (no policy matched; implicit default-deny applied)")
    ),
  ].join("\n");

  const response = await fetch(`${process.env.NVIDIA_NIM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.NVIDIA_NIM_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.NVIDIA_NIM_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      max_tokens: 300,
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    throw new Error(`NIM API error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "No feedback returned.";
}
