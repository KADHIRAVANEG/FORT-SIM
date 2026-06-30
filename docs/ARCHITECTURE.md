# Architecture: how a grading request flows end to end
Good catch — that's a real gap. We designed ARCHITECTURE.md, SCENARIO_AUTHORING.md, and ROADMAP.md content together earlier in this conversation (back when we built the engine), but those were only ever created in my sandbox, never delivered to your actual machine through a terminal command — same root cause as the index.ts and docker-compose.yml gaps we hit before. The README is referencing files that don't exist in your repo.

Let's fix this properly. Run from ~/fortisim:
bash

mkdir -p docs

docs/ARCHITECTURE.md:
bash

cat > docs/ARCHITECTURE.md << 'EOF'
# Architecture: how a grading request flows end to end

Browser (React frontend)
|
| Student edits configuration (policy/interface/port)
|
| [Test Connectivity] --------> calls @fortisim/engine's evaluatePacket()
| directly in-browser. No network call.
| Instant local feedback before submitting.
|
| [Submit for Grading] --------> POST /api/submissions/:id/feedback
v (or /api/interface-submissions/...,
/api/port-submissions/...)
Express backend
|
| 1. getScenarioById(id) -> includes the answer key
| (expectedOutcomes / checks) -- NEVER sent to the frontend
|
| 2. gradeSubmission(scenario, submission)
| -> calls @fortisim/engine's evaluator/grader functions
| -> produces a GradingReport: facts only, no answer key
|
| 3. if report.overallPassed:
| return { report }
| else:
| getFeedbackForReport(title, report)
| -> calls NVIDIA NIM with ONLY the GradingReport diagnostics
| + a system prompt forbidding answer disclosure
| return { report, aiRemark }
## Why the answer key never reaches the AI or the browser

Two independent layers enforce "the AI must not give the answer directly":

1. **Structural (the real guarantee).** `getStudentFacingScenario()` strips
   the answer key (`expectedOutcomes` for policy scenarios, `checks` for
   interface/port scenarios) before any scenario data is sent to the
   frontend. The AI feedback functions (`getFeedbackForReport`,
   `getFeedbackForInterfaceReport`) only ever receive a grading report —
   which by construction contains only facts about the *student's own*
   submission, never the scenario's correct values. The AI model is never
   in possession of "the answer" at all, so it cannot leak what it
   doesn't have, regardless of how it's prompted.

2. **Prompt-level (defense in depth, not the primary guarantee).** The
   system prompts in `nimFeedback.ts` / `nimInterfaceFeedback.ts`
   explicitly instruct the model to redirect rather than answer if a
   student asks directly. This matters for tone, but it is NOT what's
   relied on to prevent leakage -- that's layer 1's job.

## Why one evaluator, not two

`evaluatePacket()` / `evaluateAll()` in `@fortisim/engine` are imported
unchanged by both frontend (instant local "Test Connectivity") and
backend (authoritative grading). If these ever diverged, a student could
see their test connectivity tool say "ACCEPT" and then get graded as
"DENY" for the same input -- confusing and untrustworthy. Any change to
matching semantics happens in `@fortisim/engine` only.

The same principle applies to interface and port grading
(`gradeInterfaceSubmission`, `gradePortSubmission`): the grading logic
lives in the engine package, not duplicated in route handlers.

## Three parallel grading tracks

The project has three independent scenario/grading tracks, each with its
own types, grader, and scenario list, but following the same shape:

| Track | Scenario type | Grader | Answer key field |
|---|---|---|---|
| Firewall Policy | `Scenario` | `gradeSubmission` | `expectedOutcomes` |
| Interface Config | `InterfaceScenario` | `gradeInterfaceSubmission` | `checks` |
| Port Assignment | `PortScenario` | `gradePortSubmission` | `checks` |

Firewall Policy grading is *behavioral* (run test packets, compare
resulting ACCEPT/DENY outcomes). Interface and Port grading is *exact
value* (compare submitted field values against expected values) -- a
simpler model appropriate for configuration values that don't have
"equally valid alternatives" the way firewall policies do.
