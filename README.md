# FortiSim — FortiGate Configuration Training Simulator

An interactive web-based training platform where students learn firewall and
network configuration by working in a FortiOS-styled interface, get graded
on the *behavior* and *correctness* of their configuration (not exact text
matching), and receive Socratic, non-answer-revealing hints from an AI tutor
(NVIDIA NIM) when they get something wrong.

Built for classroom use alongside a real FortiGate 6000F lab unit, so the
visual language and workflow are intentionally modeled on the real FortiOS
web admin console.

## What students practice

### Firewall Policy (5 scenarios)
Students configure firewall policies — source/destination addresses,
services, actions, logging — and the engine runs a battery of simulated
test packets against their configuration to verify the resulting traffic
behavior matches what the exercise requires.

1. **Web Server Access** — interface direction, service matching, default-deny
2. **Database Server Lockdown** — rule-order sensitivity (first-match-wins)
3. **DMZ Multi-Service** — configuring multiple required services correctly
4. **Inter-Zone Trust** — asymmetric zone rules (one direction allowed, not the reverse)
5. **Full Network Policy** — composing a complete multi-zone policy set

### Network Interfaces (3 scenarios)
Students configure interface IP addresses, subnets, and administrative
access settings for the WAN/LAN/DMZ zones.

1. **Interface IP Assignment** — assigning correct IPs and subnets
2. **Administrative Access Control** — restricting management protocols per zone
3. **Full Interface Setup** — complete interface configuration from scratch

### Port Assignment (5 scenarios)
Students assign physical chassis ports to logical zones using a visual
FortiGate-style chassis diagram.

1. **Basic Port Assignment**
2. **Multi-Server DMZ**
3. **Redundant WAN Uplinks**
4. **Larger Office Network**
5. **Don't Assume by Position**

All exercises are accessible at any time — there is no locked progression.
Every submission is graded immediately, and on a failed submission an AI
tutor (via NVIDIA NIM) gives conceptual, non-prescriptive feedback: it
explains *why* something is wrong without ever stating the correct value.

## Project structure
fortisim/
├── docker-compose.yml
├── package.json
├── .gitignore
│
├── docs/
│   ├── ARCHITECTURE.md       — end-to-end data flow, why answer keys never leak
│   ├── SCENARIO_AUTHORING.md — how to write a new firewall policy scenario
│   └── ROADMAP.md            — phase plan and what's deliberately out of scope
│
└── packages/
├── engine/    — pure TypeScript: data model, matching logic, graders.
│                No framework dependency. Shared by frontend (instant
│                local "test connectivity") and backend (authoritative
│                grading) so there is exactly one implementation of
│                "how this is evaluated" anywhere in the system.
│
├── backend/   — Express API. The only place that holds scenario answer
│                keys and the NVIDIA NIM API key. Grades submissions,
│                proxies AI feedback requests with diagnostics only
│                (never the correct answer).
│
└── frontend/  — React + Vite. The FortiOS-styled console students
interact with: sidebar navigation, Firewall Policy /
Addresses / Services pages, Network Interfaces page
with the visual port-assignment chassis diagram.
## Running locally

Requires Docker and Docker Compose.

```bash
cp packages/backend/.env.example packages/backend/.env
# edit packages/backend/.env and set a real NVIDIA_NIM_API_KEY

docker compose up
```

Frontend: http://localhost:5173
Backend health check: http://localhost:4000/api/health

The frontend dev server proxies `/api` requests to the backend container
over the Docker Compose network (`http://backend:4000`), not `localhost`,
since the proxy config runs inside the frontend container.

## Why answer keys and API keys never reach the browser

This is a structural guarantee, not just a convention:

- `getStudentFacingScenario()` in the backend strips `expectedOutcomes`
  (the answer key) before any scenario is sent to the frontend.
- The AI feedback service only ever receives a `GradingReport` —
  diagnostic facts about what the *student's own* configuration did —
  never the scenario's correct values. The AI cannot leak what it was
  never given.
- The NVIDIA NIM API key lives only in the backend's `.env` file and is
  never included in any response sent to the client.

See `docs/ARCHITECTURE.md` for the full request flow diagram.

## Design principles this project follows

- **Minimal, focused scope.** This is a teaching tool for firewall and
  network fundamentals — not an attempt to replicate every FortiOS
  feature. Sections not yet built (Security Profiles, VPN, SD-WAN, etc.)
  are deliberately left out rather than added as broken placeholders.
- **Behavioral grading over exact-match grading.** Firewall policy
  scenarios are graded on the resulting traffic behavior (does the right
  traffic get accepted/denied), not on matching a specific configuration
  text — multiple valid configurations should all pass.
- **One evaluator, two consumers.** The same matching/grading logic
  backs both the student's instant local feedback and the backend's
  authoritative grade, so they can never disagree.
- **AI as a Socratic guide, never an answer key.** The AI tutor is
  structurally prevented from seeing correct values, not just prompted
  not to reveal them.

## Tech stack

- **Engine:** TypeScript, no runtime dependencies
- **Backend:** Node.js, Express
- **Frontend:** React, Vite, Tailwind CSS, React Router
- **AI:** NVIDIA NIM (Llama 3.1 70B Instruct)
- **Infrastructure:** Docker Compose, npm workspaces monorepo
