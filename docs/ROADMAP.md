# Roadmap

## Current state

- **Firewall Policy**: 5 scenarios, behavioral grading, AI feedback
- **Network Interfaces**: 3 configuration scenarios (exact-value grading)
- **Port Assignment**: 5 scenarios using a visual chassis diagram
- Fixed, simplified topology: WAN / LAN / DMZ only
- No locked progression -- all exercises accessible at any time
- AI tutor (NVIDIA NIM) gives Socratic feedback on failed submissions,
  structurally unable to reveal correct answer values

## Explicitly out of scope for now

These were considered and deliberately deferred, not forgotten:

- **Security Profiles, VPN, SD-WAN, System, Log & Report, User &
  Authentication** -- each is a genuinely separate engineering effort
  (new data model, new grading logic, new scenario types), not just a
  new GUI page. Adding any of these properly means repeating the full
  design -> engine -> scenario -> GUI process used for Policy & Objects
  and Network Interfaces.
- **NAT and Security Profile columns** shown in the Firewall Policy
  table are display-only simulated values, not configurable -- this
  keeps the table visually authentic without pretending those features
  work.
- **Multi-user accounts, instructor dashboards, progress persistence**
  -- all state is in-memory per browser session; refreshing resets
  progress. Would require a real database and auth layer.
- **Real FortiOS CLI/config-file parsing** -- the GUI writes directly to
  this project's own internal data model; this project is not parsing
  real FortiOS syntax.
- **Stateful filtering** (connection tracking, established/related) --
  the engine is stateless first-match-wins only, matching the scope of
  what the firewall policy scenarios currently teach.

## If/when expanding further

The repeatable pattern for adding a new exercise *type* (not just a new
scenario within an existing type) is:

1. Design the data model extension in `packages/engine/src/types.ts` or
   a new file, kept minimal -- only what's needed for the concept being
   taught.
2. Write the grader as a pure function, returning diagnostics only
   (never leaking correct values).
3. Author one scenario and prove it with the same correct/incorrect
   submission test pattern used throughout this project.
4. Add the backend route + AI feedback service, mirroring the existing
   ones.
5. Build the GUI page last, once the engine is proven.

This order (engine -> proof -> backend -> GUI) caught real bugs at every
stage of this project's history and should be followed for any future
exercise type.
