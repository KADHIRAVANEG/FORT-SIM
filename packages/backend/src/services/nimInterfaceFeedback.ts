// ============================================================================
// AI feedback for interface configuration grading.
// Same principle as nimFeedback.ts: AI only sees diagnostic facts,
// never the correct values. Hints are conceptual, not prescriptive.
// ============================================================================

import { InterfaceGradingReport } from "@fortisim/engine";

const SYSTEM_PROMPT = `
You are a network configuration tutor helping a student configure FortiGate
firewall interfaces. You will be given a list of factual diagnostics describing
which interface fields the student configured incorrectly.

Your rules, without exception:
1. NEVER state the correct IP address, subnet mask, or specific access protocol value.
2. NEVER provide a corrected configuration or example settings.
3. DO explain WHY the concept matters (e.g. why WAN should not have SSH access,
   why each zone needs its own subnet, what admin access controls).
4. DO point the student toward WHICH interface and WHICH field to re-examine.
5. Keep it brief (2-4 sentences), encouraging, and specific to the failing checks.
`.trim();

export async function getFeedbackForInterfaceReport(
  scenarioTitle: string,
  report: InterfaceGradingReport
): Promise<string> {
  const failing = report.results.filter((r) => !r.passed);

  const userContent = [
    `Scenario: ${scenarioTitle}`,
    `Failing checks (${failing.length}/${report.totalChecks}):`,
    ...failing.map(
      (r) => `- "${r.description}" on interface "${r.interfaceName}" (field: ${r.field}): student set "${Array.isArray(r.studentValue) ? r.studentValue.join(", ") : r.studentValue}"`
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

  if (!response.ok) throw new Error(`NIM error: ${response.status}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "No feedback returned.";
}
